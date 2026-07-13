import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USER_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/skin-profile", label: "Skin Profile", icon: "◎" },
  { to: "/skin-assessment", label: "Assessment", icon: "◷" },
  { to: "/dermatologist", label: "Dermatologist", icon: "✚" },
  { to: "/recommendations", label: "Recommendations", icon: "✦" },
  { to: "/progress", label: "Progress", icon: "↗" },
];

const CONSULTANT_LINKS = [
  { to: "/consultant/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/consultant/profile", label: "Profile", icon: "◎" },
];

const DERMATOLOGIST_LINKS = [
  { to: "/dermatologist/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/dermatologist/profile", label: "Profile", icon: "◎" },
  { to: "/dermatologist/patients", label: "Patients", icon: "◷" },
  { to: "/dermatologist/appointments", label: "Appointments", icon: "✚" },
];

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
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
        <span className="brand-tagline">AI-powered routines</span>
      </div>
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
