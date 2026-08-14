import { Request, Response } from "express";
import { Notification } from "../models/Notification.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";

export const listNotifications = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "name avatarUrl");
  const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  res.json({ notifications, unreadCount });
});

export const markRead = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await Notification.updateOne(
    { _id: req.params.id, recipient: req.user.id },
    { $set: { isRead: true } }
  );
  res.json({ message: "Marked as read." });
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await Notification.updateMany({ recipient: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.json({ message: "All notifications marked as read." });
});
