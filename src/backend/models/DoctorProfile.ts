import mongoose from "mongoose";

const AvailabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: { 
    type: String, 
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true 
  },
  startTime: { type: String, required: true }, // Format HH:MM (24h)
  endTime: { type: String, required: true }, // Format HH:MM (24h)
  slotDuration: { type: Number, default: 30 } // In minutes
});

const DoctorProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true 
  },
  qualification: { 
    type: String, 
    required: true, 
    trim: true 
  },
  experience: { 
    type: Number, 
    required: true, 
    min: 0 // Years of practice
  },
  medicalRegistrationNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  department: {
    type: String,
    required: true,
    enum: ["Cardiology", "Neurology", "Pediatrics", "General Physician", "Dermatology", "Orthopedics", "Oncology", "Psychiatry"],
    default: "General Physician"
  },
  languagesSpoken: { 
    type: [String], 
    default: ["English"] 
  },
  consultationFee: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  availabilityCalendar: {
    type: [AvailabilitySlotSchema],
    default: []
  },
  vacationMode: { 
    type: Boolean, 
    default: false 
  },
  averageRating: { 
    type: Number, 
    default: 5.0, 
    min: 1.0, 
    max: 5.0 
  },
  completedAppointments: { 
    type: Number, 
    default: 0 
  },
  revenue: { 
    type: Number, 
    default: 0 
  },
  performanceMetrics: {
    satisfactionRate: { type: Number, default: 100 }, // percentage
    punctuality: { type: Number, default: 100 } // percentage
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const DoctorProfile = mongoose.models.DoctorProfile || mongoose.model("DoctorProfile", DoctorProfileSchema);
export default DoctorProfile;
