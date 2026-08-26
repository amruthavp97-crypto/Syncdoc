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
const docs = __importStar(require("../controllers/document.controller"));
const comments = __importStar(require("../controllers/comment.controller"));
const exportCtrl = __importStar(require("../controllers/export.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const document_validation_1 = require("../validation/document.validation");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.get("/", docs.listDocuments);
router.post("/", (0, validate_middleware_1.validate)(document_validation_1.createDocumentSchema), docs.createDocument);
router.get("/:id", docs.getDocument);
router.patch("/:id", (0, validate_middleware_1.validate)(document_validation_1.updateDocumentSchema), docs.updateDocument);
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
router.post("/:documentId/comments", (0, validate_middleware_1.validate)(document_validation_1.addCommentSchema), comments.addComment);
router.patch("/:documentId/comments/:commentId/resolve", comments.resolveComment);
router.post("/:documentId/comments/:commentId/react", comments.reactToComment);
router.delete("/:documentId/comments/:commentId", comments.deleteComment);
router.get("/:id/export/html", exportCtrl.exportHtml);
router.get("/:id/export/markdown", exportCtrl.exportMarkdown);
router.get("/:id/export/pdf", exportCtrl.exportPdf);
exports.default = router;
//# sourceMappingURL=document.routes.js.map