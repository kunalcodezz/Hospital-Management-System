import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ["patient", "doctor", "admin", "superadmin"], 
    default: "patient" 
  },
  profilePhoto: { 
    type: String 
  },
  
  // Security & Authentication Policy
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: { 
    type: String 
  },
  emailVerificationExpires: { 
    type: Date 
  },
  
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockUntil: { 
    type: Date 
  },
  
  passwordChangedAt: { 
    type: Date, 
    default: Date.now 
  },
  passwordResetToken: { 
    type: String 
  },
  passwordResetExpires: { 
    type: Date 
  },
  passwordHistory: { 
    type: [String], 
    default: [] 
  },
  
  refreshTokens: { 
    type: [String], 
    default: [] 
  },
  rememberMe: { 
    type: Boolean, 
    default: false 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
