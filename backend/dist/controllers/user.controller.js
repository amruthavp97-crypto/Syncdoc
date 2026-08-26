"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminStats = exports.adminDeleteUser = exports.adminSuspendUser = exports.adminUpdateUserRole = exports.adminListUsers = exports.getProfile = exports.updateProfile = void 0;
const User_model_1 = require("../models/User.model");
const ActivityLog_model_1 = require("../models/ActivityLog.model");
const Document_model_1 = require("../models/Document.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const allowed = ["name", "bio", "skills", "phone", "country", "timezone", "socialLinks", "avatarUrl", "bannerUrl"];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined)
            updates[key] = req.body[key];
    }
    const user = await User_model_1.User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ user });
});
exports.getProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const user = await User_model_1.User.findById(req.params.id).select("name email avatarUrl bannerUrl bio skills country timezone socialLinks createdAt");
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    const [documentsCreated, documentsShared] = await Promise.all([
        Document_model_1.SyncDocument.countDocuments({ owner: user._id, isTrashed: false }),
        Document_model_1.SyncDocument.countDocuments({ "permissions.user": user._id, owner: { $ne: user._id } }),
    ]);
    res.json({ user, stats: { documentsCreated, documentsShared } });
});
// --- Admin panel -----------------------------------------------------
exports.adminListUsers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { q, role, page = "1", limit = "25" } = req.query;
    const query = {};
    if (q)
        query.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
    if (role)
        query.role = role;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const [users, total] = await Promise.all([
        User_model_1.User.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum),
        User_model_1.User.countDocuments(query),
    ]);
    res.json({ users, total, page: pageNum, limit: limitNum });
});
exports.adminUpdateUserRole = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { role } = req.body;
    const user = await User_model_1.User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    await ActivityLog_model_1.ActivityLog.create({ actor: req.user.id, action: "user.promoted", metadata: { targetUser: user._id, role } });
    res.json({ user });
});
exports.adminSuspendUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const user = await User_model_1.User.findById(req.params.id);
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    user.isSuspended = !user.isSuspended;
    await user.save();
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "user.suspended",
        metadata: { targetUser: user._id, suspended: user.isSuspended },
    });
    res.json({ user });
});
exports.adminDeleteUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    await User_model_1.User.findByIdAndDelete(req.params.id);
    res.status(204).send();
});
exports.adminStats = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const [totalUsers, activeUsers, totalDocuments, suspendedUsers] = await Promise.all([
        User_model_1.User.countDocuments(),
        User_model_1.User.countDocuments({ lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
        Document_model_1.SyncDocument.countDocuments({ isTrashed: false }),
        User_model_1.User.countDocuments({ isSuspended: true }),
    ]);
    res.json({ totalUsers, activeUsers, totalDocuments, suspendedUsers });
});
//# sourceMappingURL=user.controller.js.map