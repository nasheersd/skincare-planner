import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/skin-profile", label: "Skin Profile" },
  { to: "/skin-assessment", label: "Assessment" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/progress", label: "Progress" },
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
      <div className="brand">Skincare Planner</div>
      <nav className="nav-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-dot" />
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