import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-base-900 grid place-items-center px-6">
      <div className="text-center">
        <div className="text-7xl font-extrabold font-display bg-brand-gradient bg-clip-text text-transparent mb-4">
          404
        </div>
        <p className="text-ink-500 mb-6">This page doesn't exist, or you don't have access to it.</p>
        <Link to="/" className="btn-gradient">
          Back to home
        </Link>
      </div>
    </div>
  );
}
