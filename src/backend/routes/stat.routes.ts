import { Router } from "express";
import {
  getAdminDashboardStats,
  getActivityLogs,
  exportLogs,
  exportPayments,
} from "../controllers/stat.controller";
import { authenticateUser, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateUser);
router.use(requireRole(["admin", "superadmin"]));

router.get("/admin", getAdminDashboardStats);
router.get("/logs", getActivityLogs);
router.get("/logs/export", exportLogs);
router.get("/payments/export", exportPayments);

export default router;
