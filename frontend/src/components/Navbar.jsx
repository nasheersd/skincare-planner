import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", gap: "1rem", padding: "1rem", borderBottom: "1px solid #eee" }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/skin-profile">Skin Profile</Link>
      <Link to="/skin-assessment">Skin Assessment</Link>
      <Link to="/recommendations">Recommendations</Link>
      <Link to="/progress">Progress</Link>
      <div style={{ marginLeft: "auto" }}>
        {token ? (
          <button onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
