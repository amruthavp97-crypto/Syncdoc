import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useState } from "react";
import AuthShell from "@/components/layout/AuthShell";
import { useForgotPassword } from "@/features/auth/authQueries";

export default function ForgotPasswordPage() {
  const { register, handleSubmit } = useForm<{ email: string }>();
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);

  const onSubmit = handleSubmit(async ({ email }) => {
    await forgotPassword.mutateAsync(email);
    setSent(true);
  });

  return (
    <AuthShell
      title="Reset your password"
      subtitle={sent ? undefined : "We'll email you a link to reset it"}
      footer={
        <Link to="/login" className="text-brand-blue hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-ink-300">
          If that email is registered, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="input-field"
            {...register("email", { required: true })}
          />
          <button type="submit" disabled={forgotPassword.isPending} className="btn-gradient w-full disabled:opacity-60">
            {forgotPassword.isPending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
