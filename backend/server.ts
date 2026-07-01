import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import authRoutes from "./src/routes/auth.routes";
import userRoutes from "./src/routes/user.routes";
import doctorRoutes from "./src/routes/doctor.routes";
import appointmentRoutes from "./src/routes/appointment.routes";
import departmentRoutes from "./src/routes/department.routes";
import statRoutes from "./src/routes/stat.routes";
import paymentRoutes from "./src/routes/payment.routes";
import notificationRoutes from "./src/routes/notification.routes";

import { connectDB } from "./src/config/db";
import { noSqlSanitizer, secureHeaders } from "./src/middleware/security.middleware";
import { errorHandler } from "./src/middleware/error.middleware";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Helmet config supporting security policies
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://api.dicebear.com"],
        connectSrc: ["'self'", "wss:", "https://api.studio"],
      }
    }
  }));

  // Middlewares
  app.use(express.json());

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000"
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true
  }));

  app.use(noSqlSanitizer);
  app.use(secureHeaders);

  // Serve uploads folder locally for offline fallbacks
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Connect to Database
  await connectDB();

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "MediCare+ API is running" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/stats", statRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/notifications", notificationRoutes);

  // Global Error Handler Middleware
  app.use(errorHandler);

  // Fallback for API routes not found
  app.use((req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found" });
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
