import { Router } from "express";
import * as docs from "../controllers/document.controller";
import * as comments from "../controllers/comment.controller";
import * as exportCtrl from "../controllers/export.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createDocumentSchema,
  updateDocumentSchema,
  addCommentSchema,
} from "../validation/document.validation";

const router = Router();
router.use(requireAuth);

router.get("/", docs.listDocuments);
router.post("/", validate(createDocumentSchema), docs.createDocument);
router.get("/:id", docs.getDocument);
router.patch("/:id", validate(updateDocumentSchema), docs.updateDocument);
router.delete("/:id", docs.trashDocument);
router.delete("/:id/permanent", docs.permanentlyDeleteDocument);
router.post("/:id/restore", docs.restoreDocument);
router.post("/:id/archive", docs.toggleArchive);
router.post("/:id/pin", docs.togglePin);
router.post("/:id/favorite", docs.toggleFavorite);
router.post("/:id/share", docs.shareDocument);

router.get("/:id/versions", docs.listVersions);
router.post("/:id/versions/:versionId/restore", docs.restoreVersion);

router.get("/:documentId/comments", comments.listComments);
router.post("/:documentId/comments", validate(addCommentSchema), comments.addComment);
router.patch("/:documentId/comments/:commentId/resolve", comments.resolveComment);
router.post("/:documentId/comments/:commentId/react", comments.reactToComment);
router.delete("/:documentId/comments/:commentId", comments.deleteComment);

router.get("/:id/export/html", exportCtrl.exportHtml);
router.get("/:id/export/markdown", exportCtrl.exportMarkdown);
router.get("/:id/export/pdf", exportCtrl.exportPdf);

export default router;
