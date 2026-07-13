import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function ConsultantStat({ label, value, note }) {
  return (
    <div className="card summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
      <p className="summary-note">{note}</p>
    </div>
  );
}

export default function ConsultantDashboard() {
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [dermatologists, setDermatologists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meRes, profileRes, patientsRes, dermatologistsRes] = await Promise.all([
          api.get("/users/me"),
          api.get("/workspace/consultant-profile").catch(() => ({ data: null })),
          api.get("/workspace/consultant/patients").catch(() => ({ data: [] })),
          api.get("/workspace/consultant/dermatologists").catch(() => ({ data: [] })),
        ]);
        setMe(meRes.data);
        setProfile(profileRes.data);
        setPatients(patientsRes.data);
        setDermatologists(dermatologistsRes.data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <LoadingState label="Loading consultant workspace…" />;

  const firstName = me?.full_name?.split(" ")[0] || "there";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Consultant workspace"
        title={`Welcome, ${firstName}`}
        description="This separated page is reserved for skincare consultants and their professional profile."
      />

      <section className="section">
        <h2 className="section-title">Workspace summary</h2>
        <div className="card-grid">
          <ConsultantStat
            label="Workspace access"
            value="Private"
            note="Users and dermatologists cannot open consultant-only routes."
          />
          <ConsultantStat
            label="Profile status"
            value={profile ? "Ready" : "Needs setup"}
            note="Complete your consultant profile to present your professional details."
          />
          <ConsultantStat
            label="Customers"
            value={patients.length}
            note="Customer records and progress updates available in your consultant section."
          />
          <ConsultantStat
            label="Dermatologists"
            value={dermatologists.length}
            note="Professional dermatologist contacts available for collaboration and messaging."
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Consultant tools</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Your professional identity</h3>
            <p className="stat-note">
              Maintain a separated consultant profile with your specialization, organization, and contact details.
            </p>
            <Link to="/consultant/profile" className="btn btn-primary">
              Open consultant profile
            </Link>
          </div>
          <div className="card">
            <h3>Customer progress</h3>
            <p className="stat-note">
              Review customer skin profiles, progress history, latest assessment score, and assigned dermatologist.
            </p>
            <Link to="/consultant/customers" className="btn btn-primary">
              Open customer progress
            </Link>
          </div>
          <div className="card">
            <h3>Dermatologist collaboration</h3>
            <p className="stat-note">
              Contact dermatologists directly from the consultant section and keep professional conversations in one place.
            </p>
            <Link to="/consultant/dermatologists" className="btn btn-primary">
              Open dermatologist contacts
            </Link>
          </div>
          <div className="card">
            <h3>Account</h3>
            <div className="account-row">
              <span className="account-label">Name</span>
              <span className="account-value">{me?.full_name}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Email</span>
              <span className="account-value">{me?.email}</span>
            </div>
            <div className="account-row">
              <span className="account-label">Role</span>
              <span className="eyebrow eyebrow-inline">Skincare consultant</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
