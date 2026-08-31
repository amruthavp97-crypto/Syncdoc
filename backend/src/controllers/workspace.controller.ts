import { Request, Response } from "express";
import crypto from "crypto";
import { Workspace } from "../models/Workspace.model";
import { User } from "../models/User.model";
import { SyncDocument } from "../models/Document.model";
import { Version } from "../models/Version.model";
import { Folder } from "../models/Folder.model";
import { ActivityLog } from "../models/ActivityLog.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { canManageWorkspace, isWorkspaceMember } from "../utils/permissions";
import { sendWorkspaceInviteEmail } from "../services/email.service";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    crypto.randomBytes(3).toString("hex")
  );
}

export const listMyWorkspaces = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const workspaces = await Workspace.find({ "members.user": req.user.id }).sort({ updatedAt: -1 });
  res.json({ workspaces });
});

export const createWorkspace = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { name, description } = req.body;

  const workspace = await Workspace.create({
    name,
    description,
    slug: slugify(name),
    owner: req.user.id,
  });

  await ActivityLog.create({
    actor: req.user.id,
    action: "workspace.created",
    workspace: workspace._id,
  });

  res.status(201).json({ workspace });
});

export const getWorkspace = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const workspace = await Workspace.findById(req.params.id).populate(
    "members.user",
    "name email avatarUrl"
  );
  if (!workspace) throw ApiError.notFound("Workspace not found");
  if (!isWorkspaceMember(workspace, req.user.id)) throw ApiError.forbidden();
  res.json({ workspace });
});

export const inviteMember = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { email, role } = req.body;

  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw ApiError.notFound("Workspace not found");
  if (!canManageWorkspace(workspace, req.user.id)) {
    throw ApiError.forbidden("Only owners/admins can invite members");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser && isWorkspaceMember(workspace, existingUser._id.toString())) {
    throw ApiError.conflict("This user is already a member");
  }

  const token = crypto.randomBytes(24).toString("hex");
  workspace.invitePending = workspace.invitePending.filter((i) => i.email !== email);
  workspace.invitePending.push({ email, role, invitedAt: new Date(), token });
  await workspace.save();

  await sendWorkspaceInviteEmail(email, workspace.name, token);
  await ActivityLog.create({
    actor: req.user.id,
    action: "workspace.member_invited",
    workspace: workspace._id,
    metadata: { email, role },
  });

  res.json({ message: `Invite sent to ${email}.` });
});

export const acceptInvite = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { token } = req.body;

  const workspace = await Workspace.findOne({ "invitePending.token": token });
  if (!workspace) throw ApiError.badRequest("Invite is invalid or has expired");

  const invite = workspace.invitePending.find((i) => i.token === token);
  if (!invite) throw ApiError.badRequest("Invite is invalid or has expired");

  workspace.members.push({ user: req.user.id as unknown as never, role: invite.role, joinedAt: new Date() });
  workspace.invitePending = workspace.invitePending.filter((i) => i.token !== token);
  await workspace.save();

  res.json({ message: `Joined ${workspace.name}.`, workspace });
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw ApiError.notFound("Workspace not found");
  if (!canManageWorkspace(workspace, req.user.id)) throw ApiError.forbidden();

  const targetUserId = req.params.userId;
  if (workspace.owner.toString() === targetUserId) {
    throw ApiError.badRequest("Cannot remove the workspace owner");
  }
  workspace.members = workspace.members.filter((m) => m.user.toString() !== targetUserId);
  await workspace.save();

  await ActivityLog.create({
    actor: req.user.id,
    action: "workspace.member_removed",
    workspace: workspace._id,
    metadata: { targetUserId },
  });

  res.json({ message: "Member removed.", workspace });
});

export const deleteWorkspace = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const workspace = await Workspace.findById(req.params.id);
  if (!workspace) throw ApiError.notFound("Workspace not found");
  if (workspace.owner.toString() !== req.user.id) {
    throw ApiError.forbidden("Only the workspace owner can delete it");
  }

  // Cascade delete: a Document requires a workspace reference, so leaving
  // orphaned documents behind would break every read of them. This is
  // destructive and irreversible, which is why the frontend requires
  // typing the workspace name to confirm before calling this.
  const docsInWorkspace = await SyncDocument.find({ workspace: workspace._id }).select("_id");
  const docIds = docsInWorkspace.map((d) => d._id);

  await Promise.all([
    SyncDocument.deleteMany({ workspace: workspace._id }),
    Version.deleteMany({ document: { $in: docIds } }),
    Folder.deleteMany({ workspace: workspace._id }),
  ]);

  await workspace.deleteOne();
  await ActivityLog.create({
    actor: req.user.id,
    action: "workspace.deleted",
    metadata: { workspaceId: workspace._id, name: workspace.name, documentsDeleted: docIds.length },
  });

  res.status(204).send();
});
