"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = void 0;
const Document_model_1 = require("../models/Document.model");
const User_model_1 = require("../models/User.model");
const Workspace_model_1 = require("../models/Workspace.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
exports.globalSearch = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const q = String(req.query.q || "").trim();
    if (!q)
        return res.json({ documents: [], users: [], workspaces: [] });
    const [documents, users, workspaces] = await Promise.all([
        Document_model_1.SyncDocument.find({
            $text: { $search: q },
            isTrashed: false,
            $or: [{ owner: req.user.id }, { "permissions.user": req.user.id }, { isPublic: true }],
        })
            .limit(10)
            .select("title updatedAt"),
        User_model_1.User.find({ name: new RegExp(q, "i") }).limit(10).select("name avatarUrl"),
        Workspace_model_1.Workspace.find({ name: new RegExp(q, "i"), "members.user": req.user.id }).limit(10).select("name slug"),
    ]);
    res.json({ documents, users, workspaces });
});
//# sourceMappingURL=search.controller.js.map