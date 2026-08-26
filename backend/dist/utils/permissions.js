"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceRoleOf = workspaceRoleOf;
exports.isWorkspaceMember = isWorkspaceMember;
exports.canManageWorkspace = canManageWorkspace;
exports.documentPermissionOf = documentPermissionOf;
exports.canEditDocument = canEditDocument;
exports.canViewDocument = canViewDocument;
function workspaceRoleOf(workspace, userId) {
    const member = workspace.members.find((m) => m.user.toString() === userId);
    return member ? member.role : null;
}
function isWorkspaceMember(workspace, userId) {
    return workspaceRoleOf(workspace, userId) !== null;
}
function canManageWorkspace(workspace, userId) {
    const role = workspaceRoleOf(workspace, userId);
    return role === "owner" || role === "admin";
}
function documentPermissionOf(doc, userId) {
    if (doc.owner.toString() === userId)
        return "owner";
    if (doc.isPublic)
        return "viewer";
    const entry = doc.permissions.find((p) => p.user.toString() === userId);
    return entry ? entry.permission : null;
}
function canEditDocument(doc, userId) {
    const perm = documentPermissionOf(doc, userId);
    return perm === "owner" || perm === "editor";
}
function canViewDocument(doc, userId) {
    return documentPermissionOf(doc, userId) !== null;
}
//# sourceMappingURL=permissions.js.map