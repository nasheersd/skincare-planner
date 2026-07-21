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
    <div className="public-landing-container" style={{ background: "var(--color-bg)", minHeight: "100vh", color: "var(--color-ink)" }}>
      {/* Top Header Bar */}
      <header className="public-header" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 3vw",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        position: "sticky",
        top: 0,
        zIndex: 100
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
            🌿
          </div>
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: "700", fontSize: "1.35rem", letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
              SkinGenie
            </span>
            <span style={{ display: "block", fontSize: "0.7rem", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Clinical Skincare Intelligence
            </span>
          </div>
        </div>

        {/* Top Right Navigation / Sign In Options */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {token ? (
            <Link to={getDashboardPath()} className="btn btn-primary" style={{ padding: "0.6rem 1.4rem", borderRadius: "var(--radius-sm)" }}>
              Go to Workspace →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: "0.55rem 1.25rem", borderRadius: "var(--radius-sm)", fontWeight: "600" }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "0.55rem 1.25rem", borderRadius: "var(--radius-sm)", fontWeight: "600" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="landing-hero" style={{
        padding: "4rem 3vw 3rem",
        maxWidth: "1150px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "3rem",
        alignItems: "center"
      }}>
        <div>
          <div style={{
            display: "inline-block",
            padding: "0.35rem 0.85rem",
            borderRadius: "20px",
            background: "var(--color-primary-tint)",
            color: "var(--color-primary)",
            fontSize: "0.78rem",
            fontWeight: "600",
            letterSpacing: "0.05em",
            marginBottom: "1.25rem",
            textTransform: "uppercase"
          }}>
            ✨ Medical-Grade Skincare Planning
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
            lineHeight: 1.15,
            marginBottom: "1.25rem",
            color: "var(--color-ink)"
          }}>
            Personalized Skincare Science for Healthier Skin
          </h1>

          <p style={{
            fontSize: "1.08rem",
            lineHeight: 1.6,
            color: "var(--color-ink-muted)",
            marginBottom: "2rem"
          }}>
            SkinGenie analyzes your skin profile, photo biomarkers, and daily habits to deliver custom morning and evening routine recommendations backed by dermatologists.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
            <Link to="/register" className="btn btn-primary btn-large" style={{ borderRadius: "var(--radius-sm)" }}>
              Start Skin Assessment →
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large" style={{ borderRadius: "var(--radius-sm)" }}>
              Sign In to Account
            </Link>
          </div>

          {/* Quick Badges */}
          <div style={{ display: "flex", gap: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--color-primary)" }}>5-Factor</div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)" }}>Health Scoring</div>
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--color-primary)" }}>100% Canvas</div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)" }}>Photo Analysis</div>
            </div>
            <div>
              <div style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--color-primary)" }}>Dermatologist</div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-ink-muted)" }}>Validated Routines</div>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div style={{ position: "relative" }}>
          <div className="card" style={{ padding: "2.25rem", background: "var(--color-surface)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lift)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-ink-faint)", fontWeight: "600" }}>
                  LIVE DEMO PREVIEW
                </span>
                <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.3rem" }}>Skin Health Score</h3>
              </div>
              <div style={{ padding: "0.35rem 0.75rem", background: "var(--color-primary-tint)", color: "var(--color-primary)", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "700" }}>
                OPTIMAL
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <RitualRing size={100} progress={0.88} color="var(--color-primary)" />
              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: "700", color: "var(--color-ink)", lineHeight: 1 }}>88 <span style={{ fontSize: "1rem", color: "var(--color-ink-faint)" }}>/100</span></div>
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>
                  High routine consistency & optimal hydration balance.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span>Routine Consistency (20%)</span>
                <strong>95%</strong>
              </div>
              <div style={{ height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "95%", height: "100%", background: "var(--color-primary)" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginTop: "0.4rem" }}>
                <span>Hydration Level (10%)</span>
                <strong>2.8L / Day</strong>
              </div>
              <div style={{ height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: "88%", height: "100%", background: "#3fa1b5" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Overview & Key Features Section */}
      <section style={{ background: "var(--color-surface)", padding: "4rem 3vw", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 3rem" }}>
            <span style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)", fontWeight: "700" }}>
              PROJECT HIGHLIGHTS
            </span>
            <h2 style={{ fontSize: "2rem", marginTop: "0.5rem" }}>Everything You Need for Effective Care</h2>
            <p style={{ color: "var(--color-ink-muted)" }}>
              SkinGenie combines interactive photo biomarker scanning, multi-factor scoring algorithms, and role-based consultant access into a unified platform.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.75rem" }}>
            <div className="card" style={{ padding: "1.75rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📸</div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Canvas Skin Photo Scanner</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
                Upload skin photos to analyze specular reflection, redness, and contrast variance to detect skin type and concerns (acne, dark spots, wrinkles).
              </p>
            </div>

            <div className="card" style={{ padding: "1.75rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊</div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>5-Weighted Scoring Algorithm</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
                Calculates daily overall skin health scores combining condition (35%), consistency (20%), lifestyle (20%), sleep (15%), and water intake (10%).
              </p>
            </div>

            <div className="card" style={{ padding: "1.75rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🧴</div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Custom AM/PM Routine Generator</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
                Receive customized step-by-step cleanser, serum, moisturizer, and SPF routines tailored to your skin profile and active flare-ups.
              </p>
            </div>

            <div className="card" style={{ padding: "1.75rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>👩‍⚕️</div>
              <h3 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Multi-Role Professional Ecosystem</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-ink-muted)", lineHeight: 1.5 }}>
                Dedicated workspaces for Patients, Certified Dermatologists, and Skincare Consultants to collaborate on care plans and appointments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section style={{ padding: "4rem 3vw", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem", background: "var(--color-surface)", borderRadius: "var(--radius-lg)" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>Ready to Start Your Skincare Routine?</h2>
          <p style={{ color: "var(--color-ink-muted)", maxWidth: "550px", margin: "0 auto 2rem" }}>
            Join SkinGenie today to receive your baseline skin score, custom routine, and access to certified skincare specialists.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" className="btn btn-primary btn-large" style={{ borderRadius: "var(--radius-sm)" }}>
              Create Free Account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large" style={{ borderRadius: "var(--radius-sm)" }}>
              Sign In to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "2rem 3vw", textAlign: "center", fontSize: "0.85rem", color: "var(--color-ink-muted)" }}>
        <p>© 2026 SkinGenie Clinical Skincare Planner. All rights reserved.</p>
      </footer>
    </div>
  );
}
