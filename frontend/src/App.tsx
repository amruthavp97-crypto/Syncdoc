import { Routes, Route } from "react-router-dom";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import DashboardPage from "@/pages/DashboardPage";
import DocumentsPage from "@/pages/DocumentsPage";
import DocumentEditorPage from "@/pages/DocumentEditorPage";
import WorkspacesPage from "@/pages/WorkspacesPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import AdminPage from "@/pages/AdminPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  useAuthBootstrap();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentEditorPage />} />
          <Route path="/favorites" element={<DocumentsPage />} />
          <Route path="/trash" element={<DocumentsPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Admin only */}
      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
