import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { PatientProfile } from "../models/PatientProfile";
import { DoctorProfile } from "../models/DoctorProfile";
import { ActivityLog } from "../models/ActivityLog";
import { ApiError } from "../middleware/error.middleware";
import { patientProfileUpdateSchema } from "../validators/zod.validators";
import { uploadToCloudinary } from "../middleware/upload.middleware";

async function logActivity(userId: any, ip: string, action: any, status: "success" | "failed", details: string) {
  try {
    await ActivityLog.create({ userId, ipAddress: ip, action, status, details });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const user = await User.findById(req.user.id).select("-password -refreshTokens");
    if (!user) throw new ApiError(404, "User not found");

    let profile = null;
    if (user.role === "patient") {
      profile = await PatientProfile.findOne({ userId: user._id });
    } else if (user.role === "doctor") {
      profile = await DoctorProfile.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePatientProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const validated = patientProfileUpdateSchema.parse(req.body);

    let profile = await PatientProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new PatientProfile({ userId: req.user.id });
    }

    // Assign properties
    Object.assign(profile, validated);
    await profile.save();

    await logActivity(req.user.id, req.ip || "127.0.0.1", "profile_update", "success", "Patient medical profile updated");

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    if (!req.file) throw new ApiError(400, "No file uploaded");

    const photoUrl = await uploadToCloudinary(req.file.path, "avatars");

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoUrl },
      { new: true }
    ).select("-password");

    await logActivity(req.user.id, req.ip || "127.0.0.1", "profile_update", "success", "Profile photo uploaded");

    res.json({
      success: true,
      message: "Profile photo uploaded successfully",
      profilePhoto: photoUrl,
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Admin: Get all patients
export async function getAllPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const patients = await User.find({ role: "patient" }).select("-password -refreshTokens");
    const profiles = await PatientProfile.find().populate("userId", "name email profilePhoto");
    
    res.json({
      success: true,
      patients: profiles,
    });
  } catch (error) {
    next(error);
  }
}

// Super Admin: Delete User
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");

    if (user.role === "patient") {
      await PatientProfile.findOneAndDelete({ userId: id });
    } else if (user.role === "doctor") {
      await DoctorProfile.findOneAndDelete({ userId: id });
    }

    await User.findByIdAndDelete(id);
    
    await logActivity(req.user?.id, req.ip || "127.0.0.1", "admin_action", "success", `Deleted user account: ${user.email} (Role: ${user.role})`);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

// Admin: Get all activity audit logs
export async function getActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await ActivityLog.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    next(error);
  }
}
