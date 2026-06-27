import { Router } from "express";
import {
  getInvoicePDF,
  getPrescriptionPDF,
  getMedicalReportPDF,
  exportPaymentsCSV,
} from "../controllers/report.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

// Routes require general authentication
router.use(authenticateUser);

router.get("/invoice/:id/pdf", getInvoicePDF);
router.get("/prescription/:id/pdf", getPrescriptionPDF);
router.get("/medical-report/:id/pdf", getMedicalReportPDF);
router.get("/payments/csv", exportPaymentsCSV);

export default router;
