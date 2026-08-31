import { Router } from "express";
import * as ws from "../controllers/workspace.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createWorkspaceSchema, inviteMemberSchema } from "../validation/document.validation";

const router = Router();
router.use(requireAuth);

router.get("/", ws.listMyWorkspaces);
router.post("/", validate(createWorkspaceSchema), ws.createWorkspace);
router.get("/:id", ws.getWorkspace);
router.post("/:id/invite", validate(inviteMemberSchema), ws.inviteMember);
router.post("/accept-invite", ws.acceptInvite);
router.delete("/:id/members/:userId", ws.removeMember);
router.delete("/:id", ws.deleteWorkspace);

export default router;
