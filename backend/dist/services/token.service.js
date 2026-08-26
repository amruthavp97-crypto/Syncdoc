"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeAllUserSessions = revokeAllUserSessions;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
const REFRESH_PREFIX = "refresh_token:"; // refresh_token:<jti> -> userId
function refreshTtlSeconds() {
    // crude parse of "30d" / "15m" style durations into seconds
    const match = env_1.env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    if (!match)
        return 60 * 60 * 24 * 30;
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[unit];
}
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
        expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN,
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
}
/**
 * Issues a refresh token and records its jti in Redis so it can be
 * revoked individually (logout, password reset, "connected devices"
 * removal) without invalidating every session for the user.
 */
async function signRefreshToken(userId) {
    const jti = (0, uuid_1.v4)();
    const token = jsonwebtoken_1.default.sign({ sub: userId, jti }, env_1.env.JWT_REFRESH_SECRET, {
        expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
    });
    await redis_1.redis.set(`${REFRESH_PREFIX}${jti}`, userId, "EX", refreshTtlSeconds());
    return token;
}
async function verifyRefreshToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
    const stored = await redis_1.redis.get(`${REFRESH_PREFIX}${decoded.jti}`);
    if (!stored || stored !== decoded.sub) {
        throw new Error("Refresh token has been revoked or expired");
    }
    return { userId: decoded.sub, jti: decoded.jti };
}
async function revokeRefreshToken(jti) {
    await redis_1.redis.del(`${REFRESH_PREFIX}${jti}`);
}
async function revokeAllUserSessions(userId) {
    // Connected-devices "log out everywhere" - scans for this user's jtis.
    // Fine at moderate scale; for very high session counts, maintain a
    // secondary set of jtis per user instead of scanning.
    let cursor = "0";
    do {
        const [next, keys] = await redis_1.redis.scan(cursor, "MATCH", `${REFRESH_PREFIX}*`, "COUNT", 100);
        cursor = next;
        if (keys.length > 0) {
            const values = await redis_1.redis.mget(...keys);
            const toDelete = keys.filter((_, i) => values[i] === userId);
            if (toDelete.length > 0)
                await redis_1.redis.del(...toDelete);
        }
    } while (cursor !== "0");
}
//# sourceMappingURL=token.service.js.map