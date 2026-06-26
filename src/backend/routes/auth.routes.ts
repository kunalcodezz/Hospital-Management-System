import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  // If MongoDB is not connected, mock the response for demo purposes
  if (!process.env.MONGODB_URI) {
    const token = jwt.sign({ id: "mock-id", role: "patient" }, "mock-secret", { expiresIn: "1h" });
    return res.json({ token, user: { id: "mock-id", name: "Demo User", email, role: "patient" } });
  }

  try {
    const user = await (User as any).findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "1h" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!process.env.MONGODB_URI) {
    const token = jwt.sign({ id: "mock-id", role }, "mock-secret", { expiresIn: "1h" });
    return res.json({ token, user: { id: "mock-id", name, email, role } });
  }

  try {
    let user = await (User as any).findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "1h" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
