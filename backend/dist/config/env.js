"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.string().default("4000"),
    CLIENT_URL: zod_1.z.string().default("http://localhost:5173"),
    MONGO_URI: zod_1.z.string().min(1, "MONGO_URI is required"),
    REDIS_URL: zod_1.z.string().default("redis://127.0.0.1:6379"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(10, "JWT_ACCESS_SECRET is required"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(10, "JWT_REFRESH_SECRET is required"),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default("30d"),
    SMTP_HOST: zod_1.z.string().optional().default(""),
    SMTP_PORT: zod_1.z.string().optional().default("587"),
    SMTP_USER: zod_1.z.string().optional().default(""),
    SMTP_PASS: zod_1.z.string().optional().default(""),
    EMAIL_FROM: zod_1.z.string().default("SyncDoc <no-reply@syncdoc.app>"),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional().default(""),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional().default(""),
    GOOGLE_CALLBACK_URL: zod_1.z.string().optional().default(""),
    GITHUB_CLIENT_ID: zod_1.z.string().optional().default(""),
    GITHUB_CLIENT_SECRET: zod_1.z.string().optional().default(""),
    GITHUB_CALLBACK_URL: zod_1.z.string().optional().default(""),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default("60000"),
    RATE_LIMIT_MAX: zod_1.z.string().default("120"),
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    // Fail fast and loud - a misconfigured env is the #1 cause of silent
    // production incidents, so we never limp along with partial config.
    console.error("[env] Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = {
    ...parsed.data,
    PORT: Number(parsed.data.PORT),
    RATE_LIMIT_WINDOW_MS: Number(parsed.data.RATE_LIMIT_WINDOW_MS),
    RATE_LIMIT_MAX: Number(parsed.data.RATE_LIMIT_MAX),
    isProd: parsed.data.NODE_ENV === "production",
    oauth: {
        google: {
            enabled: Boolean(parsed.data.GOOGLE_CLIENT_ID && parsed.data.GOOGLE_CLIENT_SECRET),
            clientId: parsed.data.GOOGLE_CLIENT_ID,
            clientSecret: parsed.data.GOOGLE_CLIENT_SECRET,
            callbackUrl: parsed.data.GOOGLE_CALLBACK_URL,
        },
        github: {
            enabled: Boolean(parsed.data.GITHUB_CLIENT_ID && parsed.data.GITHUB_CLIENT_SECRET),
            clientId: parsed.data.GITHUB_CLIENT_ID,
            clientSecret: parsed.data.GITHUB_CLIENT_SECRET,
            callbackUrl: parsed.data.GITHUB_CALLBACK_URL,
        },
    },
};
//# sourceMappingURL=env.js.map