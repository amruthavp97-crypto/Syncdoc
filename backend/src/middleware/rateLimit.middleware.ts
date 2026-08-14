import rateLimit from "express-rate-limit";
import { env } from "../config/env";

// Uses the default in-memory store per-process. For real horizontal
// scaling, swap in `rate-limit-redis` pointed at the same Redis instance
// used for sessions (config/redis.ts) so limits are shared across
// instances - left as in-memory here to keep the dependency surface
// minimal for local dev / a single instance.
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});
