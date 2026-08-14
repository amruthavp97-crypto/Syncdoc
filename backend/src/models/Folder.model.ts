import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export interface IFolder extends MongooseDocument {
  _id: Types.ObjectId;
  name: string;
  workspace: Types.ObjectId;
  parent: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Folder = model<IFolder>("Folder", FolderSchema);
