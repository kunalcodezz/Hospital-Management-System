import { Router } from "express";
import {
  payInvoice,
  getPayments,
  refundPayment,
} from "../controllers/payment.controller";
import { authenticateUser, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateUser);

router.get("/", getPayments);
router.post("/:id/pay", payInvoice);
router.post("/:id/refund", requireRole(["admin", "superadmin"]), refundPayment);

export default router;
