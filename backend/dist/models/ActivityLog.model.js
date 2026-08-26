"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
const mongoose_1 = require("mongoose");
const ActivityLogSchema = new mongoose_1.Schema({
    actor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: "Workspace" },
    targetDocument: { type: mongoose_1.Schema.Types.ObjectId, ref: "Document" },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });
ActivityLogSchema.index({ workspace: 1, createdAt: -1 });
exports.ActivityLog = (0, mongoose_1.model)("ActivityLog", ActivityLogSchema);
//# sourceMappingURL=ActivityLog.model.js.map