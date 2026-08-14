import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validation/auth.validation";
import { authRateLimiter } from "../middleware/rateLimit.middleware";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), auth.register);
router.post("/login", authRateLimiter, validate(loginSchema), auth.login);
router.post("/verify-email", validate(verifyEmailSchema), auth.verifyEmail);
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), auth.resetPassword);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);
router.post("/logout-all", requireAuth, auth.logoutAllDevices);
router.get("/me", requireAuth, auth.me);

// OAuth
router.get("/google", auth.googleAuthStart);
router.get("/google/callback", auth.googleAuthCallback);
router.get("/github", auth.githubAuthStart);
router.get("/github/callback", auth.githubAuthCallback);

export default router;
