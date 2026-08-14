import { IWorkspace } from "../models/Workspace.model";
import { ISyncDocument } from "../models/Document.model";

export function workspaceRoleOf(workspace: IWorkspace, userId: string): string | null {
  const member = workspace.members.find((m) => m.user.toString() === userId);
  return member ? member.role : null;
}

export function isWorkspaceMember(workspace: IWorkspace, userId: string): boolean {
  return workspaceRoleOf(workspace, userId) !== null;
}

export function canManageWorkspace(workspace: IWorkspace, userId: string): boolean {
  const role = workspaceRoleOf(workspace, userId);
  return role === "owner" || role === "admin";
}

export function documentPermissionOf(doc: ISyncDocument, userId: string): string | null {
  if (doc.owner.toString() === userId) return "owner";
  if (doc.isPublic) return "viewer";
  const entry = doc.permissions.find((p) => p.user.toString() === userId);
  return entry ? entry.permission : null;
}

export function canEditDocument(doc: ISyncDocument, userId: string): boolean {
  const perm = documentPermissionOf(doc, userId);
  return perm === "owner" || perm === "editor";
}

export function canViewDocument(doc: ISyncDocument, userId: string): boolean {
  return documentPermissionOf(doc, userId) !== null;
}
