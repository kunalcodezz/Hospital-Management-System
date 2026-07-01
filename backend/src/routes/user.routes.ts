import { Router } from "express";
import {
  getMe,
  updatePatientProfile,
  uploadPhoto,
  getAllPatients,
  deleteUser,
  getActivityLogs,
} from "../controllers/user.controller";
import { authenticateUser, requireRole } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.use(authenticateUser);

router.get("/me", getMe);
router.put("/profile/patient", requireRole(["patient"]), updatePatientProfile);
router.post("/photo", upload.single("photo"), uploadPhoto);
router.get("/patients", requireRole(["admin", "superadmin"]), getAllPatients);
router.get("/logs", requireRole(["admin", "superadmin"]), getActivityLogs);
router.delete("/:id", requireRole(["admin", "superadmin"]), deleteUser);

export default router;
