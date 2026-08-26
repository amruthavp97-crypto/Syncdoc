"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const ApiError_1 = require("../utils/ApiError");
const token_service_1 = require("../services/token.service");
const User_model_1 = require("../models/User.model");
async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
        const token = bearer || req.cookies?.accessToken;
        if (!token)
            throw ApiError_1.ApiError.unauthorized("Missing access token");
        const payload = (0, token_service_1.verifyAccessToken)(token);
        const user = await User_model_1.User.findById(payload.sub).select("_id role isSuspended");
        if (!user)
            throw ApiError_1.ApiError.unauthorized("User no longer exists");
        if (user.isSuspended)
            throw ApiError_1.ApiError.forbidden("This account has been suspended");
        req.user = { id: user._id.toString(), role: user.role };
        next();
    }
    catch (err) {
        next(ApiError_1.ApiError.unauthorized("Invalid or expired access token"));
    }
}
/** Attaches req.user if a valid token is present, but never rejects. */
async function optionalAuth(req, _res, next) {
    try {
        const header = req.headers.authorization;
        const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
        const token = bearer || req.cookies?.accessToken;
        if (!token)
            return next();
        const payload = (0, token_service_1.verifyAccessToken)(token);
        const user = await User_model_1.User.findById(payload.sub).select("_id role");
        if (user)
            req.user = { id: user._id.toString(), role: user.role };
    }
    catch {
        // ignore - optional
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map