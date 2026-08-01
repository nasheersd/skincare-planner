import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
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

  // Load everything initially
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadUsers(), loadDermatologists()]);
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

  if (loading) return <LoadingState label="Loading Administration Console..." />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin workspace"
        title="Admin Control Center"
        description="Monitor system metrics, update user roles/permissions, manage clinic properties, and audit dermatologist accounts."
      />

      {statusMsg && (
        <div className={`status-msg ${statusMsg.type}`} style={{ marginBottom: "1.5rem" }}>
          {statusMsg.text}
          <button className="status-close" onClick={() => setStatusMsg(null)}>×</button>
        </div>
      )}

      {/* Tabs Row */}
      <div className="tab-row" style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
        <button
          className={`btn ${activeTab === "overview" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("overview")}
        >
          📈 Stats Overview
        </button>
        <button
          className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Manage Users
        </button>
        <button
          className={`btn ${activeTab === "dermatologists" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("dermatologists")}
        >
          🩺 Clinic Profiles
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="eyebrow">Dermatologists</span>
                <h2 style={{ fontSize: "2rem", margin: "0.25rem 0" }}>{stats.total_dermatologists}</h2>
                <p className="stat-note">Active clinics</p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>🩺</div>
            </div>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="eyebrow">MongoDB Catalog</span>
                <h2 style={{ fontSize: "2rem", margin: "0.25rem 0" }}>{stats.total_products}</h2>
                <p className="stat-note">Catalog products</p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>🧴</div>
            </div>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="eyebrow">Skincare Patients</span>
                <h2 style={{ fontSize: "2rem", margin: "0.25rem 0" }}>{stats.total_users_by_role.user || 0}</h2>
                <p className="stat-note">Registered profiles</p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>👥</div>
            </div>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="eyebrow">Consultants</span>
                <h2 style={{ fontSize: "2rem", margin: "0.25rem 0" }}>{stats.total_users_by_role.skincare_consultant || 0}</h2>
                <p className="stat-note">Active agents</p>
              </div>
              <div style={{ fontSize: "2.5rem" }}>🌿</div>
            </div>
          </div>

          <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
            <h3>System Status & Infrastructure</h3>
            <p style={{ margin: "0.5rem 0 1rem 0", color: "var(--color-fg-muted)", fontSize: "0.9rem" }}>
              PostgreSQL and MongoDB databases are fully connected and operational.
            </p>
            <div className="detail-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div className="detail-box" style={{ background: "var(--color-surface-sunken)" }}>
                <strong>Total Administrators</strong>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "0.25rem 0 0 0" }}>
                  {stats.total_users_by_role.administrator || 0}
                </p>
              </div>
              <div className="detail-box" style={{ background: "var(--color-surface-sunken)" }}>
                <strong>Core Database</strong>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "green", margin: "0.25rem 0 0 0" }}>
                  ONLINE (Postgres)
                </p>
              </div>
              <div className="detail-box" style={{ background: "var(--color-surface-sunken)" }}>
                <strong>No-SQL Catalog</strong>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "green", margin: "0.25rem 0 0 0" }}>
                  CONNECTED (Mongo)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS MANAGEMENT TAB */}
      {activeTab === "users" && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <h3>All Registered Accounts ({usersData.total_count})</h3>
            
            {/* Filter by role */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>Filter Role:</span>
              <select
                className="input"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.88rem", width: "auto" }}
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
                  <td style={{ padding: "0.75rem", fontSize: "0.88rem", color: "var(--color-fg-muted)" }}>
                    {new Date(usr.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controllers */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
            <span style={{ fontSize: "0.88rem", color: "var(--color-fg-muted)" }}>
              Page {usersData.page} of {usersData.pages}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-secondary"
                disabled={usersPage <= 1}
                onClick={() => setUsersPage((prev) => prev - 1)}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={usersPage >= usersData.pages}
                onClick={() => setUsersPage((prev) => prev + 1)}
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DERMATOLOGISTS/CLINIC TAB */}
      {activeTab === "dermatologists" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {dermatologists.map((derma) => {
              const isEditing = editingDermaId === derma.id;
              return (
                <div key={derma.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <span className="eyebrow" style={{ textTransform: "capitalize" }}>{derma.specialty || "Dermatologist Specialist"}</span>
                        <h3 style={{ margin: "0.2rem 0" }}>{derma.full_name}</h3>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-fg-muted)" }}>{derma.email}</p>
                      </div>
                      <span className={`status-pill ${derma.accepting_new_patients ? "status-accepted" : "status-pending"}`}>
                        {derma.accepting_new_patients ? "Accepting Patients" : "Intake Closed"}
                      </span>
                    </div>

                    <hr style={{ border: "0", borderTop: "1px solid var(--color-border)", margin: "0.75rem 0" }} />

                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div className="field">
                          <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Clinic Name</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.clinic_name}
                            onChange={(e) => setEditForm({ ...editForm, clinic_name: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Clinic Phone</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Clinic Specialty</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.specialty}
                            onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Clinic Address</label>
                          <input
                            type="text"
                            className="input"
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Website URL</label>
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
                          <span style={{ fontSize: "0.88rem" }}>Accepting new patients</span>
                        </label>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem" }}>
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
                        {derma.certificate_url && (
                          <p style={{ margin: "0.5rem 0 0 0" }}>
                            <a
                              href={`http://localhost:8000${derma.certificate_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ display: "inline-block", padding: "0.25rem 0.5rem", fontSize: "0.78rem" }}
                            >
                              📄 Preview License Certificate
                            </a>
                          </p>
                        )}
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
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setEditingDermaId(null)}
                          style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => startEditingDerma(derma)}
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
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
