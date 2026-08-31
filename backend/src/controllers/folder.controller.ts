import { Request, Response } from "express";
import { Folder } from "../models/Folder.model";
import { SyncDocument } from "../models/Document.model";
import { Workspace } from "../models/Workspace.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { isWorkspaceMember } from "../utils/permissions";

export const listFolders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { workspace: workspaceId } = req.query as { workspace?: string };
  if (!workspaceId) throw ApiError.badRequest("workspace query param is required");

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound("Workspace not found");
  if (!isWorkspaceMember(workspace, req.user.id)) throw ApiError.forbidden();

  const folders = await Folder.find({ workspace: workspaceId }).sort({ name: 1 });
  res.json({ folders });
});

export const createFolder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { name, workspace: workspaceId, parent } = req.body as {
    name: string;
    workspace: string;
    parent?: string | null;
  };
  if (!name || !workspaceId) throw ApiError.badRequest("name and workspace are required");

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw ApiError.notFound("Workspace not found");
  if (!isWorkspaceMember(workspace, req.user.id)) throw ApiError.forbidden();

  const folder = await Folder.create({
    name,
    workspace: workspaceId,
    parent: parent || null,
    createdBy: req.user.id,
  });
  res.status(201).json({ folder });
});

export const renameFolder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { name } = req.body as { name: string };
  const folder = await Folder.findById(req.params.id);
  if (!folder) throw ApiError.notFound("Folder not found");

  const workspace = await Workspace.findById(folder.workspace);
  if (!workspace || !isWorkspaceMember(workspace, req.user.id)) throw ApiError.forbidden();

  folder.name = name;
  await folder.save();
  res.json({ folder });
});

export const deleteFolder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const folder = await Folder.findById(req.params.id);
  if (!folder) throw ApiError.notFound("Folder not found");

  const workspace = await Workspace.findById(folder.workspace);
  if (!workspace || !isWorkspaceMember(workspace, req.user.id)) throw ApiError.forbidden();

  // Documents inside the folder are NOT deleted - they're just unfiled,
  // matching how most document tools treat folder deletion (the folder
  // is organizational metadata, not a container that owns its contents).
  await SyncDocument.updateMany({ folder: folder._id }, { $set: { folder: null } });
  await Folder.updateMany({ parent: folder._id }, { $set: { parent: null } });
  await folder.deleteOne();
  res.status(204).send();
});
