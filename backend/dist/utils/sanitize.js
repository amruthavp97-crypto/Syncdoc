"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMPurify = void 0;
exports.sanitizeHtml = sanitizeHtml;
exports.sanitizePlainText = sanitizePlainText;
const jsdom_1 = require("jsdom");
const dompurify_1 = __importDefault(require("dompurify"));
const window = new jsdom_1.JSDOM("").window;
exports.DOMPurify = (0, dompurify_1.default)(window);
const PURIFY_CONFIG = {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "srcdoc"],
    ALLOW_DATA_ATTR: false,
};
function sanitizeHtml(rawHtml) {
    return exports.DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);
}
function sanitizePlainText(input) {
    return String(input)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
//# sourceMappingURL=sanitize.js.map