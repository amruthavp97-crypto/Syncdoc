import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import AuthShell from "@/components/layout/AuthShell";
import { useResetPassword } from "@/features/auth/authQueries";

interface FormValues {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();
  const resetPassword = useResetPassword();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError(null);
    try {
      await resetPassword.mutateAsync({ token, password });
      navigate("/login");
    } catch (err: any) {
      setServerError(err?.response?.data?.error || "This reset link is invalid or has expired.");
    }
  });

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This password reset link is missing a token.">
        <Link to="/forgot-password" className="text-brand-blue hover:underline text-sm">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Make it something you'll remember">
      <form onSubmit={onSubmit} className="space-y-4">
        {serverError && (
          <div className="text-sm text-accent-danger bg-accent-danger/10 border border-accent-danger/30 rounded-lg px-4 py-2.5">
            {serverError}
          </div>
        )}
        <div>
          <input
            type="password"
            placeholder="New password"
            className="neo-input"
            {...register("password", { required: true, minLength: 8 })}
          />
          {errors.password && <p className="text-accent-danger text-xs mt-1">At least 8 characters</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm new password"
            className="neo-input"
            {...register("confirmPassword", { validate: (v) => v === watch("password") || "Doesn't match" })}
          />
          {errors.confirmPassword && (
            <p className="text-accent-danger text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button type="submit" disabled={resetPassword.isPending} className="neo-btn-primary w-full">
          {resetPassword.isPending ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}
