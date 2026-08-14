import { Router } from "express";
import * as users from "../controllers/user.controller";
import * as notifications from "../controllers/notification.controller";
import * as dashboard from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";

const router = Router();
router.use(requireAuth);

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
router.get("/admin/users", requireRole("admin"), users.adminListUsers);
router.patch("/admin/users/:id/role", requireRole("admin"), users.adminUpdateUserRole);
router.patch("/admin/users/:id/suspend", requireRole("admin"), users.adminSuspendUser);
router.delete("/admin/users/:id", requireRole("admin"), users.adminDeleteUser);
router.get("/admin/stats", requireRole("admin"), users.adminStats);

export default router;
