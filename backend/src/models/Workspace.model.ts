import { Schema, model, Document as MongooseDocument, Types } from "mongoose";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

interface IWorkspaceMember {
  user: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface IWorkspace extends MongooseDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  avatarUrl?: string;
  description?: string;
  owner: Types.ObjectId;
  members: IWorkspaceMember[];
  invitePending: { email: string; role: WorkspaceRole; invitedAt: Date; token: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    avatarUrl: String,
    description: { type: String, maxlength: 500 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: {
      type: [
        {
          user: { type: Schema.Types.ObjectId, ref: "User", required: true },
          role: { type: String, enum: ["owner", "admin", "editor", "viewer"], default: "editor" },
          joinedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    invitePending: {
      type: [
        {
          email: { type: String, required: true, lowercase: true },
          role: { type: String, enum: ["admin", "editor", "viewer"], default: "editor" },
          invitedAt: { type: Date, default: Date.now },
          token: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

WorkspaceSchema.pre("save", function (next) {
  const ownerIsMember = this.members.some((m) => m.user.equals(this.owner));
  if (!ownerIsMember) {
    this.members.push({ user: this.owner, role: "owner", joinedAt: new Date() });
  }
  next();
});

export const Workspace = model<IWorkspace>("Workspace", WorkspaceSchema);
