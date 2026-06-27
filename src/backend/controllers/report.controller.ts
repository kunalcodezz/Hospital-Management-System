import { Request, Response, NextFunction } from "express";
import { Payment } from "../models/Payment";
import { Appointment } from "../models/Appointment";
import { User } from "../models/User";
import { PatientProfile } from "../models/PatientProfile";
import { ApiError } from "../middleware/error.middleware";
import { ActivityLog } from "../models/ActivityLog";

async function logActivity(userId: any, ip: string, action: any, status: "success" | "failed", details: string) {
  try {
    await ActivityLog.create({ userId, ipAddress: ip, action, status, details });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

// Pure-node lightweight PDF generator (no dependency)
function generateSimplePDF(title: string, sections: { label: string; value: string }[]): Buffer {
  let streamContent = `BT\n/F1 18 Tf\n50 780 Td\n(${title}) Tj\nET\n`;
  streamContent += `BT\n/F1 10 Tf\n50 760 Td\n(MediCare+ Hospital Management System) Tj\nET\n`;
  streamContent += `BT\n/F1 10 Tf\n50 745 Td\n(--------------------------------------------) Tj\nET\n`;

  let y = 710;
  for (const sec of sections) {
    // Sanitizing parentheses for PDF strings
    const sanitizedVal = (sec.value || "")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    streamContent += `BT\n/F1 11 Tf\n50 ${y} Td\n(${sec.label}:) Tj\nET\n`;
    streamContent += `BT\n/F1 11 Tf\n200 ${y} Td\n(${sanitizedVal}) Tj\nET\n`;
    y -= 25;
  }

  const contentStream = Buffer.from(streamContent, "utf-8");
  
  // Format body elements with exact spacing
  const body = 
    `%PDF-1.4\n` +
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n` +
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n` +
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n` +
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n` +
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n` +
    streamContent +
    `\nendstream\nendobj\n` +
    `xref\n0 6\n` +
    `0000000000 65535 f \n` +
    `trailer\n<< /Size 6 /Root 1 0 R >>\n` +
    `startxref\n300\n` +
    `%%EOF\n`;

  return Buffer.from(body, "binary");
}

// Generate Invoice PDF
export async function getInvoicePDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate("patientId", "name email");
    
    if (!payment) throw new ApiError(404, "Payment not found");

    const sections = [
      { label: "Invoice Number", value: payment.invoiceNumber },
      { label: "Transaction ID", value: payment.transactionId },
      { label: "Patient Name", value: (payment.patientId as any)?.name || "N/A" },
      { label: "Patient Email", value: (payment.patientId as any)?.email || "N/A" },
      { label: "Payment Status", value: payment.paymentStatus.toUpperCase() },
      { label: "Payment Method", value: payment.paymentMethod },
      { label: "Subtotal", value: `$${payment.amount.toFixed(2)}` },
      { label: "Tax", value: `$${(payment.tax || 0).toFixed(2)}` },
      { label: "Discount", value: `-$${(payment.discount || 0).toFixed(2)}` },
      { label: "Total Paid", value: `$${(payment.amount + (payment.tax || 0) - (payment.discount || 0)).toFixed(2)}` },
      { label: "Date Generated", value: new Date(payment.createdAt).toDateString() }
    ];

    const pdfBuffer = generateSimplePDF(`INVOICE RECEIPT`, sections);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Invoice-${payment.invoiceNumber}.pdf`);
    res.send(pdfBuffer);

    await logActivity(req.user?.id || null, req.ip || "127.0.0.1", "export_action", "success", `Invoice PDF downloaded: ${payment.invoiceNumber}`);
  } catch (error) {
    next(error);
  }
}

// Generate Prescription PDF
export async function getPrescriptionPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate("patientId", "name email")
      .populate("doctorId", "name");

    if (!appointment) throw new ApiError(404, "Appointment not found");

    const sections = [
      { label: "Appointment ID", value: appointment._id.toString() },
      { label: "Date of Visit", value: new Date(appointment.date).toDateString() },
      { label: "Patient Name", value: (appointment.patientId as any)?.name || "N/A" },
      { label: "Prescribed By", value: (appointment.doctorId as any)?.name || "N/A" },
      { label: "Diagnosis Details", value: appointment.diagnosis || "No diagnosis logged" },
      { label: "Prescribed Meds", value: appointment.prescription || "No prescription logged" },
      { label: "Date Generated", value: new Date().toDateString() }
    ];

    const pdfBuffer = generateSimplePDF(`PRESCRIPTION FORM`, sections);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Prescription-${appointment._id}.pdf`);
    res.send(pdfBuffer);

    await logActivity(req.user?.id || null, req.ip || "127.0.0.1", "export_action", "success", `Prescription PDF downloaded: ${appointment._id}`);
  } catch (error) {
    next(error);
  }
}

// Generate Medical Report/Summary PDF
export async function getMedicalReportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params; // Patient User ID
    const user = await User.findById(id);
    const profile = await PatientProfile.findOne({ userId: id });

    if (!user || !profile) throw new ApiError(404, "Patient record not found");

    const sections = [
      { label: "Patient Name", value: user.name },
      { label: "Email Address", value: user.email },
      { label: "Blood Group", value: profile.bloodGroup || "Not Specified" },
      { label: "Height (cm)", value: String(profile.height || 0) },
      { label: "Weight (kg)", value: String(profile.weight || 0) },
      { label: "BMI Ratio", value: String(profile.bmi || 0) },
      { label: "Allergies", value: profile.allergies.join(", ") || "None Logged" },
      { label: "Chronic Illnesses", value: profile.chronicDiseases.join(", ") || "None Logged" },
      { label: "Current Medications", value: profile.currentMedications.join(", ") || "None Logged" },
      { label: "Emergency Contact", value: `${profile.emergencyContact?.name || "N/A"} (${profile.emergencyContact?.relationship || "N/A"}) - ${profile.emergencyContact?.phone || "N/A"}` }
    ];

    const pdfBuffer = generateSimplePDF(`CLINICAL MEDICAL SUMMARY`, sections);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=MedicalReport-${user.name}.pdf`);
    res.send(pdfBuffer);

    await logActivity(req.user?.id || null, req.ip || "127.0.0.1", "export_action", "success", `Medical Report PDF downloaded for ${user.name}`);
  } catch (error) {
    next(error);
  }
}

// Export Payments Table as CSV File
export async function exportPaymentsCSV(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
      throw new ApiError(403, "Access denied");
    }

    const payments = await Payment.find().populate("patientId", "name email");

    let csvContent = "InvoiceNumber,TransactionID,PatientName,PatientEmail,PaymentMethod,Amount,Tax,Discount,Status,Date\n";
    for (const pay of payments) {
      const name = (pay.patientId as any)?.name || "N/A";
      const email = (pay.patientId as any)?.email || "N/A";
      csvContent += `"${pay.invoiceNumber}","${pay.transactionId}","${name}","${email}","${pay.paymentMethod}",${pay.amount},${pay.tax || 0},${pay.discount || 0},"${pay.paymentStatus}","${new Date(pay.createdAt).toDateString()}"\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=PaymentsExport.csv");
    res.status(200).send(csvContent);

    await logActivity(req.user.id, req.ip || "127.0.0.1", "export_action", "success", "Payments table exported as CSV");
  } catch (error) {
    next(error);
  }
}
