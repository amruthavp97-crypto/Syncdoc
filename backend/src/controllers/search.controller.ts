import { Request, Response } from "express";
import { SyncDocument } from "../models/Document.model";
import { User } from "../models/User.model";
import { Workspace } from "../models/Workspace.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";

export const globalSearch = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ documents: [], users: [], workspaces: [] });

  const [documents, users, workspaces] = await Promise.all([
    SyncDocument.find({
      $text: { $search: q },
      isTrashed: false,
      $or: [{ owner: req.user.id }, { "permissions.user": req.user.id }, { isPublic: true }],
    })
      .limit(10)
      .select("title updatedAt"),
    User.find({ name: new RegExp(q, "i") }).limit(10).select("name avatarUrl"),
    Workspace.find({ name: new RegExp(q, "i"), "members.user": req.user.id }).limit(10).select("name slug"),
  ]);

  res.json({ documents, users, workspaces });
});
