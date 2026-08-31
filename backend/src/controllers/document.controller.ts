import { Request, Response } from "express";
import { SyncDocument } from "../models/Document.model";
import { User } from "../models/User.model";
import { Workspace } from "../models/Workspace.model";
import { Version } from "../models/Version.model";
import { ActivityLog } from "../models/ActivityLog.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { canEditDocument, canViewDocument, isWorkspaceMember } from "../utils/permissions";

function countWords(content: unknown): number {
  const text = JSON.stringify(content || "").match(/[A-Za-z0-9']+/g);
  return text ? text.length : 0;
}

export const createDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { title, workspace: workspaceId, folder } = req.body;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound("Workspace not found");
  if (!isWorkspaceMember(workspace, req.user.id)) throw ApiError.forbidden();

  const doc = await SyncDocument.create({
    title,
    workspace: workspaceId,
    folder: folder || null,
    owner: req.user.id,
  });

  await ActivityLog.create({
    actor: req.user.id,
    action: "document.created",
    workspace: workspace._id,
    targetDocument: doc._id,
  });

  res.status(201).json({ document: doc });
});

export const listDocuments = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { workspace, filter, folder, q } = req.query as Record<string, string | undefined>;

  const query: Record<string, unknown> = {
    isTrashed: false,
    $or: [{ owner: req.user.id }, { "permissions.user": req.user.id }, { isPublic: true }],
  };
  if (workspace) query.workspace = workspace;
  if (folder) query.folder = folder;
  if (q) query.$text = { $search: q };

  if (filter === "pinned") query.isPinnedBy = req.user.id;
  if (filter === "favorite") query.isFavoritedBy = req.user.id;
  if (filter === "archived") query.isArchived = true;
  if (filter === "trash") {
    delete query.isTrashed;
    query.isTrashed = true;
  }

  const docs = await SyncDocument.find(query)
    .sort({ updatedAt: -1 })
    .limit(100)
    .select("-ydocState -content");

  res.json({ documents: docs });
});

export const getDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();
  res.json({ document: doc });
});

export const updateDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canEditDocument(doc, req.user.id)) throw ApiError.forbidden();
  if (doc.isLocked) throw ApiError.forbidden("Document is locked (read-only)");

  const { title, content, tags, isPublic, isLocked, folder } = req.body;

  // Snapshot version history before overwriting, but don't spam a new
  // version row for every keystroke - the realtime socket layer handles
  // live sync; this REST path is for discrete saves (e.g. "Save version").
  if (content !== undefined) {
    await Version.create({ document: doc._id, content: doc.content, editedBy: req.user.id });
    doc.content = content;
    doc.wordCount = countWords(content);
  }
  if (title !== undefined) doc.title = title;
  if (tags !== undefined) doc.tags = tags;
  if (isPublic !== undefined) doc.isPublic = isPublic;
  if (isLocked !== undefined) doc.isLocked = isLocked;
  if (folder !== undefined) doc.folder = folder;
  doc.lastEditedBy = req.user.id as unknown as never;

  await doc.save();
  await ActivityLog.create({
    actor: req.user.id,
    action: "document.updated",
    workspace: doc.workspace,
    targetDocument: doc._id,
  });

  res.json({ document: doc });
});

export const trashDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canEditDocument(doc, req.user.id)) throw ApiError.forbidden();

  doc.isTrashed = true;
  doc.trashedAt = new Date();
  await doc.save();
  res.json({ message: "Moved to trash." });
});

export const restoreDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canEditDocument(doc, req.user.id)) throw ApiError.forbidden();

  doc.isTrashed = false;
  doc.trashedAt = null;
  await doc.save();
  res.json({ message: "Document restored.", document: doc });
});

export const permanentlyDeleteDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (doc.owner.toString() !== req.user.id) {
    throw ApiError.forbidden("Only the owner can permanently delete a document");
  }
  await doc.deleteOne();
  await Version.deleteMany({ document: doc._id });
  await ActivityLog.create({
    actor: req.user.id,
    action: "document.deleted",
    workspace: doc.workspace,
    targetDocument: doc._id,
  });
  res.status(204).send();
});

export const toggleArchive = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canEditDocument(doc, req.user.id)) throw ApiError.forbidden();
  doc.isArchived = !doc.isArchived;
  await doc.save();
  res.json({ document: doc });
});

export const togglePin = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  const idx = doc.isPinnedBy.findIndex((id) => id.toString() === req.user!.id);
  if (idx >= 0) doc.isPinnedBy.splice(idx, 1);
  else doc.isPinnedBy.push(req.user.id as unknown as never);
  await doc.save();
  res.json({ document: doc });
});

export const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  const idx = doc.isFavoritedBy.findIndex((id) => id.toString() === req.user!.id);
  if (idx >= 0) doc.isFavoritedBy.splice(idx, 1);
  else doc.isFavoritedBy.push(req.user.id as unknown as never);
  await doc.save();
  res.json({ document: doc });
});

export const shareDocument = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (documentOwnerCheck(doc, req.user.id) === false) throw ApiError.forbidden();

  const { userId, email, permission } = req.body as { userId?: string; email?: string; permission: string };
  let targetUserId = userId;

  if (!targetUserId && email) {
    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) throw ApiError.notFound(`No user found with email ${email}`);
    targetUserId = targetUser._id.toString();
  }
  if (!targetUserId) throw ApiError.badRequest("Provide either a userId or an email to share with");
  if (targetUserId === doc.owner.toString()) throw ApiError.badRequest("Document owner already has full access");

  const existing = doc.permissions.find((p) => p.user.toString() === targetUserId);
  if (existing) existing.permission = permission as never;
  else doc.permissions.push({ user: targetUserId as unknown as never, permission: permission as never });

  await doc.save();
  await ActivityLog.create({
    actor: req.user.id,
    action: "document.shared",
    workspace: doc.workspace,
    targetDocument: doc._id,
    metadata: { targetUserId, permission },
  });

  res.json({ document: doc });
});

function documentOwnerCheck(doc: InstanceType<typeof SyncDocument>, userId: string) {
  return doc.owner.toString() === userId;
}

export const listVersions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  const versions = await Version.find({ document: doc._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("editedBy", "name avatarUrl");
  res.json({ versions });
});

export const restoreVersion = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canEditDocument(doc, req.user.id)) throw ApiError.forbidden();

  const version = await Version.findById(req.params.versionId);
  if (!version || version.document.toString() !== doc._id.toString()) {
    throw ApiError.notFound("Version not found");
  }

  await Version.create({ document: doc._id, content: doc.content, editedBy: req.user.id, label: "Before restore" });
  doc.content = version.content;
  await doc.save();

  res.json({ document: doc });
});
