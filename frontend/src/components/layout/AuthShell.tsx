import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineUserGroup, HiOutlineBolt, HiOutlineClock, HiOutlineShieldCheck } from "react-icons/hi2";

const HIGHLIGHTS = [
  { icon: HiOutlineUserGroup, text: "Watch your team write in real time, live cursors and all" },
  { icon: HiOutlineBolt, text: "Conflict-free editing - two people, one paragraph, zero lost work" },
  { icon: HiOutlineClock, text: "Full version history, restore any moment in one click" },
  { icon: HiOutlineShieldCheck, text: "Role-based sharing, so the right people see the right things" },
];

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neo-void flex">
      {/* Left: the auth form itself */}
      <div className="w-full lg:w-[46%] flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <div className="neo-blob-field">
          <div className="neo-blob bg-neo-ember/40 w-[320px] h-[320px] -top-24 -left-24 animate-blob-1" />
          <div className="neo-blob bg-neo-amber/30 w-[280px] h-[280px] bottom-0 -left-16 animate-blob-2" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="neo-card w-full max-w-md p-8 relative"
        >
          <Link to="/login" className="flex items-center gap-2.5 font-neo font-bold text-lg mb-8 w-fit text-neo-paper">
            <span className="neo-mark">S</span>
            SyncDoc
          </Link>
          <h1 className="text-2xl font-bold font-neo mb-1 text-neo-paper">{title}</h1>
          {subtitle && <p className="text-neo-smoke text-sm mb-6">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-neo-smoke">{footer}</div>}
        </motion.div>
      </div>

      {/* Right: marketing panel - hidden on small screens so the form stays
          full-width and usable rather than cramped. */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-brand-gradient items-center justify-center px-16">
        <div className="absolute inset-0 opacity-40">
          <div className="neo-blob bg-white/20 w-[500px] h-[500px] -top-40 -right-20 animate-blob-1" />
          <div className="neo-blob bg-white/10 w-[420px] h-[420px] bottom-0 right-1/4 animate-blob-2" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative max-w-md text-white"
        >
          <h2 className="text-4xl font-bold font-neo leading-[1.15] mb-6">
            Where teams write
            <span className="block text-neo-amber">together, in sync.</span>
          </h2>
          <p className="text-white/70 text-sm mb-10 leading-relaxed">
            SyncDoc merges every collaborator's edits the instant they happen - no locked
            documents, no overwritten work, no waiting your turn.
          </p>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-start gap-3 text-sm text-white/90">
                <span className="w-8 h-8 rounded-xl bg-white/15 grid place-items-center shrink-0 mt-0.5">
                  <h.icon className="text-base" />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
