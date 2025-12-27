import { Suspense } from "react";
import { Navigate, Route, Routes, useRoutes, useLocation } from "react-router-dom";
import routes from "tempo-routes";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import Dashboard from "./components/pages/dashboard";
import PEBList from "./components/pages/PEBList";
import PEBFormPage from "./components/pages/PEBFormPage";
import PEBDetailPage from "./components/pages/PEBDetailPage";
import PIBList from "./components/pages/PIBList";
import PIBFormPage from "./components/pages/PIBFormPage";
import PIBDetailPage from "./components/pages/PIBDetailPage";
import CEISAPage from "./components/pages/CEISAPage";
import AuditLogPage from "./components/pages/AuditLogPage";
import MasterDataPage from "./components/pages/MasterDataPage";
import ReportsPage from "./components/pages/ReportsPage";
import UserManagementPage from "./components/pages/UserManagementPage";
import SettingsPage from "./components/pages/SettingsPage";
import SingleCoreSystemPage from "./components/pages/SingleCoreSystemPage";
import { AuthProvider, useAuth } from "../supabase/auth";
import { RoleProvider, useRole } from "./hooks/useRole";
import { Toaster } from "./components/ui/sonner";
import { LoadingScreen } from "./components/ui/loading-spinner";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ 
  children, 
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requiredPermission?: 'canAccessPEB' | 'canAccessPIB' | 'canAccessCEISA' | 'canAccessAuditLog' | 'canAccessMasterData' | 'canAccessReports' | 'canAccessUserManagement' | 'canAccessSettings'; 
}) {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Loading..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Loading..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  const location = useLocation();
  
  // Check if this is a Tempo storyboard path
  const isTempoPath = location.pathname.startsWith('/tempobook');
  
  // Only use Tempo routes for tempobook paths
  const tempoRoutes = import.meta.env.VITE_TEMPO === "true" && isTempoPath ? useRoutes(routes) : null;
  
  // If tempo routes matched a tempobook path, render them
  if (tempoRoutes) {
    return tempoRoutes;
  }
  
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterForm />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordForm />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordForm />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/peb"
        element={
          <ProtectedRoute requiredPermission="canAccessPEB">
            <PEBList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/peb/new"
        element={
          <ProtectedRoute requiredPermission="canAccessPEB">
            <PEBFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/peb/:id"
        element={
          <ProtectedRoute requiredPermission="canAccessPEB">
            <PEBDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/peb/:id/edit"
        element={
          <ProtectedRoute requiredPermission="canAccessPEB">
            <PEBFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pib"
        element={
          <ProtectedRoute requiredPermission="canAccessPIB">
            <PIBList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pib/new"
        element={
          <ProtectedRoute requiredPermission="canAccessPIB">
            <PIBFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pib/:id"
        element={
          <ProtectedRoute requiredPermission="canAccessPIB">
            <PIBDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pib/:id/edit"
        element={
          <ProtectedRoute requiredPermission="canAccessPIB">
            <PIBFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ceisa"
        element={
          <ProtectedRoute requiredPermission="canAccessCEISA">
            <CEISAPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/single-core"
        element={
          <ProtectedRoute requiredPermission="canAccessCEISA">
            <SingleCoreSystemPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-log"
        element={
          <ProtectedRoute requiredPermission="canAccessAuditLog">
            <AuditLogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/master/*"
        element={
          <ProtectedRoute requiredPermission="canAccessMasterData">
            <MasterDataPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredPermission="canAccessReports">
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission="canAccessUserManagement">
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredPermission="canAccessSettings">
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Suspense fallback={<LoadingScreen text="Loading application..." />}>
          <AppRoutes />
        </Suspense>
        <Toaster />
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;
