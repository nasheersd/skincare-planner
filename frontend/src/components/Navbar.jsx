import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USER_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "✨" },
  { to: "/skin-profile", label: "Skin Profile", icon: "🧴" },
  { to: "/skin-assessment", label: "Assessment", icon: "📝" },
  { to: "/dermatologist", label: "Dermatologist", icon: "🩺" },
  { to: "/recommendations", label: "Recommendations", icon: "🛍️" },
  { to: "/progress", label: "Progress Logs", icon: "📈" },
];

const CONSULTANT_LINKS = [
  { to: "/consultant/dashboard", label: "Dashboard", icon: "✨" },
  { to: "/consultant/profile", label: "Profile", icon: "🧴" },
  { to: "/consultant/customers", label: "Customers", icon: "👥" },
  { to: "/consultant/dermatologists", label: "Dermatologists", icon: "🩺" },
];

const DERMATOLOGIST_LINKS = [
  { to: "/dermatologist/dashboard", label: "Dashboard", icon: "✨" },
  { to: "/dermatologist/profile", label: "Profile", icon: "🩺" },
  { to: "/dermatologist/patients", label: "Patients", icon: "👥" },
  { to: "/dermatologist/appointments", label: "Appointments", icon: "📅" },
  { to: "/dermatologist/consultants", label: "Consultants", icon: "💬" },
];

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const links = user?.role === "dermatologist"
    ? DERMATOLOGIST_LINKS
    : user?.role === "skincare_consultant"
      ? CONSULTANT_LINKS
      : USER_LINKS;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        Skincare Planner
        <span className="brand-tagline">Personalized care planning</span>
      </div>
      
      <button 
        type="button" 
        onClick={toggleTheme} 
        style={{
          background: "var(--color-surface-sunken)",
          border: "none",
          color: "var(--color-ink)",
          padding: "0.5rem",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.82rem",
          cursor: "pointer",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          fontWeight: "500"
        }}
      >
        {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </button>

      <nav className="nav-links" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-icon" aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      {token && (
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      )}
    </aside>
  );
}
