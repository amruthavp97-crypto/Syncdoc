import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000"),
  CLIENT_URL: z.string().default("http://localhost:5173"),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),

  JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.string().optional().default("587"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("SyncDoc <no-reply@syncdoc.app>"),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().optional().default(""),

  GITHUB_CLIENT_ID: z.string().optional().default(""),
  GITHUB_CLIENT_SECRET: z.string().optional().default(""),
  GITHUB_CALLBACK_URL: z.string().optional().default(""),

  RATE_LIMIT_WINDOW_MS: z.string().default("60000"),
  RATE_LIMIT_MAX: z.string().default("120"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loud - a misconfigured env is the #1 cause of silent
  // production incidents, so we never limp along with partial config.
  console.error("[env] Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
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
