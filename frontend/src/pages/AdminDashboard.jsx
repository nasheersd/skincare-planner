import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [usersData, setUsersData] = useState({ users: [], total_count: 0, page: 1, pages: 1 });
  const [dermatologists, setDermatologists] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
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

  // Add Ingredient Form State
  const [showAddIngForm, setShowAddIngForm] = useState(false);
  const [newIng, setNewIng] = useState({
    name: "",
    category: "Active",
    benefits: "Reduces oil production",
    suitable_skin_types: "oily, combination, normal",
    common_concerns_addressed: "acne, dullness",
    typical_concentration_range: "2-5%"
  });
  const [addingIng, setAddingIng] = useState(false);

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

  const loadProducts = async () => {
    try {
      const res = await api.get("/admin/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to load products list.", err);
    }
  };

  const loadIngredients = async () => {
    try {
      const res = await api.get("/admin/ingredients");
      setIngredients(res.data);
    } catch (err) {
      console.error("Failed to load ingredients list.", err);
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
      await Promise.all([loadMe(), loadStats(), loadUsers(), loadDermatologists(), loadProducts(), loadIngredients()]);
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
      loadProducts();
      loadStats();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to add product." });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product from the skincare catalog?")) return;
    try {
      await api.delete(`/recommendations/${productId}`);
      setStatusMsg({ type: "ok", text: "Product deleted from catalog successfully." });
      loadProducts();
      loadStats();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete product." });
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setAddingIng(true);
    setStatusMsg(null);
    try {
      const payload = {
        name: newIng.name,
        category: newIng.category,
        benefits: newIng.benefits.split(",").map(s => s.trim()),
        suitable_skin_types: newIng.suitable_skin_types.split(",").map(s => s.trim().toLowerCase()),
        common_concerns_addressed: newIng.common_concerns_addressed.split(",").map(s => s.trim().toLowerCase()),
        typical_concentration_range: newIng.typical_concentration_range
      };
      await api.post("/admin/ingredients", payload);
      setStatusMsg({ type: "ok", text: "Ingredient added to catalog successfully!" });
      setNewIng({
        name: "",
        category: "Active",
        benefits: "Reduces oil production",
        suitable_skin_types: "oily, combination, normal",
        common_concerns_addressed: "acne, dullness",
        typical_concentration_range: "2-5%"
      });
      setShowAddIngForm(false);
      loadIngredients();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to add ingredient." });
    } finally {
      setAddingIng(false);
    }
  };

  const handleDeleteIngredient = async (ingId) => {
    if (!window.confirm("Are you sure you want to delete this ingredient record from the catalog?")) return;
    try {
      await api.delete(`/admin/ingredients/${ingId}`);
      setStatusMsg({ type: "ok", text: "Ingredient record deleted successfully." });
      loadIngredients();
    } catch (err) {
      setStatusMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete ingredient." });
    }
  };

  if (loading) return <LoadingState label="Loading administration console…" />;

  const breadcrumbText = activeTab === "overview" ? "Overview" : activeTab === "users" ? "Users" : activeTab === "products" ? "Product Catalog" : activeTab === "ingredients" ? "Ingredients Catalog" : "Clinic Profiles";

  return (
    <div className="admin-shell">
      {/* Sticky Breadcrumb Header */}
      <header className="admin-header">
        <div>
          <div className="admin-breadcrumbs">Admin / {breadcrumbText}</div>
          <h1 className="admin-title-text">Skincare Planner Console</h1>
        </div>
        <div style={{ fontSize: "0.85rem", color: "#718096" }}>
          Logged in as: <strong>{me?.full_name}</strong>
        </div>
      </header>

      <div className="admin-container">
        {/* Status Alerts */}
        {statusMsg && (
          <div className={`status-msg ${statusMsg.type}`} style={{ marginBottom: "1.25rem", borderRadius: "4px", fontSize: "0.85rem" }}>
            {statusMsg.text}
            <button className="status-close" onClick={() => setStatusMsg(null)}>×</button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="admin-tab-bar">
          <button
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Stats Overview
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            Product Catalog
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "ingredients" ? "active" : ""}`}
            onClick={() => setActiveTab("ingredients")}
          >
            Ingredients Catalog
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "dermatologists" ? "active" : ""}`}
            onClick={() => setActiveTab("dermatologists")}
          >
            Clinic Profiles
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && stats && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div>
                  <div className="admin-stat-label">Total Accounts</div>
                  <div className="admin-stat-value">{usersData.total_count}</div>
                </div>
                <div className="admin-stat-icon">👥</div>
              </div>
              <div className="admin-stat-card">
                <div>
                  <div className="admin-stat-label">Active Clinics</div>
                  <div className="admin-stat-value">{stats.total_dermatologists}</div>
                </div>
                <div className="admin-stat-icon">🩺</div>
              </div>
              <div className="admin-stat-card">
                <div>
                  <div className="admin-stat-label">Catalog Products</div>
                  <div className="admin-stat-value">{stats.total_products}</div>
                </div>
                <div className="admin-stat-icon">🧴</div>
              </div>
            </div>

            {/* Role Breakdown Analytics */}
            <div className="admin-card">
              <h2 className="admin-card-title">System Role Distribution</h2>
              <div className="admin-data-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Account Role</th>
                      <th style={{ textAlign: "right" }}>Registered Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Consumer Users</td>
                      <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{stats.total_users_by_role?.user || 0}</td>
                    </tr>
                    <tr>
                      <td>Skincare Consultants</td>
                      <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{stats.total_users_by_role?.skincare_consultant || 0}</td>
                    </tr>
                    <tr>
                      <td>Dermatologists</td>
                      <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{stats.total_dermatologists || 0}</td>
                    </tr>
                    <tr>
                      <td>Administrators</td>
                      <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{stats.total_users_by_role?.administrator || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="admin-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 className="admin-card-title" style={{ margin: 0 }}>Registered User Directory</h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#4A5568" }}>Role:</span>
                <select
                  className="admin-input"
                  style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
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

            <div className="admin-data-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>System Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Registered Date</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.users.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "#718096", padding: "1.5rem" }}>
                        No results
                      </td>
                    </tr>
                  ) : (
                    usersData.users.map((usr) => (
                      <tr key={usr.id}>
                        <td><strong>{usr.full_name}</strong></td>
                        <td style={{ color: "#4A5568" }}>{usr.email}</td>
                        <td>
                          <select
                            className="admin-input"
                            style={{ width: "auto", padding: "0.2rem 0.4rem", fontSize: "0.8rem" }}
                            value={usr.role}
                            onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="skincare_consultant">Skincare Consultant</option>
                            <option value="dermatologist">Dermatologist</option>
                            <option value="administrator">Administrator</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-status-badge ${usr.is_active ? "active" : "suspended"}`}
                            style={{ border: "none", cursor: "pointer" }}
                            onClick={() => handleStatusToggle(usr.id, usr.is_active)}
                          >
                            {usr.is_active ? "Active" : "Suspended"}
                          </button>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#718096" }}>
                          {new Date(usr.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", borderTop: "1px solid #E2E8F0", paddingTop: "0.75rem" }}>
              <span style={{ fontSize: "0.78rem", color: "#718096" }}>
                Showing page {usersData.page} of {usersData.pages}
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  className="admin-btn admin-btn-secondary"
                  disabled={usersPage <= 1}
                  onClick={() => setUsersPage((prev) => prev - 1)}
                  style={{ padding: "0.25rem 0.5rem" }}
                >
                  Prev
                </button>
                <button
                  className="admin-btn admin-btn-secondary"
                  disabled={usersPage >= usersData.pages}
                  onClick={() => setUsersPage((prev) => prev + 1)}
                  style={{ padding: "0.25rem 0.5rem" }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT CATALOG TAB */}
        {activeTab === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Create Product Card */}
            <div className="admin-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="admin-card-title" style={{ margin: 0 }}>Add New Skincare Product</h2>
                  <p style={{ margin: "0.2rem 0 0 0", color: "#718096", fontSize: "0.82rem" }}>
                    Create product records for routine builder and consultants.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="admin-btn admin-btn-primary"
                >
                  {showAddForm ? "Cancel" : "Add Product"}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem", borderTop: "1px solid #E2E8F0", paddingTop: "1.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Product Name</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newProd.name}
                        onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Brand</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newProd.brand}
                        onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Category</label>
                      <select
                        className="admin-input"
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
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="admin-input"
                        value={newProd.price}
                        onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Suitable Skin Types</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newProd.suitable_skin_types}
                        onChange={(e) => setNewProd({ ...newProd, suitable_skin_types: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Key Ingredients (comma separated)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newProd.key_active_ingredients}
                      onChange={(e) => setNewProd({ ...newProd, key_active_ingredients: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Description</label>
                    <textarea
                      rows="3"
                      className="admin-input"
                      value={newProd.description}
                      onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={adding} style={{ width: "max-content", padding: "0.5rem 1.25rem" }}>
                    {adding ? "Saving..." : "Save Product"}
                  </button>
                </form>
              )}
            </div>

            {/* Interactive Catalog Table */}
            <div className="admin-card">
              <h2 className="admin-card-title">Skincare Product Catalog Records</h2>
              <div className="admin-data-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Product Info</th>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Price</th>
                      <th>Key Ingredients</th>
                      <th>Suitable Types</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", color: "#718096", padding: "1.5rem" }}>
                          No results
                        </td>
                      </tr>
                    ) : (
                      products.map((prod) => (
                        <tr key={prod.id}>
                          <td>
                            <strong>{prod.name}</strong>
                            <div style={{ fontSize: "0.75rem", color: "#718096" }}>{prod.brand}</div>
                          </td>
                          <td>{prod.category}</td>
                          <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>
                            ${Number(prod.price).toFixed(2)}
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "#4A5568" }}>
                            {prod.key_active_ingredients?.join(", ")}
                          </td>
                          <td style={{ fontSize: "0.78rem", textTransform: "capitalize" }}>
                            {prod.suitable_skin_types?.join(", ")}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="admin-btn"
                              style={{ color: "#E53E3E", background: "transparent", border: "none", cursor: "pointer", fontWeight: "bold" }}
                              onClick={() => handleDeleteProduct(prod.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INGREDIENTS CATALOG TAB */}
        {activeTab === "ingredients" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Create Ingredient Form Card */}
            <div className="admin-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 className="admin-card-title" style={{ margin: 0 }}>Register New Active Ingredient</h2>
                  <p style={{ margin: "0.2rem 0 0 0", color: "#718096", fontSize: "0.82rem" }}>
                    Insert active ingredients to power matching skincare intelligence analysis.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddIngForm(!showAddIngForm)}
                  className="admin-btn admin-btn-primary"
                >
                  {showAddIngForm ? "Cancel" : "Add Ingredient"}
                </button>
              </div>

              {showAddIngForm && (
                <form onSubmit={handleAddIngredient} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem", borderTop: "1px solid #E2E8F0", paddingTop: "1.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Ingredient Name</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newIng.name}
                        onChange={(e) => setNewIng({ ...newIng, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Category (e.g. Exfoliant, Humectant)</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newIng.category}
                        onChange={(e) => setNewIng({ ...newIng, category: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Suitable Skin Types</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newIng.suitable_skin_types}
                        onChange={(e) => setNewIng({ ...newIng, suitable_skin_types: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Concerns Addressed</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newIng.common_concerns_addressed}
                        onChange={(e) => setNewIng({ ...newIng, common_concerns_addressed: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Typical Concentration</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={newIng.typical_concentration_range}
                        onChange={(e) => setNewIng({ ...newIng, typical_concentration_range: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label style={{ fontSize: "0.78rem", fontWeight: "bold" }}>Benefits (comma separated)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={newIng.benefits}
                      onChange={(e) => setNewIng({ ...newIng, benefits: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={addingIng} style={{ width: "max-content", padding: "0.5rem 1.25rem" }}>
                    {addingIng ? "Saving..." : "Save Ingredient"}
                  </button>
                </form>
              )}
            </div>

            {/* Ingredients Table */}
            <div className="admin-card">
              <h2 className="admin-card-title">Active Ingredients Database Records</h2>
              <div className="admin-data-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Ingredient Name</th>
                      <th>Category</th>
                      <th>Benefits</th>
                      <th>Concerns Addressed</th>
                      <th>Concentration</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", color: "#718096", padding: "1.5rem" }}>
                          No results
                        </td>
                      </tr>
                    ) : (
                      ingredients.map((ing) => (
                        <tr key={ing.id}>
                          <td><strong>{ing.name}</strong></td>
                          <td>{ing.category}</td>
                          <td style={{ fontSize: "0.78rem", color: "#4A5568" }}>
                            {ing.benefits?.join(", ")}
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "#4A5568" }}>
                            {ing.common_concerns_addressed?.join(", ")}
                          </td>
                          <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {ing.typical_concentration_range || "N/A"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="admin-btn"
                              style={{ color: "#E53E3E", background: "transparent", border: "none", cursor: "pointer", fontWeight: "bold" }}
                              onClick={() => handleDeleteIngredient(ing.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DERMATOLOGISTS TAB */}
        {activeTab === "dermatologists" && (
          <div className="admin-card">
            <h2 className="admin-card-title" style={{ marginBottom: "1rem" }}>Dermatologist Clinic Registrations</h2>
            
            <div className="admin-data-table-container">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Specialist Name</th>
                    <th>Clinic Name</th>
                    <th>Contact Info</th>
                    <th>Address</th>
                    <th>Website</th>
                    <th>Intake</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dermatologists.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", color: "#718096", padding: "1.5rem" }}>
                        No data yet
                      </td>
                    </tr>
                  ) : (
                    dermatologists.map((derma) => {
                      const isEditing = editingDermaId === derma.id;
                      return (
                        <tr key={derma.id}>
                          <td>
                            <strong>{derma.full_name}</strong>
                            <div style={{ fontSize: "0.75rem", color: "#718096" }}>{derma.email}</div>
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="admin-input"
                                value={editForm.clinic_name}
                                onChange={(e) => setEditForm({ ...editForm, clinic_name: e.target.value })}
                              />
                            ) : (
                              derma.clinic_name || "—"
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="admin-input"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              />
                            ) : (
                              derma.phone || "—"
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="admin-input"
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              />
                            ) : (
                              derma.address || "—"
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                className="admin-input"
                                value={editForm.website}
                                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                              />
                            ) : derma.website ? (
                              <a href={derma.website} target="_blank" rel="noopener noreferrer" style={{ color: "#3F6F5E", fontWeight: "600" }}>
                                Link
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editForm.accepting_new_patients}
                                  onChange={(e) => setEditForm({ ...editForm, accepting_new_patients: e.target.checked })}
                                />
                                <span style={{ fontSize: "0.75rem" }}>Open</span>
                              </label>
                            ) : (
                              <span className={`admin-status-badge ${derma.accepting_new_patients ? "active" : "suspended"}`}>
                                {derma.accepting_new_patients ? "Open" : "Closed"}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                                <button
                                  className="admin-btn admin-btn-primary"
                                  onClick={() => handleDermaSave(derma.id)}
                                  style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                                >
                                  Save
                                </button>
                                <button
                                  className="admin-btn admin-btn-secondary"
                                  onClick={() => setEditingDermaId(null)}
                                  style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                className="admin-btn admin-btn-secondary"
                                onClick={() => startEditingDerma(derma)}
                                style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
