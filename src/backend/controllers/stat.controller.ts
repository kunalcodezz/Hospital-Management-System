import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { Appointment } from "../models/Appointment";
import { DoctorProfile } from "../models/DoctorProfile";
import { Payment } from "../models/Payment";
import { ActivityLog } from "../models/ActivityLog";
import { ApiError } from "../middleware/error.middleware";
import { mongoose } from "../config/db";

// Helper to convert JSON grids to CSV text
function jsonToCsv(headers: string[], rows: any[][]): string {
  const headerLine = headers.join(",");
  const rowLines = rows.map((row) =>
    row
      .map((val) => {
        if (val === null || val === undefined) return "";
        const valStr = String(val).replace(/"/g, '""');
        return valStr.includes(",") || valStr.includes("\n") || valStr.includes('"')
          ? `"${valStr}"`
          : valStr;
      })
      .join(",")
  );
  return [headerLine, ...rowLines].join("\n");
}

// Get admin panel aggregated metrics
export async function getAdminDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
      throw new ApiError(403, "Access denied: admin portal access only");
    }

    // Uptime & System health
    const systemHealth = {
      dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uptime: process.uptime(),
      nodeEnv: process.env.NODE_ENV || "development",
      memoryUsage: process.memoryUsage().heapUsed,
    };

    // Calculate revenue metrics
    const payments = await Payment.find({ paymentStatus: "paid" });
    let totalRevenue = 0;
    let revenueToday = 0;
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    payments.forEach((p) => {
      totalRevenue += p.amount;
      if (new Date(p.createdAt) >= todayStart) {
        revenueToday += p.amount;
      }
    });

    // Counts
    const patientsCount = await User.countDocuments({ role: "patient" });
    const doctorsCount = await User.countDocuments({ role: "doctor" });
    const appointmentsCount = await Appointment.countDocuments();
    const activeAppointmentsCount = await Appointment.countDocuments({ 
      status: { $in: ["confirmed", "checked_in", "in_progress"] } 
    });

    // Department Breakdown Performance
    const doctorProfiles = await DoctorProfile.find().populate("userId", "name");
    const departmentPerformance: { [key: string]: { appointments: number; revenue: number } } = {};
    
    // Initialize default departments
    const defaultDepts = ["Cardiology", "Neurology", "Pediatrics", "General Physician", "Dermatology", "Orthopedics", "Oncology", "Psychiatry"];
    defaultDepts.forEach((dept) => {
      departmentPerformance[dept] = { appointments: 0, revenue: 0 };
    });

    // Populate department data
    const allCompletedAppointments = await Appointment.find({ status: "completed" }).populate("paymentId");
    
    for (const app of allCompletedAppointments) {
      const docProf = doctorProfiles.find((dp) => dp.userId._id.toString() === app.doctorId.toString());
      if (docProf && docProf.department) {
        const dept = docProf.department;
        if (!departmentPerformance[dept]) {
          departmentPerformance[dept] = { appointments: 0, revenue: 0 };
        }
        departmentPerformance[dept].appointments += 1;
        if (app.paymentId && (app.paymentId as any).amount) {
          departmentPerformance[dept].revenue += (app.paymentId as any).amount;
        } else {
          departmentPerformance[dept].revenue += docProf.consultationFee;
        }
      }
    }

    // Convert performance map to array for Recharts charts
    const departmentStatsArray = Object.keys(departmentPerformance).map((name) => ({
      name,
      appointments: departmentPerformance[name].appointments,
      revenue: parseFloat(departmentPerformance[name].revenue.toFixed(2)),
    }));

    // Active session estimates (Activity logs in last 15 mins)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeUsersCount = await ActivityLog.distinct("userId", {
      createdAt: { $gte: fifteenMinsAgo },
      userId: { $ne: null },
    });

    // Recent audits
    const recentActivities = await ActivityLog.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(10);

    // Patient Growth grouped by month (mock calculations aggregated from User registrations)
    const users = await User.find({ role: "patient" }).select("createdAt");
    const monthlyGrowth: { [key: string]: number } = {};
    users.forEach((u) => {
      const date = new Date(u.createdAt);
      const month = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
    });

    const patientGrowthArray = Object.keys(monthlyGrowth).map((month) => ({
      month,
      patients: monthlyGrowth[month],
    }));

    res.json({
      success: true,
      stats: {
        totalRevenue,
        revenueToday,
        patientsCount,
        doctorsCount,
        appointmentsCount,
        activeAppointmentsCount,
        activeUsersCount: activeUsersCount.length,
        departmentPerformance: departmentStatsArray,
        patientGrowth: patientGrowthArray,
        systemHealth,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get system activity audit logs (support pagination and filters)
export async function getActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
      throw new ApiError(403, "Access denied: audit log operations restricted to supervisors");
    }

    const { action, status, search, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (action) filter.action = action;
    if (status) filter.status = status;

    let usersQuery: any = {};
    if (search) {
      const regex = new RegExp(String(search), "i");
      const matchedUsers = await User.find({
        $or: [{ name: regex }, { email: regex }],
      });
      const userIds = matchedUsers.map((u) => u._id);
      filter.$or = [{ userId: { $in: userIds } }, { details: regex }];
    }

    const skipIdx = (Number(page) - 1) * Number(limit);

    const logs = await ActivityLog.find(filter)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip(skipIdx)
      .limit(Number(limit));

    const totalLogs = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        totalLogs,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalLogs / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Export Activity Logs in CSV format
export async function exportLogs(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
      throw new ApiError(403, "Access denied");
    }

    const logs = await ActivityLog.find().populate("userId", "name email role").sort({ createdAt: -1 });

    const headers = ["Log ID", "User Name", "User Email", "User Role", "IP Address", "Action", "Status", "Details", "Timestamp"];
    const rows = logs.map((log: any) => [
      log._id,
      log.userId ? log.userId.name : "Guest/Anonymous",
      log.userId ? log.userId.email : "N/A",
      log.userId ? log.userId.role : "N/A",
      log.ipAddress,
      log.action,
      log.status,
      log.details,
      log.createdAt.toISOString(),
    ]);

    const csvContent = jsonToCsv(headers, rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=system_activity_logs.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

// Export Payments/Revenue Transactions in CSV format
export async function exportPayments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
      throw new ApiError(403, "Access denied");
    }

    const payments = await Payment.find().populate("patientId", "name email").sort({ createdAt: -1 });

    const headers = ["Payment ID", "Invoice Number", "Transaction ID", "Patient Name", "Patient Email", "Payment Method", "Amount", "Tax", "Discount", "Payment Status", "Timestamp"];
    const rows = payments.map((pay: any) => [
      pay._id,
      pay.invoiceNumber,
      pay.transactionId,
      pay.patientId ? pay.patientId.name : "N/A",
      pay.patientId ? pay.patientId.email : "N/A",
      pay.paymentMethod,
      pay.amount,
      pay.tax,
      pay.discount,
      pay.paymentStatus,
      pay.createdAt.toISOString(),
    ]);

    const csvContent = jsonToCsv(headers, rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=payments_financial_report.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
