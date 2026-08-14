import { Request, Response } from "express";
import { SyncDocument } from "../models/Document.model";
import { Workspace } from "../models/Workspace.model";
import { ActivityLog } from "../models/ActivityLog.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";

export const getDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const userId = req.user.id;

  const [documentsCount, workspacesCount, pinned, favorites, recent] = await Promise.all([
    SyncDocument.countDocuments({ owner: userId, isTrashed: false }),
    Workspace.countDocuments({ "members.user": userId }),
    SyncDocument.find({ isPinnedBy: userId, isTrashed: false }).sort({ updatedAt: -1 }).limit(6),
    SyncDocument.find({ isFavoritedBy: userId, isTrashed: false }).sort({ updatedAt: -1 }).limit(6),
    SyncDocument.find({
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

export const getActivityFeed = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { workspace } = req.query as { workspace?: string };
  const query: Record<string, unknown> = workspace ? { workspace } : { actor: req.user.id };

  const activity = await ActivityLog.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "name avatarUrl")
    .populate("targetDocument", "title");

  res.json({ activity });
});

/** Chart.js-ready time series: documents created per day, last 30 days. */
export const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { workspace } = req.query as { workspace?: string };
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const match: Record<string, unknown> = { createdAt: { $gte: since }, isTrashed: false };
  if (workspace) match.workspace = workspace;

  const daily = await SyncDocument.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topContributors = await SyncDocument.aggregate([
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
