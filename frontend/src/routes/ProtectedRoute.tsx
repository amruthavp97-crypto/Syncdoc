import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

export function ProtectedRoute({ roles }: { roles?: Array<"admin" | "editor" | "viewer"> }) {
  const { user, status } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-base-900">
        <div className="animate-pulse text-ink-500 font-display">Loading SyncDoc…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
