"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tiptapToSafeHtml = tiptapToSafeHtml;
const sanitize_1 = require("./sanitize");
function renderMarks(text, marks = []) {
    let html = (0, sanitize_1.sanitizePlainText)(text);
    for (const mark of marks) {
        switch (mark.type) {
            case "bold":
                html = `<strong>${html}</strong>`;
                break;
            case "italic":
                html = `<em>${html}</em>`;
                break;
            case "code":
                html = `<code>${html}</code>`;
                break;
            case "strike":
                html = `<s>${html}</s>`;
                break;
            case "link": {
                const href = mark.attrs?.href;
                const safeHref = typeof href === "string" && /^https?:\/\//i.test(href) ? href : "#";
                html = `<a href="${(0, sanitize_1.sanitizePlainText)(safeHref)}" rel="noopener noreferrer">${html}</a>`;
                break;
            }
            default:
                break;
        }
    }
    return html;
}
function renderNode(node) {
    const children = (node.content || []).map(renderNode).join("");
    if (node.type === "text") {
        return renderMarks(node.text || "", node.marks);
    }
    switch (node.type) {
        case "doc":
            return children;
        case "paragraph":
            return `<p>${children}</p>`;
        case "heading": {
            const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1));
            return `<h${level}>${children}</h${level}>`;
        }
        case "codeBlock": {
            const lang = (0, sanitize_1.sanitizePlainText)(String(node.attrs?.language || "text"));
            return `<pre class="lang-${lang}"><code>${children}</code></pre>`;
        }
        case "blockquote":
            return `<blockquote>${children}</blockquote>`;
        case "bulletList":
            return `<ul>${children}</ul>`;
        case "orderedList":
            return `<ol>${children}</ol>`;
        case "listItem":
            return `<li>${children}</li>`;
        case "table":
            return `<table>${children}</table>`;
        case "tableRow":
            return `<tr>${children}</tr>`;
        case "tableCell":
        case "tableHeader":
            return `<td>${children}</td>`;
        case "image": {
            const src = node.attrs?.src;
            const safeSrc = typeof src === "string" && /^https?:\/\//i.test(src) ? src : "";
            const alt = (0, sanitize_1.sanitizePlainText)(String(node.attrs?.alt || ""));
            return safeSrc ? `<img src="${(0, sanitize_1.sanitizePlainText)(safeSrc)}" alt="${alt}" />` : "";
        }
        case "hardBreak":
            return "<br />";
        default:
            return children;
    }
}
function tiptapToSafeHtml(doc, title = "SyncDoc export") {
    const body = renderNode(doc);
    const raw = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${(0, sanitize_1.sanitizePlainText)(title)}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 760px; margin: 40px auto; line-height: 1.6; color: #1a1a1a; }
      pre { background: #f3f3f3; padding: 12px; border-radius: 6px; overflow-x: auto; }
      h1, h2, h3 { font-family: Helvetica, Arial, sans-serif; }
    </style>
  </head>
  <body>
    <h1>${(0, sanitize_1.sanitizePlainText)(title)}</h1>
    ${body}
  </body>
</html>`;
    return (0, sanitize_1.sanitizeHtml)(raw);
}
//# sourceMappingURL=tiptapToHtml.js.map