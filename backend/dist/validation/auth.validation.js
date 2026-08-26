"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSchema = exports.verifyEmailSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(120),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8).max(128),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1),
        rememberMe: zod_1.z.boolean().optional(),
    }),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({ email: zod_1.z.string().email() }),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1),
        password: zod_1.z.string().min(8).max(128),
    }),
});
exports.verifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({ token: zod_1.z.string().min(1) }),
});
exports.refreshSchema = zod_1.z.object({
    body: zod_1.z.object({ refreshToken: zod_1.z.string().min(1).optional() }),
});
//# sourceMappingURL=auth.validation.js.map