import { mongoose } from "../config/db";

const AppointmentHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "rejected", "no_show"],
    required: true
  },
  note: { type: String, default: "" },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timestamp: { type: Date, default: Date.now }
});

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // Format HH:MM (24h)
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "rejected", "no_show"], 
    default: "pending" 
  },
  notes: { type: String, default: "" },
  diagnosis: { type: String, default: "" },
  prescription: { type: String, default: "" },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  history: {
    type: [AppointmentHistorySchema],
    default: []
  },
  createdAt: { type: Date, default: Date.now }
});

// Auto-log initial status on create
AppointmentSchema.pre("save", async function () {
  if (this.isNew && this.history.length === 0) {
    this.history.push({
      status: "pending",
      note: "Appointment request submitted",
      changedBy: this.patientId,
      timestamp: new Date()
    });
  }
});

export const Appointment = mongoose.model("Appointment", AppointmentSchema);
export default Appointment;
