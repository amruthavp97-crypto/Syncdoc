"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = void 0;
const mongoose_1 = require("mongoose");
const VersionSchema = new mongoose_1.Schema({
    document: { type: mongoose_1.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    content: { type: mongoose_1.Schema.Types.Mixed, required: true },
    editedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    label: String,
}, { timestamps: { createdAt: true, updatedAt: false } });
// Keep version history bounded per document - old snapshots beyond the
// most recent 200 are pruned so a very actively edited doc doesn't grow
// this collection unbounded.
VersionSchema.index({ document: 1, createdAt: -1 });
exports.Version = (0, mongoose_1.model)("Version", VersionSchema);
//# sourceMappingURL=Version.model.js.map