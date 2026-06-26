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
import { connectDB } from "./src/backend/config/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled for Vite HMR

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
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
