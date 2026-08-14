import { motion } from "framer-motion";
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineChartBar,
  HiOutlineSquares2X2,
} from "react-icons/hi2";

const FEATURES = [
  {
    icon: HiOutlineUserGroup,
    title: "Live multiplayer editing",
    desc: "See every cursor, selection, and keystroke as it happens — powered by Yjs CRDTs, so concurrent edits never overwrite each other.",
  },
  {
    icon: HiOutlineDocumentText,
    title: "Block-based rich editor",
    desc: "Markdown shortcuts, code blocks with syntax highlighting, tables, images, and drag-and-drop — all in one TipTap-powered canvas.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Enterprise-grade security",
    desc: "JWT + refresh rotation, bcrypt hashing, DOMPurify sanitization, rate limiting, and role-based access control out of the box.",
  },
  {
    icon: HiOutlineBolt,
    title: "Instant everything",
    desc: "Socket.io keeps presence, comments, and typing indicators in sync in milliseconds — no page refresh, ever.",
  },
  {
    icon: HiOutlineChartBar,
    title: "Workspace analytics",
    desc: "Track document velocity, top contributors, and storage usage with live Chart.js dashboards.",
  },
  {
    icon: HiOutlineSquares2X2,
    title: "Structured workspaces",
    desc: "Nested folders, granular permissions, and team roles keep large document libraries organized as they grow.",
  },
];

export default function Features() {
  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything a modern team needs</h2>
        <p className="text-ink-500 max-w-xl mx-auto">
          From the first draft to the final export, SyncDoc keeps your whole team in one place.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="glass-card p-6 hover:border-brand-violet/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-gradient grid place-items-center mb-4">
              <f.icon className="text-white text-xl" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-ink-500 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
