import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export type NotificationType =
  | "comment"
  | "mention"
  | "invite"
  | "share"
  | "document_updated"
  | "system";

export interface INotification extends MongooseDocument {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  actor: Types.ObjectId | null;
  type: NotificationType;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: ["comment", "mention", "invite", "share", "document_updated", "system"],
      required: true,
    },
    message: { type: String, required: true, maxlength: 500 },
    link: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification", NotificationSchema);
