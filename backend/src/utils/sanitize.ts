import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
export const DOMPurify = createDOMPurify(window);

const PURIFY_CONFIG = {
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "srcdoc"],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);
}

export function sanitizePlainText(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
