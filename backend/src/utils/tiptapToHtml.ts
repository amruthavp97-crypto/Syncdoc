import { sanitizeHtml, sanitizePlainText } from "./sanitize";

interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}
interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
}

function renderMarks(text: string, marks: TipTapMark[] = []): string {
  let html = sanitizePlainText(text);
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
        html = `<a href="${sanitizePlainText(safeHref)}" rel="noopener noreferrer">${html}</a>`;
        break;
      }
      default:
        break;
    }
  }
  return html;
}

function renderNode(node: TipTapNode): string {
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
      const lang = sanitizePlainText(String(node.attrs?.language || "text"));
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
      const alt = sanitizePlainText(String(node.attrs?.alt || ""));
      return safeSrc ? `<img src="${sanitizePlainText(safeSrc)}" alt="${alt}" />` : "";
    }
    case "hardBreak":
      return "<br />";
    default:
      return children;
  }
}

export function tiptapToSafeHtml(doc: TipTapNode, title = "SyncDoc export"): string {
  const body = renderNode(doc);
  const raw = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${sanitizePlainText(title)}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 760px; margin: 40px auto; line-height: 1.6; color: #1a1a1a; }
      pre { background: #f3f3f3; padding: 12px; border-radius: 6px; overflow-x: auto; }
      h1, h2, h3 { font-family: Helvetica, Arial, sans-serif; }
    </style>
  </head>
  <body>
    <h1>${sanitizePlainText(title)}</h1>
    ${body}
  </body>
</html>`;
  return sanitizeHtml(raw);
}
