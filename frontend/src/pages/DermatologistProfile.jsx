import { useEffect, useState } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

export default function DermatologistProfile() {
  const [form, setForm] = useState({
    phone: "",
    clinic_name: "",
    specialty: "",
    bio: "",
    address: "",
    website: "",
    accepting_new_patients: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api
      .get("/workspace/dermatologist-profile")
      .then((res) => setForm((current) => ({ ...current, ...res.data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.put("/workspace/dermatologist-profile", form);
      setStatus({ type: "ok", text: "Dermatologist profile saved successfully." });
    } catch {
      setStatus({ type: "error", text: "Couldn't save your dermatologist profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading dermatologist profile…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dermatologist workspace"
        title="Dermatologist Profile"
        description="This professional profile is separated from patient and consultant pages."
      />

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-section">
          <h3 className="form-section-title">Professional details</h3>
          <div className="field">
            <label htmlFor="clinic_name">Clinic name</label>
            <input id="clinic_name" name="clinic_name" value={form.clinic_name || ""} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="specialty">Specialty</label>
            <input id="specialty" name="specialty" value={form.specialty || ""} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" rows="4" value={form.bio || ""} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="address">Address</label>
            <input id="address" name="address" value={form.address || ""} onChange={handleChange} />
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
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="accepting_new_patients"
              checked={Boolean(form.accepting_new_patients)}
              onChange={handleChange}
            />
            <span>Accepting new patients</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save dermatologist profile"}
          </button>
          {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}
        </div>
      </form>
    </div>
  );
}
