import { Router } from "express";
import * as folders from "../controllers/folder.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/", folders.listFolders);
router.post("/", folders.createFolder);
router.patch("/:id", folders.renameFolder);
router.delete("/:id", folders.deleteFolder);

export default router;
