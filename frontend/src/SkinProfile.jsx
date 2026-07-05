import { useEffect, useState } from "react";
import api from "../api/axios";

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

  useEffect(() => {
    api.get("/skin-profile/").then((res) => setForm((f) => ({ ...f, ...res.data }))).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/skin-profile/", { ...form, age: form.age ? Number(form.age) : null });
      setStatus({ type: "ok", text: "Profile saved." });
    } catch {
      setStatus({ type: "error", text: "Couldn't save your profile. Please try again." });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Your foundation</div>
        <h1>Skin Profile</h1>
        <p>This tells the app who it's building a routine for.</p>
      </div>

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="field">
          <label htmlFor="age">Age</label>
          <input id="age" name="age" type="number" value={form.age || ""} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="gender">Gender</label>
          <input id="gender" name="gender" value={form.gender || ""} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="skin_type">Skin type</label>
          <select id="skin_type" name="skin_type" value={form.skin_type || "normal"} onChange={handleChange}>
            {SKIN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="skin_concerns">Skin concerns <span className="hint">comma-separated</span></label>
          <input id="skin_concerns" name="skin_concerns" value={form.skin_concerns || ""} onChange={handleChange} placeholder="acne, dullness" />
        </div>
        <div className="field">
          <label htmlFor="allergies">Allergies <span className="hint">comma-separated</span></label>
          <input id="allergies" name="allergies" value={form.allergies || ""} onChange={handleChange} placeholder="fragrance, nuts" />
        </div>
        <div className="field">
          <label htmlFor="skin_sensitivities">Sensitivities <span className="hint">comma-separated</span></label>
          <input id="skin_sensitivities" name="skin_sensitivities" value={form.skin_sensitivities || ""} onChange={handleChange} placeholder="sun, alcohol-based products" />
        </div>
        <button type="submit" className="btn btn-primary">Save profile</button>
        {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}
      </form>
    </div>
  );
}