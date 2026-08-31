import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import AuthShell from "@/components/layout/AuthShell";
import { useLogin } from "@/features/auth/authQueries";

interface FormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { rememberMe: true } });
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login.mutateAsync(values);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setServerError(err?.response?.data?.error || "Something went wrong. Please try again.");
    }
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your workspace"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-blue hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-6">
        <a href="/api/auth/google" className="neo-btn-ghost flex items-center justify-center gap-2 text-sm">
          <FaGoogle /> Google
        </a>
        <a href="/api/auth/github" className="neo-btn-ghost flex items-center justify-center gap-2 text-sm">
          <FaGithub /> GitHub
        </a>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-black/[0.06]" />
        <span className="text-xs text-neo-smoke">or continue with email</span>
        <div className="h-px flex-1 bg-black/[0.06]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {serverError && (
          <div className="text-sm text-accent-danger bg-accent-danger/10 border border-accent-danger/30 rounded-lg px-4 py-2.5">
            {serverError}
          </div>
        )}
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
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <p className="text-accent-danger text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-neo-smoke">
            <input type="checkbox" className="accent-brand-blue" {...register("rememberMe")} />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-brand-blue hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={login.isPending} className="neo-btn-primary w-full">
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
