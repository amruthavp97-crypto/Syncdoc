import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { SyncDocument } from "../models/Document.model";
import { ApiError } from "../utils/ApiError";
import { catchAsync } from "../utils/catchAsync";
import { canViewDocument } from "../utils/permissions";
import { tiptapToSafeHtml } from "../utils/tiptapToHtml";

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
}

function flattenToLines(node: TipTapNode, lines: { text: string; style: "h1" | "h2" | "body" | "code" }[] = []) {
  if (node.type === "heading") {
    const level = Number(node.attrs?.level) || 1;
    lines.push({ text: extractText(node), style: level === 1 ? "h1" : "h2" });
  } else if (node.type === "codeBlock") {
    lines.push({ text: extractText(node), style: "code" });
  } else if (node.type === "paragraph") {
    lines.push({ text: extractText(node), style: "body" });
  } else if (node.content) {
    node.content.forEach((child) => flattenToLines(child, lines));
  }
  return lines;
}

function extractText(node: TipTapNode): string {
  if (node.type === "text") return node.text || "";
  return (node.content || []).map(extractText).join("");
}

export const exportHtml = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  const html = tiptapToSafeHtml(doc.content as any, doc.title);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export const exportMarkdown = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  const lines = flattenToLines(doc.content as unknown as TipTapNode);
  const md = lines
    .map((l) => {
      if (l.style === "h1") return `# ${l.text}`;
      if (l.style === "h2") return `## ${l.text}`;
      if (l.style === "code") return `\`\`\`\n${l.text}\n\`\`\``;
      return l.text;
    })
    .join("\n\n");

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${doc.title}.md"`);
  res.send(`# ${doc.title}\n\n${md}`);
});

export const exportPdf = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const doc = await SyncDocument.findById(req.params.id);
  if (!doc) throw ApiError.notFound("Document not found");
  if (!canViewDocument(doc, req.user.id)) throw ApiError.forbidden();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${doc.title.replace(/[^a-z0-9\-_]+/gi, "_")}.pdf"`
  );

  const pdf = new PDFDocument({ margin: 56 });
  pdf.pipe(res);

  pdf.font("Helvetica-Bold").fontSize(22).text(doc.title, { align: "left" });
  pdf.moveDown();

  const lines = flattenToLines(doc.content as unknown as TipTapNode);
  for (const line of lines) {
    if (line.style === "h1") {
      pdf.font("Helvetica-Bold").fontSize(18).moveDown(0.5).text(line.text);
    } else if (line.style === "h2") {
      pdf.font("Helvetica-Bold").fontSize(14).moveDown(0.4).text(line.text);
    } else if (line.style === "code") {
      pdf.font("Courier").fontSize(10).fillColor("#333333").moveDown(0.3).text(line.text, {
        indent: 10,
      });
      pdf.fillColor("#000000").font("Helvetica");
    } else {
      pdf.font("Helvetica").fontSize(11).moveDown(0.3).text(line.text || " ");
    }
  }

  pdf.end();
});
