import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Appointment routes placeholder" });
});

export default router;
