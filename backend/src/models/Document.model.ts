import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export type DocPermission = "owner" | "editor" | "commenter" | "viewer";

interface IDocPermissionEntry {
  user: Types.ObjectId;
  permission: DocPermission;
}

export interface ISyncDocument extends MongooseDocument {
  _id: Types.ObjectId;
  title: string;
  workspace: Types.ObjectId;
  folder: Types.ObjectId | null;
  owner: Types.ObjectId;
  // Rendered TipTap JSON (ProseMirror doc), kept in sync with the Yjs
  // CRDT on every persistence flush - this is what non-realtime reads
  // (dashboard previews, search, export) work from.
  content: Schema.Types.Mixed;
  // Raw Yjs update log so the collaborative session can be restored
  // exactly (undo history, concurrent-edit state) after a server restart.
  ydocState: Buffer | null;
  permissions: IDocPermissionEntry[];
  isPublic: boolean;
  isLocked: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  trashedAt: Date | null;
  isPinnedBy: Types.ObjectId[];
  isFavoritedBy: Types.ObjectId[];
  tags: string[];
  wordCount: number;
  lastEditedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<ISyncDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300, default: "Untitled" },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    folder: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: Schema.Types.Mixed, default: { type: "doc", content: [] } },
    ydocState: { type: Buffer, default: null, select: false },
    permissions: {
      type: [
        {
          user: { type: Schema.Types.ObjectId, ref: "User", required: true },
          permission: {
            type: String,
            enum: ["owner", "editor", "commenter", "viewer"],
            default: "editor",
          },
        },
      ],
      default: [],
    },
    isPublic: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    isPinnedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    isFavoritedBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    tags: { type: [String], default: [] },
    wordCount: { type: Number, default: 0 },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

DocumentSchema.index({ title: "text", tags: "text" });

DocumentSchema.pre("save", function (next) {
  const ownerHasEntry = this.permissions.some((p) => p.user.equals(this.owner));
  if (!ownerHasEntry) {
    this.permissions.push({ user: this.owner, permission: "owner" });
  }
  next();
});

export const SyncDocument = model<ISyncDocument>("Document", DocumentSchema);
