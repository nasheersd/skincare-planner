import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RitualRing from "../components/RitualRing";

export default function Landing() {
  const { token, user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === "dermatologist") return "/dermatologist/dashboard";
    if (user?.role === "skincare_consultant") return "/consultant/dashboard";
    return "/dashboard";
  };

  return (
    <div className="public-landing-container" style={{ background: "var(--color-bg)", minHeight: "100vh", color: "var(--color-ink)", fontFamily: "var(--font-body)" }}>
      {/* Top Header Bar */}
      <header className="public-header" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 4vw",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: "var(--color-primary-tint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            color: "var(--color-primary)"
          }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
              <path d="M17 16c.4-.3.8-.5 1.2-.8A8 8 0 0 0 6.8 12c0 2.2.9 4.2 2.4 5.7M12 12v3" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "800", fontSize: "1.3rem", letterSpacing: "-0.02em", color: "var(--color-ink)", lineHeight: 1.1 }}>
              SkinGenie
            </span>
            <span style={{ display: "block", fontSize: "0.62rem", color: "var(--color-ink-faint)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>
              Clinical Skincare Intelligence
            </span>
          </div>
        </div>

        {/* Top Right Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {token ? (
            <Link to={getDashboardPath()} className="btn btn-primary" style={{ padding: "0.65rem 1.5rem", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-soft)", textDecoration: "none" }}>
              Go to Workspace →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: "0.6rem 1.3rem", borderRadius: "var(--radius-sm)", fontWeight: "600", textDecoration: "none" }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "0.6rem 1.3rem", borderRadius: "var(--radius-sm)", fontWeight: "600", textDecoration: "none", boxShadow: "var(--shadow-soft)" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="landing-hero" style={{
        padding: "5rem 4vw 4rem",
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "4rem",
        alignItems: "center"
      }}>
        <div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 0.9rem",
            borderRadius: "999px",
            background: "var(--color-primary-tint)",
            color: "var(--color-primary)",
            fontSize: "0.8rem",
            fontWeight: "700",
            letterSpacing: "0.02em",
            marginBottom: "1.5rem",
            textTransform: "uppercase"
          }}>
            🔬 Medical-Grade Skincare Planning
          </div>

          <h1 style={{
            fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)",
            fontWeight: "900",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "1.5rem",
            color: "var(--color-ink)"
          }}>
            AI-Driven Skin Diagnostics & Custom Care Plans
          </h1>

          <p style={{
            fontSize: "1.1rem",
            lineHeight: 1.6,
            color: "var(--color-ink-muted)",
            marginBottom: "2.5rem"
          }}>
            Welcome to the future of skincare science. SkinGenie utilizes advanced color contrast, specular reflection, and texture variance models to map your skin profile, providing real-time health score metrics and doctor-validated routines.
          </p>

          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "3rem" }}>
            <Link to="/register" className="btn btn-primary btn-large" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem", borderRadius: "var(--radius-md)" }}>
              Start Skin Assessment →
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem", borderRadius: "var(--radius-md)" }}>
              Sign In to Portal
            </Link>
          </div>

          {/* Quick Badges */}
          <div style={{ display: "flex", gap: "2.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "2rem" }}>
            <div>
              <div style={{ fontWeight: "800", fontSize: "1.3rem", color: "var(--color-primary)", letterSpacing: "-0.01em" }}>78/100</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", fontWeight: "500", marginTop: "0.2rem" }}>Average Health Score</div>
            </div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "1.3rem", color: "#00B894", letterSpacing: "-0.01em" }}>+12%</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", fontWeight: "500", marginTop: "0.2rem" }}>Active Improvements</div>
            </div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "1.3rem", color: "var(--color-primary)", letterSpacing: "-0.01em" }}>85%</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", fontWeight: "500", marginTop: "0.2rem" }}>Routine Consistency</div>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div style={{ position: "relative" }}>
          <div className="card" style={{ padding: "2.5rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lift)", border: "1px solid var(--color-border)", margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-faint)", fontWeight: "700" }}>
                  SKINGENIE PLATFORM PREVIEW
                </span>
                <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.3rem", fontWeight: "800" }}>Companion Dashboard</h3>
              </div>
              <div style={{ padding: "0.4rem 0.8rem", background: "var(--color-primary-tint)", color: "var(--color-primary)", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "800" }}>
                OPTIMAL
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
              <RitualRing size={90} progress={0.78} color="var(--color-primary)" />
              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--color-ink)", lineHeight: 1 }}>78 <span style={{ fontSize: "1.1rem", color: "var(--color-ink-faint)" }}>/100</span></div>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>
                  Excellent hydration & routine compliance.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "600" }}>
                  <span>Routine Consistency</span>
                  <strong>85%</strong>
                </div>
                <div style={{ height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: "85%", height: "100%", background: "var(--color-primary)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem", fontWeight: "600", marginTop: "0.25rem" }}>
                  <span>Water Intake Balance</span>
                  <strong>1.8L / 2.5L</strong>
                </div>
                <div style={{ height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: "72%", height: "100%", background: "var(--color-primary)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Highlights Grid */}
      <section style={{ background: "var(--color-surface)", padding: "5rem 4vw", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 4.5rem" }}>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)", fontWeight: "800" }}>
              PROJECT HIGHLIGHTS
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: "900", marginTop: "0.5rem", letterSpacing: "-0.02em" }}>Expert Skincare Ecosystem</h2>
            <p style={{ color: "var(--color-ink-muted)", fontSize: "1rem", marginTop: "0.75rem", lineHeight: 1.6 }}>
              SkinGenie integrates photo biomarkers, objective scoring pipelines, and direct dermatologist connectivity in one secure platform.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem" }}>
            <div className="card" style={{ padding: "2rem", margin: 0, border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1.25rem" }}>📸</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>Canvas Skin Photo Scanner</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.6 }}>
                Upload skin photos to evaluate specular reflection, redness, and contrast variance to objective map acne, pigment spots, or hydration levels.
              </p>
            </div>

            <div className="card" style={{ padding: "2rem", margin: 0, border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1.25rem" }}>📊</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>5-Weighted Scoring Model</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.6 }}>
                Daily algorithm updates score skin condition (35%), compliance (20%), lifestyle inputs (20%), sleep metrics (15%), and water metrics (10%).
              </p>
            </div>

            <div className="card" style={{ padding: "2rem", margin: 0, border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1.25rem" }}>🧴</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>AM/PM Routine Optimizer</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.6 }}>
                Formulates detailed custom morning & evening cleanser, active toner, serum, cream, and physical sun protection steps.
              </p>
            </div>

            <div className="card" style={{ padding: "2rem", margin: 0, border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1.25rem" }}>🩺</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "0.5rem" }}>Multi-Role Doctor Panels</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.6 }}>
                Bridges the gap between patients, skincare consultants, and certified dermatologists to review records and assign verified formulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section style={{ padding: "5rem 4vw", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 2.5rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lift)" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "900", marginBottom: "1rem", letterSpacing: "-0.02em" }}>Unlock Your Optimal Skin Health</h2>
          <p style={{ color: "var(--color-ink-muted)", maxWidth: "550px", margin: "0 auto 2.5rem", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Ready to receive your baseline skin score, custom routine, and access to certified clinical skincare professionals?
          </p>
          <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="btn btn-primary btn-large" style={{ padding: "0.85rem 2.2rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
              Create Free Account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large" style={{ padding: "0.85rem 2.2rem", borderRadius: "var(--radius-md)", textDecoration: "none" }}>
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "2.5rem 4vw", textAlign: "center", fontSize: "0.88rem", color: "var(--color-ink-muted)" }}>
        <p>© 2026 SkinGenie Clinical Skincare Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}
