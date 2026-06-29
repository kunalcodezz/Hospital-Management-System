import { mongoose } from "../config/db";

const PatientProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true 
  },
  allergies: { 
    type: [String], 
    default: [] 
  },
  insuranceDetails: {
    provider: { type: String, default: "" },
    policyNumber: { type: String, default: "" },
    policyHolder: { type: String, default: "" },
    expirationDate: { type: Date }
  },
  height: { 
    type: Number, 
    default: 0 // in cm
  },
  weight: { 
    type: Number, 
    default: 0 // in kg
  },
  bmi: { 
    type: Number, 
    default: 0 
  },
  emergencyContact: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    relationship: { type: String, default: "" }
  },
  bloodGroup: {
    type: String,
    enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    default: ""
  },
  medicalHistory: { 
    type: [String], 
    default: [] 
  },
  vaccinationHistory: [
    {
      vaccine: { type: String, required: true },
      date: { type: Date, required: true }
    }
  ],
  currentMedications: { 
    type: [String], 
    default: [] 
  },
  chronicDiseases: { 
    type: [String], 
    default: [] 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Calculate BMI hook
PatientProfileSchema.pre("save", async function () {
  if (this.height > 0 && this.weight > 0) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
});

export const PatientProfile = mongoose.model("PatientProfile", PatientProfileSchema);
export default PatientProfile;
