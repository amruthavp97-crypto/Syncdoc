"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users = __importStar(require("../controllers/user.controller"));
const notifications = __importStar(require("../controllers/notification.controller"));
const dashboard = __importStar(require("../controllers/dashboard.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// Profile
router.get("/users/:id", users.getProfile);
router.patch("/users/me", users.updateProfile);
// Notifications
router.get("/notifications", notifications.listNotifications);
router.patch("/notifications/:id/read", notifications.markRead);
router.patch("/notifications/read-all", notifications.markAllRead);
// Dashboard
router.get("/dashboard/summary", dashboard.getDashboardSummary);
router.get("/dashboard/activity", dashboard.getActivityFeed);
router.get("/dashboard/analytics", dashboard.getAnalytics);
// Admin panel (admin role only)
router.get("/admin/users", (0, role_middleware_1.requireRole)("admin"), users.adminListUsers);
router.patch("/admin/users/:id/role", (0, role_middleware_1.requireRole)("admin"), users.adminUpdateUserRole);
router.patch("/admin/users/:id/suspend", (0, role_middleware_1.requireRole)("admin"), users.adminSuspendUser);
router.delete("/admin/users/:id", (0, role_middleware_1.requireRole)("admin"), users.adminDeleteUser);
router.get("/admin/stats", (0, role_middleware_1.requireRole)("admin"), users.adminStats);
exports.default = router;
//# sourceMappingURL=misc.routes.js.map