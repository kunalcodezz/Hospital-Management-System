import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { DoctorProfile } from "../models/DoctorProfile";
import { Appointment } from "../models/Appointment";
import { ApiError } from "../middleware/error.middleware";
import { doctorProfileUpdateSchema } from "../validators/zod.validators";
import { ActivityLog } from "../models/ActivityLog";

async function logActivity(userId: any, ip: string, action: any, status: "success" | "failed", details: string) {
  try {
    await ActivityLog.create({ userId, ipAddress: ip, action, status, details });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

// Get all doctors (with optional search/filters)
export async function getDoctors(req: Request, res: Response, next: NextFunction) {
  try {
    const { department, search } = req.query;
    const filter: any = {};

    if (department) {
      filter.department = department;
    }

    let doctorProfiles = await DoctorProfile.find(filter).populate("userId", "name email profilePhoto");

    // Filter out orphaned profiles where the User account was deleted
    doctorProfiles = doctorProfiles.filter((profile: any) => profile.userId !== null && profile.userId !== undefined);

    if (search) {
      const searchStr = String(search).toLowerCase();
      doctorProfiles = doctorProfiles.filter((profile: any) => 
        profile.userId.name.toLowerCase().includes(searchStr)
      );
    }

    res.json({
      success: true,
      doctors: doctorProfiles
    });
  } catch (error) {
    next(error);
  }
}

// Get single doctor profile
export async function getDoctorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let profile;

    if (id === "me") {
      if (!req.user || req.user.role !== "doctor") {
        throw new ApiError(403, "Access denied: not a doctor");
      }
      profile = await DoctorProfile.findOne({ userId: req.user.id }).populate("userId", "name email profilePhoto");
    } else {
      profile = await DoctorProfile.findById(id).populate("userId", "name email profilePhoto");
      if (!profile) {
        profile = await DoctorProfile.findOne({ userId: id }).populate("userId", "name email profilePhoto");
      }
    }

    if (!profile || !profile.userId) {
      throw new ApiError(404, "Doctor profile not found");
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
}

// Update doctor profile (Qualifications, Experience, Availability calendar, Vacation mode, Consultation Fee)
export async function updateDoctorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== "doctor") {
      throw new ApiError(403, "Access denied: only doctors can perform this action");
    }

    const validated = doctorProfileUpdateSchema.parse(req.body);

    let profile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new DoctorProfile({ userId: req.user.id });
    }

    Object.assign(profile, validated);
    await profile.save();

    await logActivity(req.user.id, req.ip || "127.0.0.1", "profile_update", "success", "Doctor clinical profile updated");

    res.json({
      success: true,
      message: "Doctor profile updated successfully",
      profile
    });
  } catch (error) {
    next(error);
  }
}

// Get doctor dashboard analytics and schedules
export async function getDoctorDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== "doctor") {
      throw new ApiError(403, "Access denied: only doctors can access this panel");
    }

    const profile = await DoctorProfile.findOne({ userId: req.user.id });
    if (!profile) {
      throw new ApiError(404, "Doctor profile not found");
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all appointments for today
    const todayAppointments = await Appointment.find({
      doctorId: req.user.id,
      date: { $gte: todayStart, $lte: todayEnd }
    }).populate("patientId", "name email profilePhoto");

    // Separate into a patient queue (checked_in & in_progress)
    const patientQueue = todayAppointments.filter((app: any) => 
      app.status === "checked_in" || app.status === "in_progress"
    );

    // Calculate aggregated metrics
    const totalAppointmentsCount = await Appointment.countDocuments({ doctorId: req.user.id });
    const completedCount = await Appointment.countDocuments({ doctorId: req.user.id, status: "completed" });
    
    // Calculate total revenue from completed appointments
    const completedAppointments = await Appointment.find({ doctorId: req.user.id, status: "completed" }).populate("paymentId");
    let calculatedRevenue = 0;
    completedAppointments.forEach((app: any) => {
      if (app.paymentId && app.paymentId.amount) {
        calculatedRevenue += app.paymentId.amount;
      } else {
        calculatedRevenue += profile.consultationFee; // Fallback to doctor consult fee if payment details missing
      }
    });

    res.json({
      success: true,
      todayAppointments,
      patientQueue,
      revenue: calculatedRevenue,
      completedCount,
      totalAppointmentsCount,
      availabilityCalendar: profile.availabilityCalendar,
      vacationMode: profile.vacationMode,
      performanceMetrics: profile.performanceMetrics || { satisfactionRate: 100, punctuality: 100 }
    });
  } catch (error) {
    next(error);
  }
}
