"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommentSchema = exports.inviteMemberSchema = exports.createWorkspaceSchema = exports.updateDocumentSchema = exports.createDocumentSchema = void 0;
const zod_1 = require("zod");
exports.createDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(300).default("Untitled"),
        workspace: zod_1.z.string().min(1),
        folder: zod_1.z.string().nullable().optional(),
    }),
});
exports.updateDocumentSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(300).optional(),
        content: zod_1.z.any().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        isPublic: zod_1.z.boolean().optional(),
        isLocked: zod_1.z.boolean().optional(),
        folder: zod_1.z.string().nullable().optional(),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.createWorkspaceSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(150),
        description: zod_1.z.string().max(500).optional(),
    }),
});
exports.inviteMemberSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        role: zod_1.z.enum(["admin", "editor", "viewer"]).default("editor"),
    }),
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
});
exports.addCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string().min(1).max(3000),
        parentComment: zod_1.z.string().nullable().optional(),
        mentions: zod_1.z.array(zod_1.z.string()).optional(),
        anchor: zod_1.z.object({ from: zod_1.z.number(), to: zod_1.z.number() }).nullable().optional(),
    }),
    params: zod_1.z.object({ documentId: zod_1.z.string().min(1) }),
});
//# sourceMappingURL=document.validation.js.map