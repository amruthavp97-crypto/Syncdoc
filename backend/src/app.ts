import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";

import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import workspaceRoutes from "./routes/workspace.routes";
import miscRoutes from "./routes/misc.routes";
import searchRoutes from "./routes/search.routes";
import folderRoutes from "./routes/folder.routes";

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Vite auto-picks a different port (5174, 5175…) if 5173 is already in
 * use, which silently breaks a hard-coded single-origin CORS check - the
 * browser blocks the request before it ever reaches the server, and the
 * only symptom is "login doesn't work" with no obvious clue why. In dev,
 * allow any localhost/127.0.0.1 origin in addition to the configured
 * CLIENT_URL; in production, only the configured origin is allowed.
 */
function corsOriginCheck(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (!origin) return callback(null, true); // same-origin / non-browser requests (curl, server-to-server)
  if (origin === env.CLIENT_URL) return callback(null, true);
  if (!env.isProd && LOCALHOST_ORIGIN.test(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} is not allowed`));
}

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOriginCheck, credentials: true }));
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());
  app.use(apiRateLimiter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok", env: env.NODE_ENV }));

  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/workspaces", workspaceRoutes);
  app.use("/api/folders", folderRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api", miscRoutes); // /users, /notifications, /dashboard, /admin

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
