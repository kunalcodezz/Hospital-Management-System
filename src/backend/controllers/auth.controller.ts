import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User";
import { PatientProfile } from "../models/PatientProfile";
import { DoctorProfile } from "../models/DoctorProfile";
import { ActivityLog } from "../models/ActivityLog";
import { env } from "../config/env";
import { sendEmail } from "../config/mail";
import { ApiError } from "../middleware/error.middleware";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/zod.validators";

// Helper to generate access & refresh tokens
function generateTokens(user: any) {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
}

// Log activity helper
async function logActivity(userId: any, ip: string, action: any, status: "success" | "failed", details: string) {
  try {
    await ActivityLog.create({
      userId,
      ipAddress: ip,
      action,
      status,
      details
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = registerSchema.parse(req.body);
    const { name, email, password, role } = validated;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await logActivity(null, req.ip || "127.0.0.1", "failed_login_attempt", "failed", `Registration failed: email ${email} already exists`);
      throw new ApiError(400, "User already exists with this email address");
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      passwordHistory: [hashedPassword]
    });
    await user.save();

    // Create corresponding profile
    if (role === "patient") {
      await PatientProfile.create({ userId: user._id });
    } else if (role === "doctor") {
      // Mock values for required doctor fields
      await DoctorProfile.create({
        userId: user._id,
        qualification: "M.B.B.S",
        experience: 2,
        medicalRegistrationNumber: "REG-" + Math.floor(100000 + Math.random() * 900000),
        consultationFee: 50,
      });
    }

    // Send Verification Email
    const verifyUrl = `${req.protocol}://${req.get("host") || "localhost:3000"}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: "Verify Your MediCare+ Account",
      text: `Hello ${name},\n\nPlease verify your account by clicking: ${verifyUrl}`,
      html: `<p>Hello ${name},</p><p>Please verify your account by clicking <a href="${verifyUrl}">here</a>.</p>`
    });

    await logActivity(user._id, req.ip || "127.0.0.1", "profile_update", "success", `User account registered as ${role}`);

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password, rememberMe } = validated;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(400, "Invalid credentials");
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      await logActivity(user._id, req.ip || "127.0.0.1", "failed_login_attempt", "failed", `Blocked login: account locked for ${remainingMinutes} min`);
      throw new ApiError(403, `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        user.failedLoginAttempts = 0; // reset counter after locking
        await user.save();
        await logActivity(user._id, req.ip || "127.0.0.1", "failed_login_attempt", "failed", `Account locked due to 5 consecutive failures`);
        throw new ApiError(403, "Account is temporarily locked due to 5 failed login attempts. Try again in 15 minutes.");
      }
      await user.save();
      await logActivity(user._id, req.ip || "127.0.0.1", "failed_login_attempt", "failed", `Invalid credentials. Attempt ${user.failedLoginAttempts}/5`);
      throw new ApiError(400, "Invalid credentials");
    }

    // Check Password Expiration (warn if password is > 90 days old)
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const passwordExpired = user.passwordChangedAt && (Date.now() - user.passwordChangedAt.getTime() > ninetyDays);

    // Reset failed counter
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshTokens.push(refreshToken);
    user.rememberMe = !!rememberMe;
    await user.save();

    await logActivity(user._id, req.ip || "127.0.0.1", "login", "success", "User logged in successfully");

    res.json({
      success: true,
      accessToken,
      refreshToken,
      passwordExpired, // client can prompt user to change password
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (req.user) {
      const user = await User.findById(req.user.id);
      if (user && refreshToken) {
        user.refreshTokens = user.refreshTokens.filter((t: string) => t !== refreshToken);
        await user.save();
      }
      await logActivity(req.user.id, req.ip || "127.0.0.1", "logout", "success", "User logged out from current session");
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }

    await logActivity(req.user.id, req.ip || "127.0.0.1", "logout", "success", "User logged out from all devices");
    res.json({ success: true, message: "Logged out from all devices successfully" });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const { email } = validated;

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 to prevent user enumeration attacks
      return res.json({
        success: true,
        message: "If that email address exists in our database, we have sent a reset code to it."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${req.protocol}://${req.get("host") || "localhost:3000"}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Password Reset Request - MediCare+",
      text: `Click the link to reset your password: ${resetUrl}`,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });

    res.json({
      success: true,
      message: "If that email address exists in our database, we have sent a reset code to it."
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    const { token, newPassword } = validated;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new ApiError(400, "Reset token is invalid or has expired");
    }

    // Verify Password History Policy (check if matches any of last 3)
    for (const historicHash of user.passwordHistory || []) {
      const isMatch = await bcrypt.compare(newPassword, historicHash);
      if (isMatch) {
        throw new ApiError(400, "Password reuse prohibited: you cannot use any of your last 3 passwords.");
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Track history
    user.passwordHistory.push(hashedPassword);
    if (user.passwordHistory.length > 3) {
      user.passwordHistory.shift(); // keep only last 3
    }
    
    // Invalidate sessions on password change
    user.refreshTokens = [];
    await user.save();

    await logActivity(user._id, req.ip || "127.0.0.1", "password_change", "success", "Password reset successfully");

    res.json({
      success: true,
      message: "Password reset successful. Please login with your new credentials."
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query;
    if (!token) {
      throw new ApiError(400, "Verification token is required");
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new ApiError(400, "Verification token is invalid or has expired");
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await logActivity(user._id, req.ip || "127.0.0.1", "profile_update", "success", "Email verified successfully");

    res.json({
      success: true,
      message: "Email verified successfully! You may now access all operations."
    });
  } catch (error) {
    next(error);
  }
}
