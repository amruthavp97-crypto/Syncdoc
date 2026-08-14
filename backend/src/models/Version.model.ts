import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export interface IVersion extends MongooseDocument {
  _id: Types.ObjectId;
  document: Types.ObjectId;
  content: Schema.Types.Mixed;
  editedBy: Types.ObjectId;
  label?: string;
  createdAt: Date;
}

const VersionSchema = new Schema<IVersion>(
  {
    document: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    content: { type: Schema.Types.Mixed, required: true },
    editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Keep version history bounded per document - old snapshots beyond the
// most recent 200 are pruned so a very actively edited doc doesn't grow
// this collection unbounded.
VersionSchema.index({ document: 1, createdAt: -1 });

export const Version = model<IVersion>("Version", VersionSchema);
