import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";

function SummaryCard({ label, value, note }) {
  return (
    <div className="card summary-card">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
      <p className="summary-note">{note}</p>
    </div>
  );
}

export default function DermatologistDashboard() {
  const [me, setMe] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meRes, appointmentsRes, patientsRes] = await Promise.all([
          api.get("/users/me"),
          api.get("/appointments/requests/inbox"),
          api.get("/workspace/dermatologist/patients").catch(() => ({ data: [] })),
        ]);
        setMe(meRes.data);
        setAppointments(appointmentsRes.data);
        setPatients(patientsRes.data);
      } catch {
        setError("Couldn't load your dermatologist dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const pending = appointments.filter((item) => item.status === "pending").length;
    const accepted = appointments.filter((item) => item.status === "accepted").length;
    const declined = appointments.filter((item) => item.status === "declined").length;
    return { pending, accepted, declined };
  }, [appointments]);

  if (loading) return <LoadingState label="Loading dermatologist dashboard…" />;

  const firstName = me?.full_name?.split(" ")[0] || "Doctor";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dermatologist workspace"
        title={`Welcome back, ${firstName}`}
        description="Review incoming appointment requests and respond to patients from your dedicated workspace."
      />

      {error && <div className="status-msg error">{error}</div>}

      <section className="section">
        <h2 className="section-title">Request summary</h2>
        <div className="card-grid">
          <SummaryCard label="Pending requests" value={stats.pending} note="Requests waiting for your review." />
          <SummaryCard label="Accepted" value={stats.accepted} note="Requests you have approved." />
          <SummaryCard label="Declined" value={stats.declined} note="Requests you have turned down." />
          <SummaryCard label="Assigned patients" value={patients.length} note="Patients whose progress and messages you can review." />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Next steps</h2>
        <div className="card-grid">
          <Link to="/dermatologist/appointments" className="card card-link">
            <h3>Review appointment requests</h3>
            <p className="stat-note">Open your inbox to accept or decline patient requests.</p>
          </Link>
          <Link to="/dermatologist/patients" className="card card-link">
            <h3>Open patient progress & messages</h3>
            <p className="stat-note">View patient progress entries and send direct follow-up messages from your private dermatologist page.</p>
          </Link>
          <Link to="/dermatologist/consultants" className="card card-link">
            <h3>Consultant collaboration</h3>
            <p className="stat-note">Coordinate with skincare consultants through a separate professional messaging workspace.</p>
          </Link>
          <Link to="/dermatologist/profile" className="card card-link">
            <h3>Manage dermatologist profile</h3>
            <p className="stat-note">Update your specialization, clinic details, and professional certificate in your secured profile.</p>
          </Link>
          <div className="card">
            <h3>Your account</h3>
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
              <span className="eyebrow eyebrow-inline">Dermatologist</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
