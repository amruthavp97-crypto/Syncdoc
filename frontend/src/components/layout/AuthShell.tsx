import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-base-900 relative overflow-hidden flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 bg-aurora pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative glass-card w-full max-w-md p-8"
      >
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg mb-8 w-fit">
          <span className="w-8 h-8 rounded-lg bg-brand-gradient grid place-items-center text-sm">S</span>
          SyncDoc
        </Link>
        <h1 className="text-2xl font-bold font-display mb-1">{title}</h1>
        {subtitle && <p className="text-ink-500 text-sm mb-6">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
      </motion.div>
    </div>
  );
}
