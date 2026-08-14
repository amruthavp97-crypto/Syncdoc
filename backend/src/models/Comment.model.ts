import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export interface IComment extends MongooseDocument {
  _id: Types.ObjectId;
  document: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  parentComment: Types.ObjectId | null;
  mentions: Types.ObjectId[];
  reactions: { user: Types.ObjectId; emoji: string }[];
  resolved: boolean;
  // Character range in the document this comment anchors to.
  anchor: { from: number; to: number } | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    document: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 3000 },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    mentions: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    reactions: {
      type: [{ user: { type: Schema.Types.ObjectId, ref: "User" }, emoji: String }],
      default: [],
    },
    resolved: { type: Boolean, default: false },
    anchor: {
      type: { from: Number, to: Number },
      default: null,
    },
  },
  { timestamps: true }
);

export const Comment = model<IComment>("Comment", CommentSchema);
