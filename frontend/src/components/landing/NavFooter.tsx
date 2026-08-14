import { Link } from "react-router-dom";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 px-6 py-4 backdrop-blur-xl bg-base-900/60 border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="w-8 h-8 rounded-lg bg-brand-gradient grid place-items-center text-sm">S</span>
          SyncDoc
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-ink-500">
          <a href="#features" className="hover:text-ink-100 transition-colors">Features</a>
          <a href="#faq" className="hover:text-ink-100 transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-ink-300 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="btn-gradient text-sm px-4 py-2">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="px-6 py-12 border-t border-white/[0.06] mt-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-display font-semibold">
          <span className="w-6 h-6 rounded-md bg-brand-gradient grid place-items-center text-xs">S</span>
          SyncDoc
        </div>
        <p className="text-xs text-ink-700">© {new Date().getFullYear()} SyncDoc, Inc. All rights reserved.</p>
        <div className="flex gap-5 text-xs text-ink-500">
          <a href="#" className="hover:text-ink-100">Privacy</a>
          <a href="#" className="hover:text-ink-100">Terms</a>
          <a href="#" className="hover:text-ink-100">Status</a>
        </div>
      </div>
    </footer>
  );
}
