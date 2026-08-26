"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.markRead = exports.listNotifications = void 0;
const Notification_model_1 = require("../models/Notification.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
exports.listNotifications = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const notifications = await Notification_model_1.Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("actor", "name avatarUrl");
    const unreadCount = await Notification_model_1.Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.json({ notifications, unreadCount });
});
exports.markRead = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await Notification_model_1.Notification.updateOne({ _id: req.params.id, recipient: req.user.id }, { $set: { isRead: true } });
    res.json({ message: "Marked as read." });
});
exports.markAllRead = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await Notification_model_1.Notification.updateMany({ recipient: req.user.id, isRead: false }, { $set: { isRead: true } });
    res.json({ message: "All notifications marked as read." });
});
//# sourceMappingURL=notification.controller.js.map