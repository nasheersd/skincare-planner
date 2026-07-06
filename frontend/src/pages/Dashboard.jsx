import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import RitualRing from "../components/RitualRing";

const QUICK_ACTIONS = [
  {
    to: "/skin-profile",
    title: "Skin Profile",
    note: "Add your skin type, concerns & sensitivities",
    progress: 0.5,
    color: "var(--color-primary)",
  },
  {
    to: "/skin-assessment",
    title: "Lifestyle Check-in",
    note: "Log today's sleep, water & stress",
    progress: 0.3,
    color: "var(--color-accent)",
  },
  {
    to: "/recommendations",
    title: "Recommendations",
    note: "AI-powered suggestions — Milestone 2+",
    progress: 0.2,
    color: "var(--color-gold)",
  },
  {
    to: "/progress",
    title: "Progress",
    note: "Track your skin journey over time",
    progress: 0.15,
    color: "var(--color-primary-dark)",
  },
];

const ROLE_LABELS = {
  user: "Skincare user",
  skincare_consultant: "Skincare consultant",
  dermatologist: "Dermatologist",
};

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => setMe(res.data))
      .catch(() => setError("Couldn't load your account. Try refreshing the page."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState label="Loading your dashboard…" />;

  const firstName = me?.full_name?.split(" ")[0] || "there";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Milestone 1 · Foundation"
        title={`Welcome, ${firstName}`}
        description="Here's where your skincare foundation stands today."
      />

      {error && <div className="status-msg error">{error}</div>}

      <section className="section">
        <h2 className="section-title">Quick actions</h2>
        <div className="card-grid">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} to={action.to} className="card stat-card card-link">
              <RitualRing size={56} progress={action.progress} color={action.color} />
              <div>
                <h3>{action.title}</h3>
                <p className="stat-note">{action.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {me && (
        <section className="section">
          <h2 className="section-title">Account</h2>
          <div className="card account-card">
            <div className="account-row">
              <span className="account-label">Name</span>
              <span className="account-value">{me.full_name}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Email</span>
              <span className="account-value">{me.email}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Role</span>
              <span className="eyebrow eyebrow-inline">{ROLE_LABELS[me.role] || me.role}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
