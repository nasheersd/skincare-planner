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
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [recommendationNotes, setRecommendationNotes] = useState("");
  const [savingRec, setSavingRec] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  // Load initial patient and catalog data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [patientsRes, catalogRes] = await Promise.all([
          api.get("/workspace/consultant/patients"),
          api.get("/recommendations/").catch(() => ({ data: { recommendations: [] } }))
        ]);
        
        setCustomers(patientsRes.data);
        if (patientsRes.data.length > 0) {
          setSelectedCustomerId(patientsRes.data[0].id);
        }
        
        if (catalogRes.data?.recommendations) {
          setCatalogProducts(catalogRes.data.recommendations);
        }
      } catch (err) {
        setStatus({ type: "error", text: "Couldn't load workspace data." });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch active patient's recommended products when patient changes
  useEffect(() => {
    if (!selectedCustomerId) return;
    
    const fetchPatientRecommendations = async () => {
      try {
        const res = await api.get(`/recommendations/user/${selectedCustomerId}`);
        if (res.data) {
          setSelectedProductIds(res.data.products?.map(p => p.id) || []);
          setRecommendationNotes(res.data.notes || "");
        } else {
          setSelectedProductIds([]);
          setRecommendationNotes("");
        }
      } catch (err) {
        setSelectedProductIds([]);
        setRecommendationNotes("");
      }
    };

    fetchPatientRecommendations();
  }, [selectedCustomerId]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const handleMessageDermatologist = (dermatologistId) => {
    navigate("/consultant/dermatologists", { state: { preSelectedDermatologistId: dermatologistId } });
  };

  const handleToggleProduct = (prodId) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSaveRecommendations = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setSavingRec(true);
    setStatus(null);

    try {
      await api.post(`/recommendations/user/${selectedCustomerId}`, {
        product_ids: selectedProductIds,
        notes: recommendationNotes
      });
      setStatus({ type: "ok", text: `Recommendations saved successfully for ${selectedCustomer.full_name}!` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({ type: "error", text: "Failed to save recommendations. Try again." });
    } finally {
      setSavingRec(false);
    }
  };

  if (loading) return <LoadingState label="Loading customer workspace…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Consultant workspace"
        title="Customer Profiles & Progress"
        description="Monitor customer skincare progress, analyze daily lifestyle logs, and assign recommended products."
      />

      {status && (
        <div className={`status-msg ${status.type}`} style={{ marginBottom: "1.5rem" }}>
          {status.text}
        </div>
      )}

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
                    <span className="workspace-list-note" style={{ color: "var(--color-primary)", fontWeight: "bold" }}>
                      Score: {c.latest_score}/100
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Customer Workspace Main Panel */}
          {selectedCustomer && (
            <div className="workspace-main" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Header Info */}
              <div className="card" style={{ borderLeft: "4px solid var(--color-primary)", margin: 0 }}>
                <div className="appointment-card-header">
                  <div>
                    <span className="eyebrow">Customer Account</span>
                    <h3>{selectedCustomer.full_name}</h3>
                    <p className="stat-note">{selectedCustomer.email}</p>
                  </div>
                  {selectedCustomer.latest_score !== null && (
                    <div style={{ textAlign: "right" }}>
                      <span className="eyebrow">Latest Skin Score</span>
                      <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                        {selectedCustomer.latest_score}/100
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skin Profile details */}
              <div className="card" style={{ margin: 0 }}>
                <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Skin Profile</h3>
                <div className="detail-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <div className="detail-box">
                    <strong>Skin Type</strong>
                    <p style={{ textTransform: "capitalize", fontSize: "1.1rem", color: "var(--color-primary)", fontWeight: "bold", margin: "0.25rem 0 0 0" }}>
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

              {/* PRODUCT RECOMMENDATION ASSIGNMENT FORM */}
              <div className="card" style={{ margin: 0, background: "var(--color-primary-tint)", border: "1px solid var(--color-primary)" }}>
                <h3 style={{ marginTop: 0, color: "var(--color-primary-dark)" }}>🧴 Consultant Product Recommendations</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Select catalog products to recommend specifically for {selectedCustomer.full_name}. They will see these pinned at the top of their recommendations shelf.
                </p>

                <form onSubmit={handleSaveRecommendations}>
                  {catalogProducts.length === 0 ? (
                    <p style={{ fontStyle: "italic", color: "var(--color-ink-muted)" }}>
                      No products available in the catalog. Please add products to the catalog first.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                      {catalogProducts.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.6rem 0.8rem",
                              background: "var(--color-surface)",
                              border: isChecked ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProduct(p.id)}
                              style={{ marginTop: "0.2rem" }}
                            />
                            <div>
                              <strong style={{ fontSize: "0.88rem", display: "block" }}>{p.name}</strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)" }}>
                                {p.brand} · {p.category}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="field" style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontWeight: "700", marginBottom: "0.4rem", display: "block" }}>Recommendation Notes / Usage Plan</label>
                    <textarea
                      rows="3"
                      value={recommendationNotes}
                      onChange={(e) => setRecommendationNotes(e.target.value)}
                      placeholder="e.g. Apply the Hydra-Gel Cleanser in the morning, followed by Niacinamide serum twice weekly..."
                      style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={savingRec}>
                    {savingRec ? "Saving recommendations..." : "Save Product Recommendations"}
                  </button>
                </form>
              </div>

              {/* Assigned Dermatologist */}
              <div className="card" style={{ margin: 0 }}>
                <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Assigned Dermatologist</h3>
                {selectedCustomer.assigned_dermatologist ? (
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{selectedCustomer.assigned_dermatologist.full_name}</h4>
                      <p className="stat-note" style={{ margin: "0.25rem 0" }}>
                        {selectedCustomer.assigned_dermatologist.specialty || "Dermatologist"}
                      </p>
                      {selectedCustomer.assigned_dermatologist.clinic_name && (
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-muted)" }}>
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
                  <p style={{ margin: 0, color: "var(--color-ink-muted)", textAlign: "center" }}>No dermatologist assigned yet.</p>
                )}
              </div>

              {/* Progress & Lifestyle entries */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                
                {/* Progress Entries */}
                <div className="card" style={{ margin: 0, maxHeight: "350px", overflowY: "auto" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Progress History</h3>
                  {selectedCustomer.progress_entries.length === 0 ? (
                    <p style={{ color: "var(--color-ink-muted)", textAlign: "center", padding: "2rem 0" }}>No progress entries logged.</p>
                  ) : (
                    <div>
                      {selectedCustomer.progress_entries.map((entry) => (
                        <div key={entry.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}>
                          <strong>{formatDate(entry.entry_date)}</strong>
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--color-ink-muted)" }}>
                            {entry.notes || "No notes."}
                          </p>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-primary)", marginTop: "0.25rem" }}>
                            Hydration: {entry.hydration_score ?? "-"} · Breakouts: {entry.breakout_count ?? "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lifestyle Logs */}
                <div className="card" style={{ margin: 0, maxHeight: "350px", overflowY: "auto" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Lifestyle Logs</h3>
                  {selectedCustomer.lifestyle_entries.length === 0 ? (
                    <p style={{ color: "var(--color-ink-muted)", textAlign: "center", padding: "2rem 0" }}>No lifestyle logs submitted.</p>
                  ) : (
                    <div>
                      {selectedCustomer.lifestyle_entries.map((entry) => (
                        <div key={entry.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}>
                          <strong>{formatDate(entry.entry_date)}</strong>
                          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-ink-muted)", marginTop: "0.25rem" }}>
                            <span>Sleep: {entry.sleep_hours ?? "-"}h</span>
                            <span>Water: {entry.water_intake_liters ?? "-"}L</span>
                            <span>Stress: {entry.stress_level ?? "-"}</span>
                          </div>
                          {entry.environmental_exposure && (
                            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", fontStyle: "italic", color: "var(--color-ink-muted)" }}>
                              Exposure: {entry.environmental_exposure}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
