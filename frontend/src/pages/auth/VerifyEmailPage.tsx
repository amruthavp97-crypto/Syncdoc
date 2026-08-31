import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "@/components/layout/AuthShell";
import { useVerifyEmail } from "@/features/auth/authQueries";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const verifyEmail = useVerifyEmail();
  const [state, setState] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }
    verifyEmail.mutate(token, {
      onSuccess: () => setState("success"),
      onError: () => setState("error"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthShell
      title={state === "success" ? "Email verified" : state === "error" ? "Verification failed" : "Verifying…"}
      footer={
        <Link to="/login" className="text-brand-blue hover:underline">
          Go to sign in
        </Link>
      }
    >
      {state === "pending" && <p className="text-sm text-neo-smoke">Hang tight, verifying your email…</p>}
      {state === "success" && (
        <p className="text-sm text-neo-paper/80">Your email has been verified. You can now sign in.</p>
      )}
      {state === "error" && (
        <p className="text-sm text-accent-danger">
          This verification link is invalid or has expired. Please request a new one from your profile settings.
        </p>
      )}
    </AuthShell>
  );
}
