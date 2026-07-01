import { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  addDiagnosisAndPrescription,
  getInvoicePDF,
  getPrescriptionPDF,
  getAppointmentSlip,
} from "../controllers/appointment.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateUser);

router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id/status", updateAppointmentStatus);
router.put("/:id/diagnosis", addDiagnosisAndPrescription);
router.get("/:id/invoice", getInvoicePDF);
router.get("/:id/prescription", getPrescriptionPDF);
router.get("/:id/slip", getAppointmentSlip);

export default router;
