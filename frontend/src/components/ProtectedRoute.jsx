import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./LoadingState";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user, authLoading } = useAuth();

  if (authLoading) {
    return <LoadingState label="Checking your session…" />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const fallbackPath = user.role === "dermatologist"
      ? "/dermatologist/dashboard"
      : user.role === "skincare_consultant"
        ? "/consultant/dashboard"
        : "/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
