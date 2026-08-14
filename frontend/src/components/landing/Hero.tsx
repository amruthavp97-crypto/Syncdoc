import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiOutlineSparkles, HiArrowRight } from "react-icons/hi2";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-24 px-6">
      <div className="absolute inset-0 bg-aurora animate-gradient-x bg-[length:200%_200%] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-violet/20 blur-3xl animate-float pointer-events-none" />
      <div className="absolute top-20 -right-20 w-80 h-80 rounded-full bg-brand-blue/20 blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-1.5 text-sm text-ink-300 mb-8"
        >
          <HiOutlineSparkles className="text-brand-cyan" />
          Real-time AST conflict resolution — zero lost edits
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6"
        >
          Docs that write
          <span className="block bg-brand-gradient bg-clip-text text-transparent">
            themselves together.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-ink-500 max-w-2xl mx-auto mb-10"
        >
          SyncDoc merges Notion's polish, Google Docs' realtime editing, and Confluence's
          structure into one workspace — built for teams who ship documentation as fast as code.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-4 flex-wrap"
        >
          <Link to="/register" className="btn-gradient inline-flex items-center gap-2">
            Start for free <HiArrowRight />
          </Link>
          <Link to="/login" className="btn-ghost">
            Sign in
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 glass-card p-3 max-w-4xl mx-auto"
        >
          <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-base-950">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
              <span className="w-3 h-3 rounded-full bg-accent-danger/70" />
              <span className="w-3 h-3 rounded-full bg-accent-warning/70" />
              <span className="w-3 h-3 rounded-full bg-accent-success/70" />
              <span className="ml-3 text-xs text-ink-700 font-mono">product-spec.syncdoc</span>
            </div>
            <div className="p-8 text-left space-y-3">
              <div className="h-5 w-2/3 rounded bg-white/[0.08]" />
              <div className="h-3.5 w-full rounded bg-white/[0.05]" />
              <div className="h-3.5 w-5/6 rounded bg-white/[0.05]" />
              <div className="h-24 w-full rounded-lg bg-base-900 border border-white/[0.06] mt-4" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
