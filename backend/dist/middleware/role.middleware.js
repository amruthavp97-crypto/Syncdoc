"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const ApiError_1 = require("../utils/ApiError");
function requireRole(...allowed) {
    return (req, _res, next) => {
        if (!req.user)
            return next(ApiError_1.ApiError.unauthorized());
        if (!allowed.includes(req.user.role)) {
            return next(ApiError_1.ApiError.forbidden(`Requires one of roles: ${allowed.join(", ")}`));
        }
        next();
    };
}
//# sourceMappingURL=role.middleware.js.map