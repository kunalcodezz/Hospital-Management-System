import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["info", "success", "warning", "error"], 
    default: "info" 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export default Notification;
