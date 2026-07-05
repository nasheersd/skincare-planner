import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RitualRing from "../components/RitualRing";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(fullName, email, password, role);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.detail || "We couldn't create your account. Please try again.");
    }
  };

  return (
    <div className="auth-shell">
      <RitualRing size={340} progress={0.4} color="var(--color-accent-tint)" trackColor="transparent" />
      <div className="auth-card">
        <div className="auth-eyebrow">Get started</div>
        <h1 style={{ fontSize: "1.6rem" }}>Create your account</h1>
        <p style={{ marginBottom: "1.5rem" }}>Set up your skin profile in a few minutes.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password <span className="hint">min 8 characters</span></label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} />
          </div>
          <div className="field">
            <label htmlFor="role">I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Skincare user</option>
              <option value="skincare_consultant">Skincare consultant</option>
              <option value="dermatologist">Dermatologist</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create account</button>
          {error && <div className="status-msg error">{error}</div>}
          {success && <div className="status-msg ok">Account created — redirecting to sign in…</div>}
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}