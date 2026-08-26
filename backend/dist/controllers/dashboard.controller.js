"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = exports.getActivityFeed = exports.getDashboardSummary = void 0;
const Document_model_1 = require("../models/Document.model");
const Workspace_model_1 = require("../models/Workspace.model");
const ActivityLog_model_1 = require("../models/ActivityLog.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
exports.getDashboardSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const userId = req.user.id;
    const [documentsCount, workspacesCount, pinned, favorites, recent] = await Promise.all([
        Document_model_1.SyncDocument.countDocuments({ owner: userId, isTrashed: false }),
        Workspace_model_1.Workspace.countDocuments({ "members.user": userId }),
        Document_model_1.SyncDocument.find({ isPinnedBy: userId, isTrashed: false }).sort({ updatedAt: -1 }).limit(6),
        Document_model_1.SyncDocument.find({ isFavoritedBy: userId, isTrashed: false }).sort({ updatedAt: -1 }).limit(6),
        Document_model_1.SyncDocument.find({
            $or: [{ owner: userId }, { "permissions.user": userId }],
            isTrashed: false,
        })
            .sort({ updatedAt: -1 })
            .limit(8)
            .select("-content -ydocState"),
    ]);
    const storageUsedBytes = documentsCount * 4200; // placeholder estimate until file storage is wired up
    res.json({
        cards: {
            documents: documentsCount,
            workspaces: workspacesCount,
            storageUsedBytes,
        },
        pinned,
        favorites,
        recent,
    });
});
exports.getActivityFeed = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { workspace } = req.query;
    const query = workspace ? { workspace } : { actor: req.user.id };
    const activity = await ActivityLog_model_1.ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("actor", "name avatarUrl")
        .populate("targetDocument", "title");
    res.json({ activity });
});
/** Chart.js-ready time series: documents created per day, last 30 days. */
exports.getAnalytics = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { workspace } = req.query;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $gte: since }, isTrashed: false };
    if (workspace)
        match.workspace = workspace;
    const daily = await Document_model_1.SyncDocument.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    const topContributors = await Document_model_1.SyncDocument.aggregate([
        { $match: { isTrashed: false, ...(workspace ? { workspace } : {}) } },
        { $group: { _id: "$owner", documentCount: { $sum: 1 } } },
        { $sort: { documentCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { documentCount: 1, "user.name": 1, "user.avatarUrl": 1 } },
    ]);
    res.json({
        documentsCreatedByDay: daily.map((d) => ({ date: d._id, count: d.count })),
        topContributors,
    });
});
//# sourceMappingURL=dashboard.controller.js.map