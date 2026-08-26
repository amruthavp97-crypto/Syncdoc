"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreVersion = exports.listVersions = exports.shareDocument = exports.toggleFavorite = exports.togglePin = exports.toggleArchive = exports.permanentlyDeleteDocument = exports.restoreDocument = exports.trashDocument = exports.updateDocument = exports.getDocument = exports.listDocuments = exports.createDocument = void 0;
const Document_model_1 = require("../models/Document.model");
const Workspace_model_1 = require("../models/Workspace.model");
const Version_model_1 = require("../models/Version.model");
const ActivityLog_model_1 = require("../models/ActivityLog.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
const permissions_1 = require("../utils/permissions");
function countWords(content) {
    const text = JSON.stringify(content || "").match(/[A-Za-z0-9']+/g);
    return text ? text.length : 0;
}
exports.createDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { title, workspace: workspaceId, folder } = req.body;
    const workspace = await Workspace_model_1.Workspace.findById(workspaceId);
    if (!workspace)
        throw ApiError_1.ApiError.notFound("Workspace not found");
    if (!(0, permissions_1.isWorkspaceMember)(workspace, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const doc = await Document_model_1.SyncDocument.create({
        title,
        workspace: workspaceId,
        folder: folder || null,
        owner: req.user.id,
    });
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "document.created",
        workspace: workspace._id,
        targetDocument: doc._id,
    });
    res.status(201).json({ document: doc });
});
exports.listDocuments = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { workspace, filter, folder, q } = req.query;
    const query = {
        isTrashed: false,
        $or: [{ owner: req.user.id }, { "permissions.user": req.user.id }, { isPublic: true }],
    };
    if (workspace)
        query.workspace = workspace;
    if (folder)
        query.folder = folder;
    if (q)
        query.$text = { $search: q };
    if (filter === "pinned")
        query.isPinnedBy = req.user.id;
    if (filter === "favorite")
        query.isFavoritedBy = req.user.id;
    if (filter === "archived")
        query.isArchived = true;
    if (filter === "trash") {
        delete query.isTrashed;
        query.isTrashed = true;
    }
    const docs = await Document_model_1.SyncDocument.find(query)
        .sort({ updatedAt: -1 })
        .limit(100)
        .select("-ydocState -content");
    res.json({ documents: docs });
});
exports.getDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    res.json({ document: doc });
});
exports.updateDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canEditDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    if (doc.isLocked)
        throw ApiError_1.ApiError.forbidden("Document is locked (read-only)");
    const { title, content, tags, isPublic, isLocked, folder } = req.body;
    // Snapshot version history before overwriting, but don't spam a new
    // version row for every keystroke - the realtime socket layer handles
    // live sync; this REST path is for discrete saves (e.g. "Save version").
    if (content !== undefined) {
        await Version_model_1.Version.create({ document: doc._id, content: doc.content, editedBy: req.user.id });
        doc.content = content;
        doc.wordCount = countWords(content);
    }
    if (title !== undefined)
        doc.title = title;
    if (tags !== undefined)
        doc.tags = tags;
    if (isPublic !== undefined)
        doc.isPublic = isPublic;
    if (isLocked !== undefined)
        doc.isLocked = isLocked;
    if (folder !== undefined)
        doc.folder = folder;
    doc.lastEditedBy = req.user.id;
    await doc.save();
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "document.updated",
        workspace: doc.workspace,
        targetDocument: doc._id,
    });
    res.json({ document: doc });
});
exports.trashDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canEditDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    doc.isTrashed = true;
    doc.trashedAt = new Date();
    await doc.save();
    res.json({ message: "Moved to trash." });
});
exports.restoreDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canEditDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    doc.isTrashed = false;
    doc.trashedAt = null;
    await doc.save();
    res.json({ message: "Document restored.", document: doc });
});
exports.permanentlyDeleteDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (doc.owner.toString() !== req.user.id) {
        throw ApiError_1.ApiError.forbidden("Only the owner can permanently delete a document");
    }
    await doc.deleteOne();
    await Version_model_1.Version.deleteMany({ document: doc._id });
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "document.deleted",
        workspace: doc.workspace,
        targetDocument: doc._id,
    });
    res.status(204).send();
});
exports.toggleArchive = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canEditDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    doc.isArchived = !doc.isArchived;
    await doc.save();
    res.json({ document: doc });
});
exports.togglePin = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const idx = doc.isPinnedBy.findIndex((id) => id.toString() === req.user.id);
    if (idx >= 0)
        doc.isPinnedBy.splice(idx, 1);
    else
        doc.isPinnedBy.push(req.user.id);
    await doc.save();
    res.json({ document: doc });
});
exports.toggleFavorite = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const idx = doc.isFavoritedBy.findIndex((id) => id.toString() === req.user.id);
    if (idx >= 0)
        doc.isFavoritedBy.splice(idx, 1);
    else
        doc.isFavoritedBy.push(req.user.id);
    await doc.save();
    res.json({ document: doc });
});
exports.shareDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (documentOwnerCheck(doc, req.user.id) === false)
        throw ApiError_1.ApiError.forbidden();
    const { userId, permission } = req.body;
    const existing = doc.permissions.find((p) => p.user.toString() === userId);
    if (existing)
        existing.permission = permission;
    else
        doc.permissions.push({ user: userId, permission: permission });
    await doc.save();
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "document.shared",
        workspace: doc.workspace,
        targetDocument: doc._id,
        metadata: { userId, permission },
    });
    res.json({ document: doc });
});
function documentOwnerCheck(doc, userId) {
    return doc.owner.toString() === userId;
}
exports.listVersions = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const versions = await Version_model_1.Version.find({ document: doc._id })
        .sort({ createdAt: -1 })
        .limit(200)
        .populate("editedBy", "name avatarUrl");
    res.json({ versions });
});
exports.restoreVersion = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canEditDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const version = await Version_model_1.Version.findById(req.params.versionId);
    if (!version || version.document.toString() !== doc._id.toString()) {
        throw ApiError_1.ApiError.notFound("Version not found");
    }
    await Version_model_1.Version.create({ document: doc._id, content: doc.content, editedBy: req.user.id, label: "Before restore" });
    doc.content = version.content;
    await doc.save();
    res.json({ document: doc });
});
//# sourceMappingURL=document.controller.js.map