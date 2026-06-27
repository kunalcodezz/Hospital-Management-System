import { Request, Response, NextFunction } from "express";
import { Notification } from "../models/Notification";
import { ApiError } from "../middleware/error.middleware";

// Get user notifications list
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to latest 50

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    next(error);
  }
}

// Get count of unread notifications
export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
}

// Mark single notification as read
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (notification.userId.toString() !== req.user.id) {
      throw new ApiError(403, "Access denied");
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    next(error);
  }
}

// Mark all user notifications as read
export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    next(error);
  }
}
