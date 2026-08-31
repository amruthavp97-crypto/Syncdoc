import { Request, Response } from "express";
import { User } from "../models/User.model";
import { ActivityLog } from "../models/ActivityLog.model";
import { SyncDocument } from "../models/Document.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const allowed = ["name", "bio", "skills", "phone", "country", "timezone", "socialLinks", "avatarUrl", "bannerUrl"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // Preferences use dot-notation $set on the specific sub-field rather than
  // replacing the whole `preferences` object - this correctly creates the
  // field on user documents saved before it existed in the schema (a plain
  // object assignment would technically still work here, but dot-notation
  // is the defensively-correct pattern for partial nested updates and
  // avoids ever accidentally clobbering sibling preference fields added
  // later).
  if (req.body.preferences?.emailNotifications !== undefined) {
    updates["preferences.emailNotifications"] = req.body.preferences.emailNotifications;
  }

  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  res.json({ user });
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select(
    "name email avatarUrl bannerUrl bio skills country timezone socialLinks preferences createdAt"
  );
  if (!user) throw ApiError.notFound("User not found");

  const [documentsCreated, documentsShared] = await Promise.all([
    SyncDocument.countDocuments({ owner: user._id, isTrashed: false }),
    SyncDocument.countDocuments({ "permissions.user": user._id, owner: { $ne: user._id } }),
  ]);

  res.json({ user, stats: { documentsCreated, documentsShared } });
});

// --- Admin panel -----------------------------------------------------

export const adminListUsers = catchAsync(async (req: Request, res: Response) => {
  const { q, role, page = "1", limit = "25" } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (q) query.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  if (role) query.role = role;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Number(limit));

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  res.json({ users, total, page: pageNum, limit: limitNum });
});

export const adminUpdateUserRole = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { role } = req.body as { role: "admin" | "editor" | "viewer" };
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw ApiError.notFound("User not found");

  await ActivityLog.create({ actor: req.user.id, action: "user.promoted", metadata: { targetUser: user._id, role } });
  res.json({ user });
});

export const adminSuspendUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  user.isSuspended = !user.isSuspended;
  await user.save();

  await ActivityLog.create({
    actor: req.user.id,
    action: "user.suspended",
    metadata: { targetUser: user._id, suspended: user.isSuspended },
  });
  res.json({ user });
});

export const adminDeleteUser = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export const adminStats = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, activeUsers, totalDocuments, suspendedUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    SyncDocument.countDocuments({ isTrashed: false }),
    User.countDocuments({ isSuspended: true }),
  ]);
  res.json({ totalUsers, activeUsers, totalDocuments, suspendedUsers });
});
