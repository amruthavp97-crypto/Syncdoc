"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workspace = void 0;
const mongoose_1 = require("mongoose");
const WorkspaceSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    avatarUrl: String,
    description: { type: String, maxlength: 500 },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    members: {
        type: [
            {
                user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
}, { timestamps: true });
WorkspaceSchema.pre("save", function (next) {
    const ownerIsMember = this.members.some((m) => m.user.equals(this.owner));
    if (!ownerIsMember) {
        this.members.push({ user: this.owner, role: "owner", joinedAt: new Date() });
    }
    next();
});
exports.Workspace = (0, mongoose_1.model)("Workspace", WorkspaceSchema);
//# sourceMappingURL=Workspace.model.js.map