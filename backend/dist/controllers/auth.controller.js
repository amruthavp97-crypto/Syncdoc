"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubAuthCallback = exports.githubAuthStart = exports.googleAuthCallback = exports.googleAuthStart = exports.me = exports.resetPassword = exports.forgotPassword = exports.logoutAllDevices = exports.logout = exports.refresh = exports.login = exports.verifyEmail = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_model_1 = require("../models/User.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
const token_service_1 = require("../services/token.service");
const email_service_1 = require("../services/email.service");
const env_1 = require("../config/env");
const SALT_ROUNDS = 12;
function setRefreshCookie(res, token, rememberMe = true) {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: env_1.env.isProd,
        sameSite: "lax",
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined,
        path: "/api/auth",
    });
}
function publicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
    };
}
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User_model_1.User.findOne({ email });
    if (existing)
        throw ApiError_1.ApiError.conflict("An account with this email already exists");
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    const emailVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
    const user = await User_model_1.User.create({
        name,
        email,
        passwordHash,
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await (0, email_service_1.sendVerificationEmail)(user.email, emailVerificationToken);
    res.status(201).json({
        message: "Account created. Check your email to verify your address.",
        user: publicUser(user),
    });
});
exports.verifyEmail = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { token } = req.body;
    const user = await User_model_1.User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");
    if (!user)
        throw ApiError_1.ApiError.badRequest("Verification link is invalid or has expired");
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    res.json({ message: "Email verified successfully." });
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const user = await User_model_1.User.findOne({ email }).select("+passwordHash");
    if (!user || !user.passwordHash) {
        throw ApiError_1.ApiError.unauthorized("Invalid email or password");
    }
    if (user.isSuspended)
        throw ApiError_1.ApiError.forbidden("This account has been suspended");
    const valid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw ApiError_1.ApiError.unauthorized("Invalid email or password");
    user.lastLoginAt = new Date();
    await user.save();
    const accessToken = (0, token_service_1.signAccessToken)({ sub: user._id.toString(), role: user.role });
    const refreshToken = await (0, token_service_1.signRefreshToken)(user._id.toString());
    setRefreshCookie(res, refreshToken, rememberMe ?? true);
    res.json({ accessToken, user: publicUser(user) });
});
exports.refresh = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token)
        throw ApiError_1.ApiError.unauthorized("Missing refresh token");
    const { userId, jti } = await (0, token_service_1.verifyRefreshToken)(token).catch(() => {
        throw ApiError_1.ApiError.unauthorized("Invalid or expired refresh token");
    });
    const user = await User_model_1.User.findById(userId);
    if (!user || user.isSuspended)
        throw ApiError_1.ApiError.unauthorized("Session no longer valid");
    // Rotate: revoke the used refresh token and issue a new one, so a
    // leaked/replayed refresh token has only a single use window.
    await (0, token_service_1.revokeRefreshToken)(jti);
    const newRefreshToken = await (0, token_service_1.signRefreshToken)(user._id.toString());
    setRefreshCookie(res, newRefreshToken);
    const accessToken = (0, token_service_1.signAccessToken)({ sub: user._id.toString(), role: user.role });
    res.json({ accessToken, user: publicUser(user) });
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (token) {
        try {
            const { jti } = await (0, token_service_1.verifyRefreshToken)(token);
            await (0, token_service_1.revokeRefreshToken)(jti);
        }
        catch {
            // token already invalid - nothing to revoke
        }
    }
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ message: "Logged out." });
});
exports.logoutAllDevices = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    await (0, token_service_1.revokeAllUserSessions)(req.user.id);
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ message: "Logged out of all devices." });
});
exports.forgotPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    const user = await User_model_1.User.findOne({ email });
    // Always respond 200 regardless of whether the account exists, so
    // this endpoint can't be used to enumerate registered emails.
    if (user) {
        const token = crypto_1.default.randomBytes(32).toString("hex");
        user.passwordResetToken = token;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();
        await (0, email_service_1.sendPasswordResetEmail)(user.email, token);
    }
    res.json({ message: "If that email is registered, a reset link has been sent." });
});
exports.resetPassword = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { token, password } = req.body;
    const user = await User_model_1.User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");
    if (!user)
        throw ApiError_1.ApiError.badRequest("Reset link is invalid or has expired");
    user.passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await (0, token_service_1.revokeAllUserSessions)(user._id.toString());
    res.json({ message: "Password reset successfully. Please log in again." });
});
exports.me = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const user = await User_model_1.User.findById(req.user.id);
    if (!user)
        throw ApiError_1.ApiError.notFound("User not found");
    res.json({ user: publicUser(user) });
});
// --- OAuth ---------------------------------------------------------
// Full OAuth (passport-google-oauth20 / passport-github2) needs real
// client credentials to complete the redirect handshake. These routes
// stay mounted and return a clear 501 until GOOGLE_*/GITHUB_* env vars
// are set, rather than 404ing as if the feature doesn't exist - wire in
// `passport` strategies here once credentials are available.
exports.googleAuthStart = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    if (!env_1.env.oauth.google.enabled) {
        throw new ApiError_1.ApiError(501, "Google OAuth is not configured. Set GOOGLE_CLIENT_ID/SECRET.");
    }
    const params = new URLSearchParams({
        client_id: env_1.env.oauth.google.clientId,
        redirect_uri: env_1.env.oauth.google.callbackUrl,
        response_type: "code",
        scope: "openid email profile",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});
exports.googleAuthCallback = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    if (!env_1.env.oauth.google.enabled) {
        throw new ApiError_1.ApiError(501, "Google OAuth is not configured.");
    }
    // TODO: exchange `code` for tokens, fetch profile, findOrCreate a User
    // with oauth.googleId set, then issue access/refresh tokens exactly
    // like `login` above and redirect to `${env.CLIENT_URL}/auth/callback`.
    throw new ApiError_1.ApiError(501, "Google OAuth code exchange not yet implemented.");
});
exports.githubAuthStart = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    if (!env_1.env.oauth.github.enabled) {
        throw new ApiError_1.ApiError(501, "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID/SECRET.");
    }
    const params = new URLSearchParams({
        client_id: env_1.env.oauth.github.clientId,
        redirect_uri: env_1.env.oauth.github.callbackUrl,
        scope: "read:user user:email",
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});
exports.githubAuthCallback = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    if (!env_1.env.oauth.github.enabled) {
        throw new ApiError_1.ApiError(501, "GitHub OAuth is not configured.");
    }
    throw new ApiError_1.ApiError(501, "GitHub OAuth code exchange not yet implemented.");
});
//# sourceMappingURL=auth.controller.js.map