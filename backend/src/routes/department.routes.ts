import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    departments: [
      "Cardiology",
      "Neurology",
      "Pediatrics",
      "General Physician",
      "Dermatology",
      "Orthopedics",
      "Oncology",
      "Psychiatry"
    ]
  });
});

export default router;
