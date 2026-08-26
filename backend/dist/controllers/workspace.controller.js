"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.acceptInvite = exports.inviteMember = exports.getWorkspace = exports.createWorkspace = exports.listMyWorkspaces = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Workspace_model_1 = require("../models/Workspace.model");
const User_model_1 = require("../models/User.model");
const ActivityLog_model_1 = require("../models/ActivityLog.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
const permissions_1 = require("../utils/permissions");
const email_service_1 = require("../services/email.service");
function slugify(name) {
    return (name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
        "-" +
        crypto_1.default.randomBytes(3).toString("hex"));
}
exports.listMyWorkspaces = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const workspaces = await Workspace_model_1.Workspace.find({ "members.user": req.user.id }).sort({ updatedAt: -1 });
    res.json({ workspaces });
});
exports.createWorkspace = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { name, description } = req.body;
    const workspace = await Workspace_model_1.Workspace.create({
        name,
        description,
        slug: slugify(name),
        owner: req.user.id,
    });
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "workspace.created",
        workspace: workspace._id,
    });
    res.status(201).json({ workspace });
});
exports.getWorkspace = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const workspace = await Workspace_model_1.Workspace.findById(req.params.id).populate("members.user", "name email avatarUrl");
    if (!workspace)
        throw ApiError_1.ApiError.notFound("Workspace not found");
    if (!(0, permissions_1.isWorkspaceMember)(workspace, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    res.json({ workspace });
});
exports.inviteMember = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { email, role } = req.body;
    const workspace = await Workspace_model_1.Workspace.findById(req.params.id);
    if (!workspace)
        throw ApiError_1.ApiError.notFound("Workspace not found");
    if (!(0, permissions_1.canManageWorkspace)(workspace, req.user.id)) {
        throw ApiError_1.ApiError.forbidden("Only owners/admins can invite members");
    }
    const existingUser = await User_model_1.User.findOne({ email });
    if (existingUser && (0, permissions_1.isWorkspaceMember)(workspace, existingUser._id.toString())) {
        throw ApiError_1.ApiError.conflict("This user is already a member");
    }
    const token = crypto_1.default.randomBytes(24).toString("hex");
    workspace.invitePending = workspace.invitePending.filter((i) => i.email !== email);
    workspace.invitePending.push({ email, role, invitedAt: new Date(), token });
    await workspace.save();
    await (0, email_service_1.sendWorkspaceInviteEmail)(email, workspace.name, token);
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "workspace.member_invited",
        workspace: workspace._id,
        metadata: { email, role },
    });
    res.json({ message: `Invite sent to ${email}.` });
});
exports.acceptInvite = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const { token } = req.body;
    const workspace = await Workspace_model_1.Workspace.findOne({ "invitePending.token": token });
    if (!workspace)
        throw ApiError_1.ApiError.badRequest("Invite is invalid or has expired");
    const invite = workspace.invitePending.find((i) => i.token === token);
    if (!invite)
        throw ApiError_1.ApiError.badRequest("Invite is invalid or has expired");
    workspace.members.push({ user: req.user.id, role: invite.role, joinedAt: new Date() });
    workspace.invitePending = workspace.invitePending.filter((i) => i.token !== token);
    await workspace.save();
    res.json({ message: `Joined ${workspace.name}.`, workspace });
});
exports.removeMember = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const workspace = await Workspace_model_1.Workspace.findById(req.params.id);
    if (!workspace)
        throw ApiError_1.ApiError.notFound("Workspace not found");
    if (!(0, permissions_1.canManageWorkspace)(workspace, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const targetUserId = req.params.userId;
    if (workspace.owner.toString() === targetUserId) {
        throw ApiError_1.ApiError.badRequest("Cannot remove the workspace owner");
    }
    workspace.members = workspace.members.filter((m) => m.user.toString() !== targetUserId);
    await workspace.save();
    await ActivityLog_model_1.ActivityLog.create({
        actor: req.user.id,
        action: "workspace.member_removed",
        workspace: workspace._id,
        metadata: { targetUserId },
    });
    res.json({ message: "Member removed.", workspace });
});
//# sourceMappingURL=workspace.controller.js.map