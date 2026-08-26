"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
function validate(schema) {
    return (req, _res, next) => {
        try {
            schema.parse({ body: req.body, params: req.params, query: req.query });
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
                return next(ApiError_1.ApiError.badRequest(message));
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map