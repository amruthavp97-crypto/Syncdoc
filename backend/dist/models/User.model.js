"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ["admin", "editor", "viewer"], default: "editor" },
    avatarUrl: String,
    bannerUrl: String,
    bio: { type: String, maxlength: 500 },
    skills: { type: [String], default: [] },
    phone: String,
    country: String,
    timezone: { type: String, default: "UTC" },
    socialLinks: {
        type: [{ platform: String, url: String }],
        default: [],
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    oauth: {
        googleId: { type: String, index: true, sparse: true },
        githubId: { type: String, index: true, sparse: true },
    },
    isSuspended: { type: Boolean, default: false },
    lastLoginAt: Date,
}, { timestamps: true });
// A user needs either a password or at least one linked OAuth provider.
UserSchema.pre("validate", function (next) {
    const hasPassword = Boolean(this.passwordHash);
    const hasOAuth = Boolean(this.oauth?.googleId || this.oauth?.githubId);
    if (!hasPassword && !hasOAuth) {
        return next(new Error("User requires a password or a linked OAuth provider"));
    }
    next();
});
exports.User = (0, mongoose_1.model)("User", UserSchema);
//# sourceMappingURL=User.model.js.map