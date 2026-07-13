import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

export default function ConsultantProfile() {
  const [form, setForm] = useState({
    phone: "",
    organization_name: "",
    specialization: "",
    bio: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api
      .get("/workspace/consultant-profile")
      .then((res) => setForm((current) => ({ ...current, ...res.data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.put("/workspace/consultant-profile", form);
      setStatus({ type: "ok", text: "Consultant profile saved successfully." });
    } catch {
      setStatus({ type: "error", text: "Couldn't save your consultant profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading consultant profile…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Consultant workspace"
        title="Consultant Profile"
        description="This profile is separated from user and dermatologist pages and is visible only inside the consultant workspace."
      />

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-section">
          <h3 className="form-section-title">Professional details</h3>
          <div className="field">
            <label htmlFor="organization_name">Organization or brand</label>
            <input id="organization_name" name="organization_name" value={form.organization_name || ""} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="specialization">Specialization</label>
            <input id="specialization" name="specialization" value={form.specialization || ""} onChange={handleChange} placeholder="e.g. barrier repair, acne support" />
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" rows="4" value={form.bio || ""} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Contact</h3>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone || ""} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" value={form.website || ""} onChange={handleChange} placeholder="https://example.com" />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save consultant profile"}
          </button>
          {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}
        </div>
      </form>
    </div>
  );
}
