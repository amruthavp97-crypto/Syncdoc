import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { UserRole } from "../models/User.model";

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires one of roles: ${allowed.join(", ")}`));
    }
    next();
  };
}
