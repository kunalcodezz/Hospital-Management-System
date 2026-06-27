import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { DoctorProfile } from "../models/DoctorProfile";
import { Appointment } from "../models/Appointment";
import { Payment } from "../models/Payment";
import { ApiError } from "../middleware/error.middleware";
import { createAppointmentSchema, updateAppointmentStatusSchema, addDiagnosisSchema } from "../validators/zod.validators";
import { ActivityLog } from "../models/ActivityLog";
import PDFDocument from "pdfkit";

async function logActivity(userId: any, ip: string, action: any, status: "success" | "failed", details: string) {
  try {
    await ActivityLog.create({ userId, ipAddress: ip, action, status, details });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

// Generate simple PDF layout using PDFKit
function generateSimplePDF(res: Response, title: string, content: string[]) {
  try {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${title.replace(/\s+/g, "_")}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fillColor("#0052FF").fontSize(22).font("Helvetica-Bold").text("MediCare+ Hospital Network", { align: "center" });
    doc.moveDown(0.2);
    doc.fillColor("#64748B").fontSize(10).font("Helvetica").text("Enterprise Healthcare System • Tel: +1-800-MEDICARE", { align: "center" });
    doc.moveDown(1);
    doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Title
    doc.fillColor("#0F172A").fontSize(16).font("Helvetica-Bold").text(title, { align: "left" });
    doc.moveDown(1);

    // Content lines
    doc.fontSize(11).fillColor("#334155").font("Helvetica");
    content.forEach((line) => {
      if (line.startsWith("## ")) {
        doc.moveDown(0.8);
        doc.fillColor("#0052FF").fontSize(13).font("Helvetica-Bold").text(line.replace("## ", ""));
        doc.fillColor("#334155").fontSize(11).font("Helvetica");
      } else if (line.startsWith("- ")) {
        doc.text(`  • ${line.substring(2)}`);
        doc.moveDown(0.2);
      } else {
        doc.text(line);
        doc.moveDown(0.3);
      }
    });

    // Footer
    doc.moveDown(3);
    doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fillColor("#94A3B8").fontSize(8).text(`Generated on ${new Date().toLocaleString()} • Confidential Patient Record • Copyright MediCare+`, { align: "center" });

    doc.end();
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ success: false, message: "Could not generate PDF" });
  }
}

// Create new appointment booking
export async function createAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const validated = createAppointmentSchema.parse(req.body);
    const { doctorId, date, time, notes } = validated;

    const parsedDate = new Date(date);
    const dayOfWeek = parsedDate.toLocaleDateString("en-US", { weekday: "long" });

    // Verify doctor exists
    const doctor = await DoctorProfile.findOne({ userId: doctorId }).populate("userId", "name");
    if (!doctor) {
      throw new ApiError(404, "Doctor profile not found");
    }

    if (doctor.vacationMode) {
      throw new ApiError(400, "The doctor is currently on vacation and unavailable for bookings.");
    }

    // Verify day and slot matches doctor's calendar settings
    const matchingSlot = doctor.availabilityCalendar.find((slot: any) => 
      slot.dayOfWeek === dayOfWeek &&
      time >= slot.startTime &&
      time <= slot.endTime
    );

    if (!matchingSlot) {
      throw new ApiError(400, `Doctor is not available at this time slot on ${dayOfWeek}.`);
    }

    // Verify double booking
    const doubleBooked = await Appointment.findOne({
      doctorId,
      date: parsedDate,
      time,
      status: { $nin: ["cancelled", "rejected"] }
    });

    if (doubleBooked) {
      throw new ApiError(400, "The requested time slot has already been booked with this doctor.");
    }

    // Generate appointment record
    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId,
      date: parsedDate,
      time,
      notes,
      status: "pending",
      history: [{
        status: "pending",
        note: "Appointment submitted by patient",
        changedBy: req.user.id,
        timestamp: new Date()
      }]
    });

    // Create corresponding payment/invoice record
    const tax = parseFloat((doctor.consultationFee * 0.1).toFixed(2));
    const totalAmount = doctor.consultationFee + tax;
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = new Payment({
      invoiceNumber,
      transactionId,
      paymentMethod: "credit_card", // default choice for online demo
      amount: totalAmount,
      tax,
      discount: 0,
      paymentStatus: "pending",
      patientId: req.user.id,
      appointmentId: appointment._id
    });

    await payment.save();
    appointment.paymentId = payment._id;
    await appointment.save();

    await logActivity(req.user.id, req.ip || "127.0.0.1", "appointment_update", "success", `Booked appointment ${appointment._id} with doctor ${doctorId}`);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment
    });
  } catch (error) {
    next(error);
  }
}

// Get appointments list (with filters based on roles)
export async function getAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { role, id } = req.user;
    const { status, date } = req.query;

    const filter: any = {};

    // RBAC restrictions
    if (role === "patient") {
      filter.patientId = id;
    } else if (role === "doctor") {
      filter.doctorId = id;
    }

    if (status) {
      filter.status = status;
    }

    if (date) {
      const dayStart = new Date(String(date));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(String(date));
      dayEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: dayStart, $lte: dayEnd };
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name email profilePhoto")
      .populate("doctorId", "name email profilePhoto")
      .populate("paymentId")
      .sort({ date: 1, time: 1 });

    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    next(error);
  }
}

// Get appointment details
export async function getAppointmentById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { id: appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId", "name email profilePhoto")
      .populate("doctorId", "name email profilePhoto")
      .populate("paymentId");

    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    // Verify ownership (IDOR check)
    if (
      req.user.role === "patient" && appointment.patientId._id.toString() !== req.user.id &&
      req.user.role === "doctor" && appointment.doctorId._id.toString() !== req.user.id
    ) {
      throw new ApiError(403, "Access denied: you do not have permission to view this resource");
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    next(error);
  }
}

// Update appointment status (triggers status timeline logs)
export async function updateAppointmentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const validated = updateAppointmentStatusSchema.parse(req.body);
    const { status, note } = validated;
    const { id: appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    const isPatient = appointment.patientId.toString() === req.user.id;
    const isDoctor = appointment.doctorId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";

    // Verify roles authorization
    if (isPatient) {
      if (status !== "cancelled") {
        throw new ApiError(403, "Patients can only cancel appointments");
      }
      if (appointment.status !== "pending" && appointment.status !== "confirmed") {
        throw new ApiError(400, "Can only cancel pending or confirmed appointments");
      }
    } else if (isDoctor) {
      if (status === "cancelled") {
        throw new ApiError(403, "Doctors should reject rather than cancel appointments");
      }
    } else if (!isAdmin) {
      throw new ApiError(403, "Access denied: unauthorized to change appointment status");
    }

    // Update status & log timeline
    appointment.status = status;
    appointment.history.push({
      status,
      note: note || `Status updated by ${req.user.role}`,
      changedBy: req.user.id,
      timestamp: new Date()
    });

    // If marked as completed or paid, update statistics in doctor profile
    if (status === "completed") {
      const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId });
      if (doctorProfile) {
        doctorProfile.completedAppointments += 1;
        const payment = await Payment.findById(appointment.paymentId);
        if (payment) {
          payment.paymentStatus = "paid";
          await payment.save();
          doctorProfile.revenue += payment.amount;
        } else {
          doctorProfile.revenue += doctorProfile.consultationFee;
        }
        await doctorProfile.save();
      }
    }

    await appointment.save();

    await logActivity(req.user.id, req.ip || "127.0.0.1", "appointment_update", "success", `Updated appointment ${appointment._id} status to ${status}`);

    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment
    });
  } catch (error) {
    next(error);
  }
}

// Doctor: Write diagnosis details & prescription notes (completes workflow)
export async function addDiagnosisAndPrescription(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== "doctor") {
      throw new ApiError(403, "Access denied: only doctors can add prescriptions");
    }

    const validated = addDiagnosisSchema.parse(req.body);
    const { diagnosis, prescription } = validated;
    const { id: appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new ApiError(404, "Appointment not found");
    }

    if (appointment.doctorId.toString() !== req.user.id) {
      throw new ApiError(403, "Access denied: you are not the assigned doctor for this appointment");
    }

    appointment.diagnosis = diagnosis;
    appointment.prescription = prescription;
    appointment.status = "completed";
    appointment.history.push({
      status: "completed",
      note: "Prescription and diagnosis completed by doctor",
      changedBy: req.user.id,
      timestamp: new Date()
    });

    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
    if (doctorProfile) {
      doctorProfile.completedAppointments += 1;
      const payment = await Payment.findById(appointment.paymentId);
      if (payment) {
        payment.paymentStatus = "paid";
        await payment.save();
        doctorProfile.revenue += payment.amount;
      } else {
        doctorProfile.revenue += doctorProfile.consultationFee;
      }
      await doctorProfile.save();
    }

    await appointment.save();

    await logActivity(req.user.id, req.ip || "127.0.0.1", "prescription_create", "success", `Added prescription for appointment ${appointment._id}`);

    res.json({
      success: true,
      message: "Consultation and prescription details recorded successfully",
      appointment
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/appointments/:id/invoice -> Download Invoice PDF
export async function getInvoicePDF(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate("patientId", "name email")
      .populate("doctorId", "name")
      .populate("paymentId");

    if (!appointment) throw new ApiError(404, "Appointment not found");
    const payment = appointment.paymentId as any;
    if (!payment) throw new ApiError(404, "No payment invoice found for this appointment");

    // IDOR check
    if (
      req.user.role === "patient" && appointment.patientId._id.toString() !== req.user.id &&
      req.user.role === "doctor" && appointment.doctorId._id.toString() !== req.user.id
    ) {
      throw new ApiError(403, "Access denied");
    }

    const lines = [
      `Invoice Number: ${payment.invoiceNumber}`,
      `Transaction ID: ${payment.transactionId}`,
      `Date Issued: ${new Date(payment.createdAt).toLocaleDateString()}`,
      `Payment Method: ${payment.paymentMethod.toUpperCase().replace("_", " ")}`,
      `Payment Status: ${payment.paymentStatus.toUpperCase()}`,
      "",
      "## Patient Information",
      `Name: ${appointment.patientId.name}`,
      `Email: ${appointment.patientId.email}`,
      "",
      "## Booking Summary",
      `Doctor: ${appointment.doctorId.name}`,
      `Appointment Date: ${new Date(appointment.date).toLocaleDateString()}`,
      `Time Slot: ${appointment.time}`,
      "",
      "## Financial Summary",
      `- Consultation Fee: $${(payment.amount - payment.tax).toFixed(2)}`,
      `- Service Tax (10%): $${payment.tax.toFixed(2)}`,
      `- Coupon Discount: -$${payment.discount.toFixed(2)}`,
      `- Net Invoice Total: $${payment.amount.toFixed(2)}`,
      "",
      "Thank you for choosing MediCare+ Network. Please save this invoice for insurance claims."
    ];

    generateSimplePDF(res, `INVOICE: ${payment.invoiceNumber}`, lines);
  } catch (error) {
    next(error);
  }
}

// GET /api/appointments/:id/prescription -> Download Prescription PDF
export async function getPrescriptionPDF(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate("patientId", "name email")
      .populate("doctorId", "name");

    if (!appointment) throw new ApiError(404, "Appointment not found");
    if (!appointment.prescription) throw new ApiError(400, "No prescription recorded for this appointment");

    // IDOR check
    if (
      req.user.role === "patient" && appointment.patientId._id.toString() !== req.user.id &&
      req.user.role === "doctor" && appointment.doctorId._id.toString() !== req.user.id
    ) {
      throw new ApiError(403, "Access denied");
    }

    const lines = [
      `Appointment Ref: ${appointment._id}`,
      `Date: ${new Date(appointment.date).toLocaleDateString()}`,
      `Attending Physician: ${appointment.doctorId.name}`,
      `Patient Name: ${appointment.patientId.name}`,
      "",
      "## Diagnosed Findings",
      appointment.diagnosis || "No specific diagnosis logged.",
      "",
      "## Rx - Prescribed Medications",
      appointment.prescription,
      "",
      "--------------------------------------------------",
      "Instructions: Take medications as instructed. Avoid alcohol. In case of side effects, contact the hospital immediately."
    ];

    generateSimplePDF(res, `PRESCRIPTION RECORD`, lines);
  } catch (error) {
    next(error);
  }
}

// GET /api/appointments/:id/slip -> Download Appointment Slip
export async function getAppointmentSlip(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .populate("patientId", "name email")
      .populate("doctorId", "name");

    if (!appointment) throw new ApiError(404, "Appointment not found");

    // IDOR check
    if (
      req.user.role === "patient" && appointment.patientId._id.toString() !== req.user.id &&
      req.user.role === "doctor" && appointment.doctorId._id.toString() !== req.user.id
    ) {
      throw new ApiError(403, "Access denied");
    }

    const lines = [
      `Booking ID: ${appointment._id}`,
      `Current Status: ${appointment.status.toUpperCase()}`,
      `Scheduled Date: ${new Date(appointment.date).toLocaleDateString()}`,
      `Scheduled Time: ${appointment.time}`,
      "",
      "## Provider Details",
      `Doctor Name: ${appointment.doctorId.name}`,
      "",
      "## Patient Details",
      `Patient Name: ${appointment.patientId.name}`,
      `Email: ${appointment.patientId.email}`,
      "",
      "## Check-in Instructions",
      "- Please arrive at least 15 minutes before your scheduled slot.",
      "- Carry a valid national photo ID card.",
      "- Check in at the front reception counter using the Booking ID."
    ];

    generateSimplePDF(res, `APPOINTMENT ENTRY SLIP`, lines);
  } catch (error) {
    next(error);
  }
}
