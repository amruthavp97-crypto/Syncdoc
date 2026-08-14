import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../services/token.service";
import { User, UserRole } from "../models/User.model";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearer || req.cookies?.accessToken;
    if (!token) throw ApiError.unauthorized("Missing access token");

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("_id role isSuspended");
    if (!user) throw ApiError.unauthorized("User no longer exists");
    if (user.isSuspended) throw ApiError.forbidden("This account has been suspended");

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

/** Attaches req.user if a valid token is present, but never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const token = bearer || req.cookies?.accessToken;
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("_id role");
    if (user) req.user = { id: user._id.toString(), role: user.role };
  } catch {
    // ignore - optional
  }
  next();
}
