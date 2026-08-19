import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAppDispatch } from "@/app/hooks";
import { logout } from "@/features/auth/authSlice";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const logoutAll = useMutation({
    mutationFn: () => api.post("/auth/logout-all"),
    onSuccess: () => dispatch(logout()),
  });

  