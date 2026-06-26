import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
  notes: { type: String },
  diagnosis: { type: String },
  prescription: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
