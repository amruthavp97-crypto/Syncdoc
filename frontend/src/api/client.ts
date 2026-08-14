import axios from "axios";
import { store } from "@/app/store";
import { setAccessToken, logout } from "@/features/auth/authSlice";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true, // send the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL || "/api"}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const token = res.data.accessToken as string;
    store.dispatch(setAccessToken(token));
    return token;
  } catch {
    store.dispatch(logout());
    return null;
  }
}

const AUTH_ENDPOINTS_EXCLUDED_FROM_RETRY = ["/auth/login", "/auth/register", "/auth/refresh"];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = AUTH_ENDPOINTS_EXCLUDED_FROM_RETRY.some((path) => original?.url?.includes(path));

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      refreshPromise = refreshPromise || refreshAccessToken();
      const token = await refreshPromise;
      refreshPromise = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);
