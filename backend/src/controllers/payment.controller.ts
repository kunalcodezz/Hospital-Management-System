import { Request, Response, NextFunction } from "express";
import { Payment } from "../models/Payment";
import { Appointment } from "../models/Appointment";
import { DoctorProfile } from "../models/DoctorProfile";
import { ApiError } from "../middleware/error.middleware";
import { ActivityLog } from "../models/ActivityLog";
import { createPaymentSchema } from "../validators/zod.validators";

async function logActivity(userId: any, ip: string, action: any, status: "success" | "failed", details: string) {
  try {
    await ActivityLog.create({ userId, ipAddress: ip, action, status, details });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

// Pay a pending invoice (Simulated checkout gateway success)
export async function payInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      throw new ApiError(404, "Invoice not found");
    }

    if (payment.patientId.toString() !== req.user.id) {
      throw new ApiError(403, "Access denied: you do not own this invoice");
    }

    if (payment.paymentStatus === "paid") {
      throw new ApiError(400, "This invoice is already paid");
    }

    payment.paymentStatus = "paid";
    payment.transactionId = `TXN-CONFIRM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await payment.save();

    // Confirm the appointment status as confirmed
    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment && appointment.status === "pending") {
      appointment.status = "confirmed";
      appointment.history.push({
        status: "confirmed",
        note: "Appointment automatically confirmed after payment clearance",
        changedBy: req.user.id,
        timestamp: new Date()
      });
      await appointment.save();

      // Track Doctor Revenue updates
      const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId });
      if (doctorProfile) {
        doctorProfile.revenue += payment.amount;
        await doctorProfile.save();
      }
    }

    await logActivity(req.user.id, req.ip || "127.0.0.1", "payment_change", "success", `Cleared invoice payment for ID ${payment._id}`);

    res.json({
      success: true,
      message: "Payment cleared successfully",
      payment
    });
  } catch (error) {
    next(error);
  }
}

// Get lists of transactions
export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { role, id } = req.user;

    const filter: any = {};
    if (role === "patient") {
      filter.patientId = id;
    } else if (role === "doctor") {
      // Find appointments this doctor is assigned to, then fetch associated payments
      const appointments = await Appointment.find({ doctorId: id });
      const appointmentIds = appointments.map((app: any) => app._id);
      filter.appointmentId = { $in: appointmentIds };
    }

    const payments = await Payment.find(filter)
      .populate("patientId", "name email")
      .populate({
        path: "appointmentId",
        populate: { path: "doctorId", select: "name" }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    next(error);
  }
}

// Refund transaction (Admin only)
export async function refundPayment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
      throw new ApiError(403, "Access denied: insufficient privileges");
    }

    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
      throw new ApiError(404, "Invoice not found");
    }

    payment.paymentStatus = "refunded";
    payment.refundStatus = "refunded";
    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);
    if (appointment) {
      appointment.status = "cancelled";
      appointment.history.push({
        status: "cancelled",
        note: "Appointment cancelled due to processing refund",
        changedBy: req.user.id,
        timestamp: new Date()
      });
      await appointment.save();

      // Deduct doctor revenue
      const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId });
      if (doctorProfile) {
        doctorProfile.revenue = Math.max(0, doctorProfile.revenue - payment.amount);
        await doctorProfile.save();
      }
    }

    await logActivity(req.user.id, req.ip || "127.0.0.1", "payment_change", "success", `Refunded payment transaction ${payment._id}`);

    res.json({
      success: true,
      message: "Refund processed successfully",
      payment
    });
  } catch (error) {
    next(error);
  }
}
