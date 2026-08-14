import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";
import { redis } from "../config/redis";
import { UserRole } from "../models/User.model";

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
}

const REFRESH_PREFIX = "refresh_token:"; // refresh_token:<jti> -> userId

function refreshTtlSeconds(): number {
  // crude parse of "30d" / "15m" style durations into seconds
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 60 * 24 * 30;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * multipliers[unit];
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Issues a refresh token and records its jti in Redis so it can be
 * revoked individually (logout, password reset, "connected devices"
 * removal) without invalidating every session for the user.
 */
export async function signRefreshToken(userId: string): Promise<string> {
  const jti = uuid();
  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
  await redis.set(`${REFRESH_PREFIX}${jti}`, userId, "EX", refreshTtlSeconds());
  return token;
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string; jti: string }> {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
  const stored = await redis.get(`${REFRESH_PREFIX}${decoded.jti}`);
  if (!stored || stored !== decoded.sub) {
    throw new Error("Refresh token has been revoked or expired");
  }
  return { userId: decoded.sub, jti: decoded.jti };
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  await redis.del(`${REFRESH_PREFIX}${jti}`);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  // Connected-devices "log out everywhere" - scans for this user's jtis.
  // Fine at moderate scale; for very high session counts, maintain a
  // secondary set of jtis per user instead of scanning.
  let cursor = "0";
  do {
    const [next, keys] = await redis.scan(cursor, "MATCH", `${REFRESH_PREFIX}*`, "COUNT", 100);
    cursor = next;
    if (keys.length > 0) {
      const values = await redis.mget(...keys);
      const toDelete = keys.filter((_, i) => values[i] === userId);
      if (toDelete.length > 0) await redis.del(...toDelete);
    }
  } while (cursor !== "0");
}
