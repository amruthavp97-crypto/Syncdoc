"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const CommentSchema = new mongoose_1.Schema({
    document: { type: mongoose_1.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 3000 },
    parentComment: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment", default: null },
    mentions: { type: [mongoose_1.Schema.Types.ObjectId], ref: "User", default: [] },
    reactions: {
        type: [{ user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }, emoji: String }],
        default: [],
    },
    resolved: { type: Boolean, default: false },
    anchor: {
        type: { from: Number, to: Number },
        default: null,
    },
}, { timestamps: true });
exports.Comment = (0, mongoose_1.model)("Comment", CommentSchema);
//# sourceMappingURL=Comment.model.js.map