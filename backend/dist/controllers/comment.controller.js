"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.reactToComment = exports.resolveComment = exports.addComment = exports.listComments = void 0;
const Comment_model_1 = require("../models/Comment.model");
const Document_model_1 = require("../models/Document.model");
const Notification_model_1 = require("../models/Notification.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
const permissions_1 = require("../utils/permissions");
exports.listComments = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.documentId);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const comments = await Comment_model_1.Comment.find({ document: doc._id })
        .sort({ createdAt: 1 })
        .populate("author", "name avatarUrl")
        .populate("mentions", "name");
    res.json({ comments });
});
exports.addComment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.documentId);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const { text, parentComment, mentions = [], anchor } = req.body;
    const comment = await Comment_model_1.Comment.create({
        document: doc._id,
        author: req.user.id,
        text,
        parentComment: parentComment || null,
        mentions,
        anchor: anchor || null,
    });
    const notifTargets = new Set([...mentions]);
    if (doc.owner.toString() !== req.user.id)
        notifTargets.add(doc.owner.toString());
    await Notification_model_1.Notification.insertMany(Array.from(notifTargets).map((recipient) => ({
        recipient,
        actor: req.user.id,
        type: mentions.includes(recipient) ? "mention" : "comment",
        message: `${req.user.id === recipient ? "You" : "Someone"} commented on "${doc.title}"`,
        link: `/documents/${doc._id}`,
    })));
    res.status(201).json({ comment });
});
exports.resolveComment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const comment = await Comment_model_1.Comment.findById(req.params.commentId);
    if (!comment)
        throw ApiError_1.ApiError.notFound("Comment not found");
    comment.resolved = !comment.resolved;
    await comment.save();
    res.json({ comment });
});
exports.reactToComment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { emoji } = req.body;
    const comment = await Comment_model_1.Comment.findById(req.params.commentId);
    if (!comment)
        throw ApiError_1.ApiError.notFound("Comment not found");
    const existingIdx = comment.reactions.findIndex((r) => r.user.toString() === req.user.id && r.emoji === emoji);
    if (existingIdx >= 0)
        comment.reactions.splice(existingIdx, 1);
    else
        comment.reactions.push({ user: req.user.id, emoji });
    await comment.save();
    res.json({ comment });
});
exports.deleteComment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const comment = await Comment_model_1.Comment.findById(req.params.commentId);
    if (!comment)
        throw ApiError_1.ApiError.notFound("Comment not found");
    if (comment.author.toString() !== req.user.id)
        throw ApiError_1.ApiError.forbidden();
    await comment.deleteOne();
    res.status(204).send();
});
//# sourceMappingURL=comment.controller.js.map