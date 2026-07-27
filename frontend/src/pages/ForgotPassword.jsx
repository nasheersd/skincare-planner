import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import RitualRing from "../components/RitualRing";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data?.message || "A temporary password has been sent to your email address.");
    } catch (err) {
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          setError(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail.map((d) => d.msg).join(", "));
        } else {
          setError(JSON.stringify(err.response.data.detail));
        }
      } else {
        setError(err.message || "Something went wrong. Please check your network and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "var(--color-bg)" }}>
      <RitualRing size={340} progress={0.5} color="var(--color-primary-tint)" trackColor="transparent" />
      <div className="auth-card" style={{ zIndex: 2, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "2.5rem", width: "100%", maxWidth: "420px", boxShadow: "var(--shadow-lift)" }}>
        <div className="auth-eyebrow" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", fontWeight: "700", marginBottom: "0.5rem" }}>
          Security Portal
        </div>
        <h1 className="auth-title" style={{ fontSize: "1.8rem", fontWeight: "900", color: "var(--color-ink)", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          Forgot Password
        </h1>
        <p className="auth-subtitle" style={{ color: "var(--color-ink-muted)", fontSize: "0.9rem", marginBottom: "2rem", lineHeight: 1.5 }}>
          Enter your registered email address and we'll generate and send you a temporary password.
        </p>

        {message ? (
          <div style={{ textAlign: "center" }}>
            <div className="status-msg ok" style={{ background: "var(--color-primary-tint)", color: "var(--color-primary)", border: "1px solid var(--color-primary)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.9rem", fontWeight: "600" }}>
              {message}
            </div>
            <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: "none", textAlign: "center", display: "block" }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="field">
              <label htmlFor="email" style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-ink)", marginBottom: "0.4rem", display: "block" }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="name@example.com"
                style={{ width: "100%", padding: "0.65rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", outline: "none", background: "var(--color-surface)" }}
              />
            </div>

            {error && (
              <div className="status-msg error" style={{ padding: "0.75rem", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: "0.75rem", fontWeight: "700", letterSpacing: "0.02em" }}>
              {loading ? "Generating password..." : "Send Temporary Password"}
            </button>

            <p className="auth-footer" style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--color-ink-muted)", marginTop: "1rem", margin: 0 }}>
              Remembered your password? <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: "600", textDecoration: "none" }}>Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
