"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const workspace_routes_1 = __importDefault(require("./routes/workspace.routes"));
const misc_routes_1 = __importDefault(require("./routes/misc.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
/**
 * Vite auto-picks a different port (5174, 5175…) if 5173 is already in
 * use, which silently breaks a hard-coded single-origin CORS check - the
 * browser blocks the request before it ever reaches the server, and the
 * only symptom is "login doesn't work" with no obvious clue why. In dev,
 * allow any localhost/127.0.0.1 origin in addition to the configured
 * CLIENT_URL; in production, only the configured origin is allowed.
 */
function corsOriginCheck(origin, callback) {
    if (!origin)
        return callback(null, true); // same-origin / non-browser requests (curl, server-to-server)
    if (origin === env_1.env.CLIENT_URL)
        return callback(null, true);
    if (!env_1.env.isProd && LOCALHOST_ORIGIN.test(origin))
        return callback(null, true);
    callback(new Error(`CORS: origin ${origin} is not allowed`));
}
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: corsOriginCheck, credentials: true }));
    app.use(express_1.default.json({ limit: "5mb" }));
    app.use((0, cookie_parser_1.default)());
    app.use(rateLimit_middleware_1.apiRateLimiter);
    app.get("/api/health", (_req, res) => res.json({ status: "ok", env: env_1.env.NODE_ENV }));
    app.use("/api/auth", auth_routes_1.default);
    app.use("/api/documents", document_routes_1.default);
    app.use("/api/workspaces", workspace_routes_1.default);
    app.use("/api/search", search_routes_1.default);
    app.use("/api", misc_routes_1.default); // /users, /notifications, /dashboard, /admin
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map