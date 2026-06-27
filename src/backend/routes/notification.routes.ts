import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateUser);

router.get("/", getNotifications);
router.get("/unread", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

export default router;
