import { useState } from "react";
import { HiChevronDown } from "react-icons/hi2";

const FAQS = [
  {
    q: "How does conflict resolution actually work?",
    a: "Every document is backed by a Yjs CRDT. Edits from every connected user are merged mathematically, so two people editing different parts of a document — or even the same paragraph — never overwrite each other's work.",
  },
  {
    q: "Can I export documents to PDF or Markdown?",
    a: "Yes. Every document can be exported to sanitized HTML, Markdown, or a formatted PDF directly from the editor toolbar.",
  },
  {
    q: "Is my data encrypted?",
    a: "All traffic is encrypted in transit via HTTPS/WSS. Passwords are hashed with bcrypt, and access tokens are short-lived with rotating refresh tokens stored server-side.",
  },
  {
    q: "Do you support single sign-on?",
    a: "Google and GitHub OAuth are supported on the Team plan. SAML/SSO is available on Enterprise plans.",
  },
  {
    q: "What happens if I lose connection while editing?",
    a: "Your local edits stay in your browser's CRDT state and merge automatically the moment you reconnect — nothing is lost.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="px-6 py-24 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently asked questions</h2>
      </div>
      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <div key={item.q} className="glass-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-6 py-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="font-medium">{item.q}</span>
              <HiChevronDown
                className={`shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${
                open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-4 text-sm text-ink-500 leading-relaxed">{item.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
