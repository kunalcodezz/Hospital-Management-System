import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Department routes placeholder" });
});

export default router;
