import { useEffect } from "react";
import axios from "axios";
import { useAppDispatch } from "@/app/hooks";
import { setCredentials, setStatus } from "@/features/auth/authSlice";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;
    dispatch(setStatus("loading"));

    axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      })
      .catch(() => {
        if (!cancelled) dispatch(setStatus("unauthenticated"));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
