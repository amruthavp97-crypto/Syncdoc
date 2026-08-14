import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../models/User.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
} from "../services/token.service";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email.service";
import { env } from "../config/env";

const SALT_ROUNDS = 12;

function setRefreshCookie(res: Response, token: string, rememberMe = true) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined,
    path: "/api/auth",
  });
}

function publicUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
  };
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerificationToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await sendVerificationEmail(user.email, emailVerificationToken);

  res.status(201).json({
    message: "Account created. Check your email to verify your address.",
    user: publicUser(user),
  });
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) throw ApiError.badRequest("Verification link is invalid or has expired");

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully." });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (user.isSuspended) throw ApiError.forbidden("This account has been suspended");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const refreshToken = await signRefreshToken(user._id.toString());
  setRefreshCookie(res, refreshToken, rememberMe ?? true);

  res.json({ accessToken, user: publicUser(user) });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized("Missing refresh token");

  const { userId, jti } = await verifyRefreshToken(token).catch(() => {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  });

  const user = await User.findById(userId);
  if (!user || user.isSuspended) throw ApiError.unauthorized("Session no longer valid");

  // Rotate: revoke the used refresh token and issue a new one, so a
  // leaked/replayed refresh token has only a single use window.
  await revokeRefreshToken(jti);
  const newRefreshToken = await signRefreshToken(user._id.toString());
  setRefreshCookie(res, newRefreshToken);

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  res.json({ accessToken, user: publicUser(user) });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const { jti } = await verifyRefreshToken(token);
      await revokeRefreshToken(jti);
    } catch {
      // token already invalid - nothing to revoke
    }
  }
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ message: "Logged out." });
});

export const logoutAllDevices = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await revokeAllUserSessions(req.user.id);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ message: "Logged out of all devices." });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond 200 regardless of whether the account exists, so
  // this endpoint can't be used to enumerate registered emails.
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(user.email, token);
  }

  res.json({ message: "If that email is registered, a reset link has been sent." });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) throw ApiError.badRequest("Reset link is invalid or has expired");

  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  await revokeAllUserSessions(user._id.toString());

  res.json({ message: "Password reset successfully. Please log in again." });
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound("User not found");
  res.json({ user: publicUser(user) });
});

// --- OAuth ---------------------------------------------------------
// Full OAuth (passport-google-oauth20 / passport-github2) needs real
// client credentials to complete the redirect handshake. These routes
// stay mounted and return a clear 501 until GOOGLE_*/GITHUB_* env vars
// are set, rather than 404ing as if the feature doesn't exist - wire in
// `passport` strategies here once credentials are available.

export const googleAuthStart = catchAsync(async (_req: Request, res: Response) => {
  if (!env.oauth.google.enabled) {
    throw new ApiError(501, "Google OAuth is not configured. Set GOOGLE_CLIENT_ID/SECRET.");
  }
  const params = new URLSearchParams({
    client_id: env.oauth.google.clientId,
    redirect_uri: env.oauth.google.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

export const googleAuthCallback = catchAsync(async (_req: Request, res: Response) => {
  if (!env.oauth.google.enabled) {
    throw new ApiError(501, "Google OAuth is not configured.");
  }
  // TODO: exchange `code` for tokens, fetch profile, findOrCreate a User
  // with oauth.googleId set, then issue access/refresh tokens exactly
  // like `login` above and redirect to `${env.CLIENT_URL}/auth/callback`.
  throw new ApiError(501, "Google OAuth code exchange not yet implemented.");
});

export const githubAuthStart = catchAsync(async (_req: Request, res: Response) => {
  if (!env.oauth.github.enabled) {
    throw new ApiError(501, "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID/SECRET.");
  }
  const params = new URLSearchParams({
    client_id: env.oauth.github.clientId,
    redirect_uri: env.oauth.github.callbackUrl,
    scope: "read:user user:email",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

export const githubAuthCallback = catchAsync(async (_req: Request, res: Response) => {
  if (!env.oauth.github.enabled) {
    throw new ApiError(501, "GitHub OAuth is not configured.");
  }
  throw new ApiError(501, "GitHub OAuth code exchange not yet implemented.");
});
