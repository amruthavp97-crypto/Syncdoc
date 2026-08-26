"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const ApiError_1 = require("../utils/ApiError");
const env_1 = require("../config/env");
function notFoundHandler(req, res) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
function errorHandler(err, req, res, _next) {
    if (err instanceof ApiError_1.ApiError) {
        if (!err.isOperational) {
            console.error("[error] non-operational:", err);
        }
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[error] unhandled:", err);
    res.status(500).json({
        error: "Something went wrong",
        ...(env_1.env.isProd ? {} : { detail: err instanceof Error ? err.message : String(err) }),
    });
}
//# sourceMappingURL=error.middleware.js.map