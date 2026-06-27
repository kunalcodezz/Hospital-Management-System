import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiter specifically for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", authenticateUser, logout);
router.post("/logout-all", authenticateUser, logoutAll);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/verify-email", verifyEmail);

export default router;
