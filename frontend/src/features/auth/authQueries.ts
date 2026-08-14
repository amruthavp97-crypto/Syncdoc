import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAppDispatch } from "@/app/hooks";
import { setCredentials, logout as logoutAction, AuthUser } from "@/features/auth/authSlice";

interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}
interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export function useLogin() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: LoginPayload) => api.post("/auth/login", payload),
    onSuccess: (res) => {
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => api.post("/auth/register", payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => api.post("/auth/forgot-password", { email }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { token: string; password: string }) =>
      api.post("/auth/reset-password", payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => api.post("/auth/verify-email", { token }),
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      dispatch(logoutAction());
      queryClient.clear();
    },
  });
}

export function useCurrentUser(enabled: boolean) {
  const dispatch = useAppDispatch();
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get<{ user: AuthUser }>("/auth/me");
      return res.data.user;
    },
    enabled,
    retry: false,
  });
}
