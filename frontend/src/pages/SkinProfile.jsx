import { useEffect, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"];

export default function SkinProfile() {
  const [form, setForm] = useState({
    age: "",
    gender: "",
    skin_type: "normal",
    skin_concerns: "",
    allergies: "",
    skin_sensitivities: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/skin-profile/")
      .then((res) => setForm((f) => ({ ...f, ...res.data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.put("/skin-profile/", { ...form, age: form.age ? Number(form.age) : null });
      setStatus({ type: "ok", text: "Profile saved successfully." });
    } catch {
      setStatus({ type: "error", text: "Couldn't save your profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading your profile…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Your foundation"
        title="Skin Profile"
        description="This tells the app who it's building a routine for."
      />

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-section">
          <h3 className="form-section-title">Basic info</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="age">Age</label>
              <input id="age" name="age" type="number" min="1" max="120" value={form.age || ""} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="gender">Gender</label>
              <input id="gender" name="gender" value={form.gender || ""} onChange={handleChange} placeholder="Optional" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Skin details</h3>
          <div className="field">
            <label htmlFor="skin_type">Skin type</label>
            <select id="skin_type" name="skin_type" value={form.skin_type || "normal"} onChange={handleChange}>
              {SKIN_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="skin_concerns">Skin concerns <span className="hint">comma-separated</span></label>
            <input id="skin_concerns" name="skin_concerns" value={form.skin_concerns || ""} onChange={handleChange} placeholder="e.g. acne, dullness, redness" />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Sensitivities & allergies</h3>
          <div className="field">
            <label htmlFor="allergies">Allergies <span className="hint">comma-separated</span></label>
            <input id="allergies" name="allergies" value={form.allergies || ""} onChange={handleChange} placeholder="e.g. fragrance, nuts" />
          </div>
          <div className="field">
            <label htmlFor="skin_sensitivities">Sensitivities <span className="hint">comma-separated</span></label>
            <input id="skin_sensitivities" name="skin_sensitivities" value={form.skin_sensitivities || ""} onChange={handleChange} placeholder="e.g. sun, alcohol-based products" />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}
        </div>
      </form>
    </div>
  );
}
