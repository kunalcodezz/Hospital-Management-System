import { z } from "zod";

// MongoDB ObjectId Regex validation
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
export const objectIdSchema = z.string().refine((val) => objectIdRegex.test(val), {
  message: "Invalid MongoDB ObjectId format",
});

// Strong Password validation rules (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special)
export const passwordPolicy = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: passwordPolicy,
  role: z.enum(["patient", "doctor", "admin", "superadmin"]).default("patient"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: passwordPolicy,
});

// Patient profile validator
export const insuranceSchema = z.object({
  provider: z.string().default(""),
  policyNumber: z.string().default(""),
  policyHolder: z.string().default(""),
  expirationDate: z.string().or(z.date()).optional(),
});

export const patientProfileUpdateSchema = z.object({
  allergies: z.array(z.string()).optional(),
  insuranceDetails: insuranceSchema.optional(),
  height: z.number().min(0).max(300).optional(),
  weight: z.number().min(0).max(500).optional(),
  emergencyContact: z.object({
    name: z.string().default(""),
    phone: z.string().default(""),
    relationship: z.string().default(""),
  }).optional(),
  bloodGroup: z.enum(["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
  medicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  chronicDiseases: z.array(z.string()).optional(),
});

// Doctor profile validator
export const availabilitySlotSchema = z.object({
  dayOfWeek: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  slotDuration: z.number().min(10).max(120).default(30),
});

export const doctorProfileUpdateSchema = z.object({
  qualification: z.string().min(2).optional(),
  experience: z.number().min(0).optional(),
  medicalRegistrationNumber: z.string().min(3).optional(),
  department: z.enum(["Cardiology", "Neurology", "Pediatrics", "General Physician", "Dermatology", "Orthopedics", "Oncology", "Psychiatry"]).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  consultationFee: z.number().min(0).optional(),
  availabilityCalendar: z.array(availabilitySlotSchema).optional(),
  vacationMode: z.boolean().optional(),
});

// Appointment booking validator
export const createAppointmentSchema = z.object({
  doctorId: objectIdSchema,
  date: z.string().or(z.date()),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  notes: z.string().max(500).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "rejected", "no_show"]),
  note: z.string().max(500).optional(),
});

export const addDiagnosisSchema = z.object({
  diagnosis: z.string().min(3, "Diagnosis is required"),
  prescription: z.string().min(3, "Prescription details are required"),
});

// Payment creation validator
export const createPaymentSchema = z.object({
  appointmentId: objectIdSchema,
  paymentMethod: z.enum(["credit_card", "paypal", "razorpay", "insurance", "cash"]),
  amount: z.number().min(0),
  couponCode: z.string().optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
});
