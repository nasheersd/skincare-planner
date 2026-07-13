import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function ConsultantCustomers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await api.get("/workspace/consultant/patients");
        setCustomers(res.data);
        if (res.data.length > 0) {
          setSelectedCustomerId(res.data[0].id);
        }
      } catch (err) {
        setStatus({ type: "error", text: "Couldn't load customers list." });
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const handleMessageDermatologist = (dermatologistId) => {
    // Navigate to dermatologist chat page with pre-selected dermatologist ID in state
    navigate("/consultant/dermatologists", { state: { preSelectedDermatologistId: dermatologistId } });
  };

  if (loading) return <LoadingState label="Loading customer list…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Consultant workspace"
        title="Customer Profiles & Progress"
        description="Monitor customer skincare progress, analyze daily lifestyle logs, and review assigned dermatologists."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      {customers.length === 0 ? (
        <div className="card empty-state">
          <h3>No customers registered yet</h3>
          <p>Customer profiles will show up here once they register and log in to the planner.</p>
        </div>
      ) : (
        <div className="workspace-grid">
          {/* Customers Sidebar */}
          <aside className="card workspace-sidebar">
            <h3>Customers</h3>
            <div className="workspace-list">
              {customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`workspace-list-item${c.id === selectedCustomerId ? " active" : ""}`}
                  onClick={() => setSelectedCustomerId(c.id)}
                >
                  <strong>{c.full_name}</strong>
                  <span>{c.email}</span>
                  {c.latest_score !== null && (
                    <span className="workspace-list-note" style={{ color: "var(--color-gold)", fontWeight: "bold" }}>
                      Score: {c.latest_score}/100
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Customer Workspace Main Panel */}
          {selectedCustomer && (
            <div className="workspace-main">
              {/* Header Info */}
              <section className="section" style={{ marginBottom: "1.5rem" }}>
                <div className="card" style={{ borderLeft: "4px solid var(--color-gold)" }}>
                  <div className="appointment-card-header">
                    <div>
                      <span className="eyebrow">Customer Account</span>
                      <h3>{selectedCustomer.full_name}</h3>
                      <p className="stat-note">{selectedCustomer.email}</p>
                    </div>
                    {selectedCustomer.latest_score !== null && (
                      <div style={{ textAlign: "right" }}>
                        <span className="eyebrow">Latest Skin Score</span>
                        <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-gold)" }}>
                          {selectedCustomer.latest_score}/100
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Skin Profile details */}
              <section className="section" style={{ marginBottom: "1.5rem" }}>
                <h2 className="section-title">Skin Profile</h2>
                <div className="card">
                  <div className="detail-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div className="detail-box">
                      <strong>Skin Type</strong>
                      <p style={{ textTransform: "capitalize", fontSize: "1.1rem", color: "var(--color-gold)", fontWeight: "bold", margin: "0.25rem 0 0 0" }}>
                        {selectedCustomer.skin_profile?.skin_type || "Not specified"}
                      </p>
                    </div>
                    <div className="detail-box">
                      <strong>Skin Concerns</strong>
                      <p style={{ margin: "0.25rem 0 0 0" }}>{selectedCustomer.skin_profile?.skin_concerns || "None registered"}</p>
                    </div>
                    <div className="detail-box">
                      <strong>Sensitivities</strong>
                      <p style={{ margin: "0.25rem 0 0 0" }}>{selectedCustomer.skin_profile?.skin_sensitivities || "None registered"}</p>
                    </div>
                    <div className="detail-box">
                      <strong>Allergies</strong>
                      <p style={{ margin: "0.25rem 0 0 0" }}>{selectedCustomer.skin_profile?.allergies || "None registered"}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Assigned Dermatologist */}
              <section className="section" style={{ marginBottom: "1.5rem" }}>
                <h2 className="section-title">Assigned Dermatologist</h2>
                <div className="card">
                  {selectedCustomer.assigned_dermatologist ? (
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{selectedCustomer.assigned_dermatologist.full_name}</h3>
                        <p className="stat-note" style={{ margin: "0.25rem 0" }}>
                          {selectedCustomer.assigned_dermatologist.specialty || "Dermatologist"}
                        </p>
                        {selectedCustomer.assigned_dermatologist.clinic_name && (
                          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>
                            Clinic: {selectedCustomer.assigned_dermatologist.clinic_name}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleMessageDermatologist(selectedCustomer.assigned_dermatologist.id)}
                      >
                        Message Dermatologist 💬
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "1rem 0" }}>
                      <p style={{ margin: 0, color: "var(--color-fg-muted)" }}>No dermatologist assigned to this customer yet.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Progress & Lifestyle entries */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                
                {/* Progress Entries */}
                <section className="section">
                  <h2 className="section-title">Progress History</h2>
                  <div className="card" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {selectedCustomer.progress_entries.length === 0 ? (
                      <p style={{ color: "var(--color-fg-muted)", textAlign: "center", margin: "2rem 0" }}>No progress entries logged yet.</p>
                    ) : (
                      <div className="progress-preview-list">
                        {selectedCustomer.progress_entries.map((entry) => (
                          <div key={entry.id} className="progress-preview-row" style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}>
                            <div>
                              <strong>{formatDate(entry.entry_date)}</strong>
                              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>
                                {entry.notes || "No notes."}
                              </p>
                            </div>
                            <div className="progress-preview-stats" style={{ fontSize: "0.8rem", color: "var(--color-gold)", marginTop: "0.25rem" }}>
                              <span>Hydration: {entry.hydration_score ?? "-"}</span> · <span>Breakouts: {entry.breakout_count ?? "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Lifestyle Logs */}
                <section className="section">
                  <h2 className="section-title">Lifestyle Logs</h2>
                  <div className="card" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    {selectedCustomer.lifestyle_entries.length === 0 ? (
                      <p style={{ color: "var(--color-fg-muted)", textAlign: "center", margin: "2rem 0" }}>No lifestyle logs submitted yet.</p>
                    ) : (
                      <div className="progress-preview-list">
                        {selectedCustomer.lifestyle_entries.map((entry) => (
                          <div key={entry.id} className="progress-preview-row" style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}>
                            <div>
                              <strong>{formatDate(entry.entry_date)}</strong>
                              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-fg-muted)", marginTop: "0.25rem" }}>
                                <span>Sleep: {entry.sleep_hours ?? "-"}h</span>
                                <span>Water: {entry.water_intake_liters ?? "-"}L</span>
                                <span>Stress: {entry.stress_level ?? "-"}</span>
                              </div>
                              {entry.environmental_exposure && (
                                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", fontStyle: "italic", color: "var(--color-fg-muted)" }}>
                                  Exposure: {entry.environmental_exposure}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
