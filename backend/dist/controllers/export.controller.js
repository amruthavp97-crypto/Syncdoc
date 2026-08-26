"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPdf = exports.exportMarkdown = exports.exportHtml = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const Document_model_1 = require("../models/Document.model");
const ApiError_1 = require("../utils/ApiError");
const catchAsync_1 = require("../utils/catchAsync");
const permissions_1 = require("../utils/permissions");
const tiptapToHtml_1 = require("../utils/tiptapToHtml");
function flattenToLines(node, lines = []) {
    if (node.type === "heading") {
        const level = Number(node.attrs?.level) || 1;
        lines.push({ text: extractText(node), style: level === 1 ? "h1" : "h2" });
    }
    else if (node.type === "codeBlock") {
        lines.push({ text: extractText(node), style: "code" });
    }
    else if (node.type === "paragraph") {
        lines.push({ text: extractText(node), style: "body" });
    }
    else if (node.content) {
        node.content.forEach((child) => flattenToLines(child, lines));
    }
    return lines;
}
function extractText(node) {
    if (node.type === "text")
        return node.text || "";
    return (node.content || []).map(extractText).join("");
}
exports.exportHtml = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const html = (0, tiptapToHtml_1.tiptapToSafeHtml)(doc.content, doc.title);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
});
exports.exportMarkdown = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    const lines = flattenToLines(doc.content);
    const md = lines
        .map((l) => {
        if (l.style === "h1")
            return `# ${l.text}`;
        if (l.style === "h2")
            return `## ${l.text}`;
        if (l.style === "code")
            return `\`\`\`\n${l.text}\n\`\`\``;
        return l.text;
    })
        .join("\n\n");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.title}.md"`);
    res.send(`# ${doc.title}\n\n${md}`);
});
exports.exportPdf = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.user)
        throw ApiError_1.ApiError.unauthorized();
    const doc = await Document_model_1.SyncDocument.findById(req.params.id);
    if (!doc)
        throw ApiError_1.ApiError.notFound("Document not found");
    if (!(0, permissions_1.canViewDocument)(doc, req.user.id))
        throw ApiError_1.ApiError.forbidden();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.title.replace(/[^a-z0-9\-_]+/gi, "_")}.pdf"`);
    const pdf = new pdfkit_1.default({ margin: 56 });
    pdf.pipe(res);
    pdf.font("Helvetica-Bold").fontSize(22).text(doc.title, { align: "left" });
    pdf.moveDown();
    const lines = flattenToLines(doc.content);
    for (const line of lines) {
        if (line.style === "h1") {
            pdf.font("Helvetica-Bold").fontSize(18).moveDown(0.5).text(line.text);
        }
        else if (line.style === "h2") {
            pdf.font("Helvetica-Bold").fontSize(14).moveDown(0.4).text(line.text);
        }
        else if (line.style === "code") {
            pdf.font("Courier").fontSize(10).fillColor("#333333").moveDown(0.3).text(line.text, {
                indent: 10,
            });
            pdf.fillColor("#000000").font("Helvetica");
        }
        else {
            pdf.font("Helvetica").fontSize(11).moveDown(0.3).text(line.text || " ");
        }
    }
    pdf.end();
});
//# sourceMappingURL=export.controller.js.map