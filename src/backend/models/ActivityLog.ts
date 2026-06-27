import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: null // null if login failed or guest action
  },
  ipAddress: { 
    type: String, 
    required: true, 
    default: "127.0.0.1" 
  },
  action: { 
    type: String, 
    required: true, 
    enum: [
      "login", 
      "logout", 
      "password_change", 
      "profile_update", 
      "appointment_update", 
      "prescription_create", 
      "report_upload", 
      "admin_action", 
      "payment_change", 
      "export_action",
      "failed_login_attempt"
    ]
  },
  status: { 
    type: String, 
    required: true, 
    enum: ["success", "failed"], 
    default: "success" 
  },
  details: { 
    type: String, 
    default: "" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
export default ActivityLog;
