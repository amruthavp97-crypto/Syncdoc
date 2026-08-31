import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export type ActivityAction =
  | "document.created"
  | "document.updated"
  | "document.deleted"
  | "document.shared"
  | "workspace.created"
  | "workspace.deleted"
  | "workspace.member_invited"
  | "workspace.member_removed"
  | "user.login"
  | "user.suspended"
  | "user.promoted";

export interface IActivityLog extends MongooseDocument {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  action: ActivityAction;
  workspace?: Types.ObjectId;
  targetDocument?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace" },
    targetDocument: { type: Schema.Types.ObjectId, ref: "Document" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ workspace: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>("ActivityLog", ActivityLogSchema);
