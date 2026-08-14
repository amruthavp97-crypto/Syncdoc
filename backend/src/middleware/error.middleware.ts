import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (!err.isOperational) {
      console.error("[error] non-operational:", err);
    }
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error("[error] unhandled:", err);
  res.status(500).json({
    error: "Something went wrong",
    ...(env.isProd ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}
