import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthShell from "@/components/layout/AuthShell";
import { useRegister } from "@/features/auth/authQueries";

interface FormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();
  const registerMutation = useRegister();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerMutation.mutateAsync(values);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setServerError(err?.response?.data?.error || "Something went wrong. Please try again.");
    }
  });

  if (success) {
    return (
      <AuthShell title="Check your inbox" subtitle="We sent a verification link to your email.">
        <p className="text-sm text-neo-smoke">Redirecting you to sign in…</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start collaborating in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-brand-blue hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {serverError && (
          <div className="text-sm text-accent-danger bg-accent-danger/10 border border-accent-danger/30 rounded-lg px-4 py-2.5">
            {serverError}
          </div>
        )}
        <div>
          <input
            placeholder="Full name"
            className="neo-input"
            {...register("name", { required: "Name is required", minLength: { value: 2, message: "Too short" } })}
          />
          {errors.name && <p className="text-accent-danger text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <input
            type="email"
            placeholder="Email address"
            className="neo-input"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && <p className="text-accent-danger text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            className="neo-input"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "At least 8 characters" },
            })}
          />
          {errors.password && <p className="text-accent-danger text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirm password"
            className="neo-input"
            {...register("confirmPassword", {
              validate: (v) => v === watch("password") || "Passwords don't match",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-accent-danger text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="neo-btn-primary w-full"
        >
          {registerMutation.isPending ? "Creating account…" : "Create account"}
        </button>
        <p className="text-xs text-neo-smoke text-center">
          By continuing you agree to SyncDoc's Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
