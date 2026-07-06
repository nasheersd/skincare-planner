import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SkinProfile from "./pages/SkinProfile";
import SkinAssessment from "./pages/SkinAssessment";
import ProductRecommendation from "./pages/ProductRecommendation";
import ProgressTracking from "./pages/ProgressTracking";
import DermatologistContact from "./pages/DermatologistContact";

function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (isAuthPage) return children;

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/skin-profile" element={<ProtectedRoute><SkinProfile /></ProtectedRoute>} />
            <Route path="/skin-assessment" element={<ProtectedRoute><SkinAssessment /></ProtectedRoute>} />
            <Route path="/dermatologist" element={<ProtectedRoute><DermatologistContact /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><ProductRecommendation /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressTracking /></ProtectedRoute>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}