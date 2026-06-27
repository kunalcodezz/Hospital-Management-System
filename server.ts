import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";

import authRoutes from "./src/backend/routes/auth.routes";
import userRoutes from "./src/backend/routes/user.routes";
import doctorRoutes from "./src/backend/routes/doctor.routes";
import appointmentRoutes from "./src/backend/routes/appointment.routes";
import departmentRoutes from "./src/backend/routes/department.routes";
import statRoutes from "./src/backend/routes/stat.routes";
import paymentRoutes from "./src/backend/routes/payment.routes";
import notificationRoutes from "./src/backend/routes/notification.routes";

import { connectDB } from "./src/backend/config/db";
import { noSqlSanitizer, secureHeaders } from "./src/backend/middleware/security.middleware";
import { errorHandler } from "./src/backend/middleware/error.middleware";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helmet config supporting HMR in dev and strict policies in production
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://api.dicebear.com"],
        connectSrc: ["'self'", "wss:", "https://api.studio"],
      }
    } : false
  }));

  // Middlewares
  app.use(express.json());
  app.use(cors());
  app.use(noSqlSanitizer);
  app.use(secureHeaders);

  // Serve uploads folder locally for offline fallbacks
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Global Rate Limiting for standard API routes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { success: false, message: "Too many requests from this IP, please try again later." }
  });
  app.use("/api", limiter);

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
