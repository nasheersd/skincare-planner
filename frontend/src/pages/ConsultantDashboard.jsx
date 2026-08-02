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
  const [products, setProducts] = useState([]);
  const [recommendationLogs, setRecommendationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProd, setNewProd] = useState({
    name: "",
    brand: "",
    category: "Moisturizer",
    price: 25.0,
    suitable_skin_types: "oily, dry, combination, sensitive, normal",
    key_active_ingredients: "Hyaluronic Acid, Niacinamide",
    description: "Clinical grade daily moisturizer."
  });
  const [addStatus, setAddStatus] = useState(null);
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
    try {
      const [meRes, profileRes, patientsRes, dermatologistsRes, recsRes, allRecsRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/workspace/consultant-profile").catch(() => ({ data: null })),
        api.get("/workspace/consultant/patients").catch(() => ({ data: [] })),
        api.get("/workspace/consultant/dermatologists").catch(() => ({ data: [] })),
        api.get("/recommendations/").catch(() => ({ data: null })),
        api.get("/recommendations/all").catch(() => ({ data: [] })),
      ]);
      setMe(meRes.data);
      setProfile(profileRes.data);
      setPatients(patientsRes.data);
      setDermatologists(dermatologistsRes.data);
      if (recsRes.data?.products) {
        setProducts(recsRes.data.products);
      }
      setRecommendationLogs(allRecsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddStatus(null);
    try {
      const payload = {
        name: newProd.name,
        brand: newProd.brand,
        category: newProd.category,
        price: Number(newProd.price),
        suitable_skin_types: newProd.suitable_skin_types.split(",").map(s => s.trim().toLowerCase()),
        key_active_ingredients: newProd.key_active_ingredients.split(",").map(s => s.trim()),
        description: newProd.description,
        safety_warnings: ["Patch test before initial application"],
        usage_instructions: "Apply evenly twice daily after cleansing."
      };
      await api.post("/recommendations/", payload);
      setAddStatus({ type: "ok", text: "Product added to clinical catalog successfully!" });
      setNewProd({
        name: "",
        brand: "",
        category: "Moisturizer",
        price: 25.0,
        suitable_skin_types: "oily, dry, combination, sensitive, normal",
        key_active_ingredients: "Hyaluronic Acid, Niacinamide",
        description: "Clinical grade daily moisturizer."
      });
      setShowAddForm(false);
      loadData();
    } catch {
      setAddStatus({ type: "error", text: "Failed to add product. Ensure all fields are filled." });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingState label="Loading consultant workspace…" />;

  const firstName = me?.full_name?.split(" ")[0] || "there";

  return (
    <div className="page">
      <PageHeader
        eyebrow="Consultant workspace"
        title={`Welcome, ${firstName}`}
        description="Manage patient routines, dermatologist consultations, and recommended skincare products."
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
            label="Catalog Products"
            value={products.length}
            note="Active skincare products available for recommendation routines."
          />
        </div>
      </section>

      {/* Recommended Products Catalog Section */}
      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Clinical Products & Recommendation Catalog</h2>
            <p style={{ margin: "0.2rem 0 0", color: "var(--color-ink-muted)", fontSize: "0.88rem" }}>
              Add and manage recommended products tailored for patient routines.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {showAddForm ? "✕ Close Form" : "➕ Add Product to Catalog"}
          </button>
        </div>

        {addStatus && (
          <div className={`status-msg ${addStatus.type}`} style={{ marginBottom: "1rem" }}>
            {addStatus.text}
          </div>
        )}

        {/* Add Product Collapsible Form */}
        {showAddForm && (
          <div className="card" style={{ padding: "1.75rem", marginBottom: "1.5rem", background: "var(--color-surface-sunken)" }}>
            <h3 style={{ marginTop: 0 }}>Add New Skincare Product</h3>
            <form onSubmit={handleAddProduct}>
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="field">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Gentle Hydra-Gel Cleanser"
                  />
                </div>
                <div className="field">
                  <label>Brand *</label>
                  <input
                    type="text"
                    required
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    placeholder="e.g. SkinGenie Labs"
                  />
                </div>
                <div className="field">
                  <label>Category *</label>
                  <select
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                  >
                    <option value="Cleanser">Cleanser</option>
                    <option value="Serum">Serum</option>
                    <option value="Moisturizer">Moisturizer</option>
                    <option value="Sunscreen">Sunscreen</option>
                    <option value="Exfoliant">Exfoliant</option>
                    <option value="Night Cream">Night Cream</option>
                  </select>
                </div>
                <div className="field">
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: "1rem" }}>
                <label>Suitable Skin Types (comma-separated)</label>
                <input
                  type="text"
                  value={newProd.suitable_skin_types}
                  onChange={(e) => setNewProd({ ...newProd, suitable_skin_types: e.target.value })}
                  placeholder="e.g. oily, dry, sensitive, normal, combination"
                />
              </div>

              <div className="field" style={{ marginTop: "1rem" }}>
                <label>Key Active Ingredients (comma-separated)</label>
                <input
                  type="text"
                  value={newProd.key_active_ingredients}
                  onChange={(e) => setNewProd({ ...newProd, key_active_ingredients: e.target.value })}
                  placeholder="e.g. Salicylic Acid, Niacinamide, Zinc PCA"
                />
              </div>

              <div className="field" style={{ marginTop: "1rem" }}>
                <label>Description</label>
                <textarea
                  rows="2"
                  value={newProd.description}
                  onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                />
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? "Saving product..." : "Save & Publish Product"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Product Catalog Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {products.length === 0 ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-ink-muted)" }}>
              No products found in catalog. Click "Add Product to Catalog" above to add products.
            </div>
          ) : (
            products.map((prod, idx) => (
              <div key={prod.id || idx} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.6rem", background: "var(--color-primary-tint)", color: "var(--color-primary)", borderRadius: "8px", fontWeight: "700", textTransform: "uppercase" }}>
                      {prod.category}
                    </span>
                    <span style={{ fontWeight: "700", color: "var(--color-primary-dark)", fontSize: "1.05rem" }}>
                      ${prod.price}
                    </span>
                  </div>

                  <h3 style={{ margin: "0.4rem 0 0.2rem", fontSize: "1.1rem" }}>{prod.name}</h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-ink-faint)", fontWeight: "600", marginBottom: "0.75rem" }}>
                    by {prod.brand}
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--color-ink-muted)", lineHeight: 1.4, marginBottom: "1rem" }}>
                    {prod.description}
                  </p>
                </div>

                <div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", fontSize: "0.78rem" }}>
                    <div style={{ color: "var(--color-ink-muted)", marginBottom: "0.3rem" }}>
                      <strong>Active Actives:</strong> {Array.isArray(prod.key_active_ingredients) ? prod.key_active_ingredients.join(", ") : prod.key_active_ingredients}
                    </div>
                    <div style={{ color: "var(--color-primary)", fontWeight: "600" }}>
                      <strong>Suitable for:</strong> {Array.isArray(prod.suitable_skin_types) ? prod.suitable_skin_types.join(", ") : prod.suitable_skin_types}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recently Assigned Recommendations Registry */}
      <section className="section">
        <h2 className="section-title">Assigned Recommendations Registry</h2>
        <p style={{ margin: "0.2rem 0 1rem 0", color: "var(--color-ink-muted)", fontSize: "0.88rem" }}>
          Overview of skincare recommendations formulated for active customers.
        </p>

        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)", background: "var(--color-surface-sunken)" }}>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Customer Info</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Formulated Products</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Plan / Notes</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase" }}>Author</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", textAlign: "right" }}>Date Assigned</th>
              </tr>
            </thead>
            <tbody>
              {recommendationLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "var(--color-ink-faint)" }}>
                    No product recommendations assigned yet. Go to Customer Progress to prescribe one.
                  </td>
                </tr>
              ) : (
                recommendationLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <strong>{log.user_name}</strong>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)" }}>{log.user_email}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {log.products?.map((p) => (
                          <span key={p.id} style={{ fontSize: "0.75rem", background: "var(--color-primary-tint)", color: "var(--color-primary-dark)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "var(--color-ink-muted)", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.notes}>
                      {log.notes || "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem" }}>
                      {log.consultant_name}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.82rem", color: "var(--color-ink-faint)" }}>
                      {log.created_at ? new Date(log.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
