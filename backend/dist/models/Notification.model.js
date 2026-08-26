"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    recipient: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    type: {
        type: String,
        enum: ["comment", "mention", "invite", "share", "document_updated", "system"],
        required: true,
    },
    message: { type: String, required: true, maxlength: 500 },
    link: String,
    isRead: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
exports.Notification = (0, mongoose_1.model)("Notification", NotificationSchema);
//# sourceMappingURL=Notification.model.js.map