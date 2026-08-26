"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Folder = void 0;
const mongoose_1 = require("mongoose");
const FolderSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 150 },
    workspace: { type: mongoose_1.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    parent: { type: mongoose_1.Schema.Types.ObjectId, ref: "Folder", default: null },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
exports.Folder = (0, mongoose_1.model)("Folder", FolderSchema);
//# sourceMappingURL=Folder.model.js.map