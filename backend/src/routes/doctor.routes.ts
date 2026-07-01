import { Router } from "express";
import {
  getDoctors,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorDashboard,
} from "../controllers/doctor.controller";
import { authenticateUser, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getDoctors);
router.get("/dashboard", authenticateUser, requireRole(["doctor"]), getDoctorDashboard);
router.get("/profile/me", authenticateUser, requireRole(["doctor"]), (req, res, next) => {
  req.params.id = "me";
  getDoctorProfile(req, res, next);
});
router.put("/profile/me", authenticateUser, requireRole(["doctor"]), updateDoctorProfile);
router.get("/:id", authenticateUser, getDoctorProfile);

export default router;
