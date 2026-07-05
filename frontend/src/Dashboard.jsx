import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import RitualRing from "../components/RitualRing";

export default function Dashboard() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get("/users/me").then((res) => setMe(res.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Milestone 1 · Foundation</div>
        <h1>{me ? `Welcome, ${me.full_name.split(" ")[0]}` : "Welcome"}</h1>
        <p>Here's where your skincare foundation stands today.</p>
      </div>

      <div className="card-grid">
        <Link to="/skin-profile" className="card stat-card" style={{ textDecoration: "none" }}>
          <RitualRing size={56} progress={0.5} color="var(--color-primary)" />
          <div>
            <h3>Skin Profile</h3>
            <p className="stat-note">Add your skin type, concerns & sensitivities</p>
          </div>
        </Link>

        <Link to="/skin-assessment" className="card stat-card" style={{ textDecoration: "none" }}>
          <RitualRing size={56} progress={0.3} color="var(--color-accent)" />
          <div>
            <h3>Lifestyle Check-in</h3>
            <p className="stat-note">Log today's sleep, water & stress</p>
          </div>
        </Link>

        <Link to="/progress" className="card stat-card" style={{ textDecoration: "none" }}>
          <RitualRing size={56} progress={0.15} color="var(--color-gold)" />
          <div>
            <h3>Progress</h3>
            <p className="stat-note">Tracked from Milestone 2 onward</p>
          </div>
        </Link>
      </div>

      {me && (
        <div className="card" style={{ marginTop: "1.1rem" }}>
          <h3 style={{ marginBottom: "0.6rem" }}>Account</h3>
          <p style={{ margin: 0 }}>
            Signed in as <strong style={{ color: "var(--color-ink)" }}>{me.email}</strong> · role <span className="eyebrow" style={{ marginBottom: 0 }}>{me.role}</span>
          </p>
        </div>
      )}
    </div>
  );
}