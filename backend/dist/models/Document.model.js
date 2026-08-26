"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncDocument = void 0;
const mongoose_1 = require("mongoose");
const DocumentSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 300, default: "Untitled" },
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    folder: { type: mongoose_1.Schema.Types.ObjectId, ref: "Folder", default: null },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: mongoose_1.Schema.Types.Mixed, default: { type: "doc", content: [] } },
    ydocState: { type: Buffer, default: null, select: false },
    permissions: {
        type: [
            {
                user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    isPinnedBy: { type: [mongoose_1.Schema.Types.ObjectId], ref: "User", default: [] },
    isFavoritedBy: { type: [mongoose_1.Schema.Types.ObjectId], ref: "User", default: [] },
    tags: { type: [String], default: [] },
    wordCount: { type: Number, default: 0 },
    lastEditedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
DocumentSchema.index({ title: "text", tags: "text" });
DocumentSchema.pre("save", function (next) {
    const ownerHasEntry = this.permissions.some((p) => p.user.equals(this.owner));
    if (!ownerHasEntry) {
        this.permissions.push({ user: this.owner, permission: "owner" });
    }
    next();
});
exports.SyncDocument = (0, mongoose_1.model)("Document", DocumentSchema);
//# sourceMappingURL=Document.model.js.map