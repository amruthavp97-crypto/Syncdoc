import { z } from "zod";

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300).default("Untitled"),
    workspace: z.string().min(1),
    folder: z.string().nullable().optional(),
  }),
});

export const updateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300).optional(),
    content: z.any().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    folder: z.string().nullable().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    description: z.string().max(500).optional(),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["admin", "editor", "viewer"]).default("editor"),
  }),
  params: z.object({ id: z.string().min(1) }),
});

export const addCommentSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(3000),
    parentComment: z.string().nullable().optional(),
    mentions: z.array(z.string()).optional(),
    anchor: z.object({ from: z.number(), to: z.number() }).nullable().optional(),
  }),
  params: z.object({ documentId: z.string().min(1) }),
});
