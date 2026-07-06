import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/skin-profile", label: "Skin Profile", icon: "◎" },
  { to: "/skin-assessment", label: "Assessment", icon: "◷" },
  { to: "/dermatologist", label: "Dermatologist", icon: "✚" },
  { to: "/recommendations", label: "Recommendations", icon: "✦" },
  { to: "/progress", label: "Progress", icon: "↗" },
];

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

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
