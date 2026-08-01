import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function AdminStat({ label, value, icon }) {
  return (
    <div className="card summary-card" style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}>
      <div>
        <div className="summary-label" style={{ fontSize: "0.85rem", textTransform: "uppercase", tracking: "0.05em", color: "var(--color-gold)", fontWeight: "bold" }}>
          {label}
        </div>
        <div className="summary-value" style={{ fontSize: "2.2rem", fontWeight: "800", margin: "0.25rem 0", color: "var(--color-ink)" }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: "2rem" }}>{icon}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [usersData, setUsersData] = useState({ users: [], total_count: 0, page: 1, pages: 1 });
  const [dermatologists, setDermatologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  
  // Filtering & Pagination State for Users Tab
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(10);

  // Editing state for Dermatologist tab
  const [editingDermaId, setEditingDermaId] = useState(null);
  const [editForm, setEditForm] = useState({
    phone: "",
    clinic_name: "",
    specialty: "",
    bio: "",
    address: "",
    website: "",
    accepting_new_patients: true
  });

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
  const [adding, setAdding] = useState(false);

  const loadStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load statistics.", err);
    }
  };

  const loadUsers = async () => {
    try {
      const roleParam = usersRoleFilter === "all" ? "" : `&role=${usersRoleFilter}`;
      const res = await api.get(`/admin/users?page=${usersPage}&limit=${usersLimit}${roleParam}`);
      setUsersData(res.data);
    } catch (err) {
      console.error("Failed to load users list.", err);
    }
  };

  const loadDermatologists = async () => {
    try {
      const res = await api.get("/admin/dermatologists");
      setDermatologists(res.data);
    } catch (err) {
      console.error("Failed to load dermatologists list.", err);
    }
  };

  const loadMe = async () => {
    try {
      const res = await api.get("/users/me");
      setMe(res.data);
    } catch (err) {
      console.error("Failed to load current user.", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadMe(), loadStats(), loadUsers(), loadDermatologists()]);
      setLoading(false);
    };
    init();
  }, [usersPage, usersRoleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setStatusMsg({ type: "ok", text: "User role updated successfully!" });
      loadUsers();
      loadStats();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to update user role." });
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: !currentStatus });
      setStatusMsg({ type: "ok", text: "User status updated successfully!" });
      loadUsers();
      loadStats();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to toggle user status." });
    }
  };

  const startEditingDerma = (derma) => {
    setEditingDermaId(derma.id);
    setEditForm({
      phone: derma.phone || "",
      clinic_name: derma.clinic_name || "",
      specialty: derma.specialty || "",
      bio: derma.bio || "",
      address: derma.address || "",
      website: derma.website || "",
      accepting_new_patients: derma.accepting_new_patients
    });
  };

  const handleDermaSave = async (dermaId) => {
    try {
      await api.patch(`/admin/dermatologists/${dermaId}`, editForm);
      setStatusMsg({ type: "ok", text: "Dermatologist profile updated successfully!" });
      setEditingDermaId(null);
      loadDermatologists();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to update profile." });
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAdding(true);
    setStatusMsg(null);
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
      setStatusMsg({ type: "ok", text: "Product added to catalog successfully!" });
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
      loadStats();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to add product." });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingState label="Loading workspace…" />;

  const firstName = me?.full_name?.split(" ")[0] || "Admin";

  return (
    <div className="page" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <PageHeader
        eyebrow="Admin panel"
        title={`Welcome back, ${firstName}`}
        description="Monitor system metrics, update roles, edit dermatologist accounts, and manage the product catalog."
      />

      {statusMsg && (
        <div className={`status-msg ${statusMsg.type}`} style={{ marginBottom: "1.5rem", borderRadius: "8px" }}>
          {statusMsg.text}
          <button className="status-close" onClick={() => setStatusMsg(null)}>×</button>
        </div>
      )}

      {/* Modern Tab Menu */}
      <div className="tab-row" style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
        <button
          className={`btn ${activeTab === "overview" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("overview")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "6px" }}
        >
          📈 Stats Overview
        </button>
        <button
          className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("users")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "6px" }}
        >
          👥 Manage Users
        </button>
        <button
          className={`btn ${activeTab === "dermatologists" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("dermatologists")}
          style={{ padding: "0.5rem 1.25rem", borderRadius: "6px" }}
        >
          🩺 Clinic Profiles
        </button>
      </div>

      {/* OVERVIEW SUMMARY */}
      {activeTab === "overview" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            <AdminStat label="Total Registered" value={usersData.total_count} icon="👥" />
            <AdminStat label="Dermatologists" value={stats.total_dermatologists} icon="🩺" />
            <AdminStat label="Products in Catalog" value={stats.total_products} icon="🧴" />
          </div>

          {/* Clean product insert panel */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0 }}>Add Skincare Product</h3>
                <p style={{ margin: "0.25rem 0 0 0", color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
                  Insert new products into the global catalog for patient routines.
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-primary"
                style={{ padding: "0.5rem 1rem", borderRadius: "6px" }}
              >
                {showAddForm ? "Cancel" : "➕ Create Product"}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="field">
                    <label>Product Name</label>
                    <input
                      type="text"
                      className="input"
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Brand Name</label>
                    <input
                      type="text"
                      className="input"
                      value={newProd.brand}
                      onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div className="field">
                    <label>Category</label>
                    <select
                      className="input"
                      value={newProd.category}
                      onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    >
                      <option value="Cleanser">Cleanser</option>
                      <option value="Moisturizer">Moisturizer</option>
                      <option value="Serum">Serum</option>
                      <option value="Sunscreen">Sunscreen</option>
                      <option value="Treatment">Treatment</option>
                      <option value="Toner">Toner</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={newProd.price}
                      onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Suitable Skin Types</label>
                    <input
                      type="text"
                      className="input"
                      value={newProd.suitable_skin_types}
                      onChange={(e) => setNewProd({ ...newProd, suitable_skin_types: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Key Ingredients (comma separated)</label>
                  <input
                    type="text"
                    className="input"
                    value={newProd.key_active_ingredients}
                    onChange={(e) => setNewProd({ ...newProd, key_active_ingredients: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    className="input"
                    value={newProd.description}
                    onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={adding} style={{ width: "max-content", alignSelf: "flex-start", padding: "0.6rem 1.5rem" }}>
                  {adding ? "Saving Product..." : "Save Product"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ margin: 0 }}>User Accounts List</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.88rem", color: "var(--color-fg-muted)" }}>Filter by Role:</span>
              <select
                className="input"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem", width: "auto" }}
                value={usersRoleFilter}
                onChange={(e) => {
                  setUsersRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="skincare_consultant">Skincare Consultant</option>
                <option value="dermatologist">Dermatologist</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
          </div>

          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "0.75rem" }}>Full Name</th>
                <th style={{ padding: "0.75rem" }}>Email</th>
                <th style={{ padding: "0.75rem" }}>Account Role</th>
                <th style={{ padding: "0.75rem" }}>Access Status</th>
                <th style={{ padding: "0.75rem" }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {usersData.users.map((usr) => (
                <tr key={usr.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "0.75rem" }}><strong>{usr.full_name}</strong></td>
                  <td style={{ padding: "0.75rem", color: "var(--color-fg-muted)" }}>{usr.email}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <select
                      className="input"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", width: "auto", margin: 0 }}
                      value={usr.role}
                      onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="skincare_consultant">Skincare Consultant</option>
                      <option value="dermatologist">Dermatologist</option>
                      <option value="administrator">Administrator</option>
                    </select>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <button
                      type="button"
                      className={`status-pill ${usr.is_active ? "status-accepted" : "status-rejected"}`}
                      style={{ border: "none", cursor: "pointer", fontWeight: "bold" }}
                      onClick={() => handleStatusToggle(usr.id, usr.is_active)}
                    >
                      {usr.is_active ? "Active" : "Suspended"}
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem", fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
                    {new Date(usr.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-fg-muted)" }}>
              Page {usersData.page} of {usersData.pages}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-secondary"
                disabled={usersPage <= 1}
                onClick={() => setUsersPage((prev) => prev - 1)}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={usersPage >= usersData.pages}
                onClick={() => setUsersPage((prev) => prev + 1)}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLINIC PROFILES TAB */}
      {activeTab === "dermatologists" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
            {dermatologists.map((derma) => {
              const isEditing = editingDermaId === derma.id;
              return (
                <div key={derma.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <span className="eyebrow" style={{ textTransform: "capitalize" }}>{derma.specialty || "Specialist"}</span>
                        <h3 style={{ margin: "0.2rem 0" }}>{derma.full_name}</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-fg-muted)" }}>{derma.email}</p>
                      </div>
                      <span className={`status-pill ${derma.accepting_new_patients ? "status-accepted" : "status-pending"}`}>
                        {derma.accepting_new_patients ? "Accepting Patients" : "Closed"}
                      </span>
                    </div>

                    <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.75rem 0" }} />

                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div className="field">
                          <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Clinic Name</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.clinic_name}
                            onChange={(e) => setEditForm({ ...editForm, clinic_name: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Clinic Phone</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Clinic Address</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Website URL</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.website}
                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                          />
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={editForm.accepting_new_patients}
                            onChange={(e) => setEditForm({ ...editForm, accepting_new_patients: e.target.checked })}
                          />
                          <span style={{ fontSize: "0.85rem" }}>Accepting new patients</span>
                        </label>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.88rem" }}>
                        <p style={{ margin: 0 }}><strong>Clinic:</strong> {derma.clinic_name || "Not specified"}</p>
                        <p style={{ margin: 0 }}><strong>Phone:</strong> {derma.phone || "Not specified"}</p>
                        <p style={{ margin: 0 }}><strong>Address:</strong> {derma.address || "Not specified"}</p>
                        <p style={{ margin: 0 }}>
                          <strong>Website:</strong>{" "}
                          {derma.website ? (
                            <a href={derma.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                              {derma.website}
                            </a>
                          ) : (
                            "Not specified"
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleDermaSave(derma.id)}
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setEditingDermaId(null)}
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => startEditingDerma(derma)}
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                      >
                        ✍️ Edit Clinic Info
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
