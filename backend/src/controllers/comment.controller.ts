import { Request, Response } from "express";
import { Comment } from "../models/Comment.model";
import { SyncDocument } from "../models/Document.model";
import { Notification } from "../models/Notification.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { canViewDocument } from "../utils/permissions";

export const listComments = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.documentId);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  const comments = await Comment.find({ document: doc._id })
    .sort({ createdAt: 1 })
    .populate("author", "name avatarUrl")
    .populate("mentions", "name");
  res.json({ comments });
});

export const addComment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.documentId);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  const { text, parentComment, mentions = [], anchor } = req.body;
  const comment = await Comment.create({
    document: doc._id,
    author: req.user.id,
    text,
    parentComment: parentComment || null,
    mentions,
    anchor: anchor || null,
  });

  const notifTargets = new Set<string>([...mentions]);
  if (doc.owner.toString() !== req.user.id) notifTargets.add(doc.owner.toString());

  await Notification.insertMany(
    Array.from(notifTargets).map((recipient) => ({
      recipient,
      actor: req.user!.id,
      type: mentions.includes(recipient) ? "mention" : "comment",
      message: `${req.user!.id === recipient ? "You" : "Someone"} commented on "${doc.title}"`,
      link: `/documents/${doc._id}`,
    }))
  );

  res.status(201).json({ comment });
});

export const resolveComment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw ApiError.notFound("Comment not found");
  comment.resolved = !comment.resolved;
  await comment.save();
  res.json({ comment });
});

export const reactToComment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { emoji } = req.body as { emoji: string };
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw ApiError.notFound("Comment not found");

  const existingIdx = comment.reactions.findIndex(
    (r) => r.user.toString() === req.user!.id && r.emoji === emoji
  );
  if (existingIdx >= 0) comment.reactions.splice(existingIdx, 1);
  else comment.reactions.push({ user: req.user.id as unknown as never, emoji });

  await comment.save();
  res.json({ comment });
});

export const deleteComment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw ApiError.notFound("Comment not found");
  if (comment.author.toString() !== req.user.id) throw ApiError.forbidden();
  await comment.deleteOne();
  res.status(204).send();
});
