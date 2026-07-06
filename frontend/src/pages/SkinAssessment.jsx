import { useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";

const STRESS_LABELS = ["Very low", "Low", "Moderate", "High", "Very high"];

export default function SkinAssessment() {
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    sleep_hours: "",
    water_intake_liters: "",
    exercise_minutes: "",
    stress_level: 3,
    environmental_exposure: "",
  });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await api.post("/lifestyle/", {
        ...form,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        water_intake_liters: form.water_intake_liters ? Number(form.water_intake_liters) : null,
        exercise_minutes: form.exercise_minutes ? Number(form.exercise_minutes) : null,
        stress_level: Number(form.stress_level),
      });
      setStatus({ type: "ok", text: "Entry logged for today." });
    } catch (err) {
      setStatus({ type: "error", text: err.response?.data?.detail || "Couldn't log this entry." });
    } finally {
      setSaving(false);
    }
  };

  const stressIndex = Number(form.stress_level) - 1;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Daily check-in"
        title="Skin Assessment"
        description="Log your lifestyle habits. This feeds the AI recommendation engine in a later milestone — no analysis happens yet."
      />

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-section">
          <h3 className="form-section-title">Date</h3>
          <div className="field">
            <label htmlFor="entry_date">Entry date</label>
            <input id="entry_date" name="entry_date" type="date" value={form.entry_date} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Daily habits</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sleep_hours">Sleep <span className="hint">hours</span></label>
              <input id="sleep_hours" name="sleep_hours" type="number" step="0.5" min="0" max="24" value={form.sleep_hours} onChange={handleChange} placeholder="7.5" />
            </div>
            <div className="field">
              <label htmlFor="water_intake_liters">Water intake <span className="hint">liters</span></label>
              <input id="water_intake_liters" name="water_intake_liters" type="number" step="0.1" min="0" value={form.water_intake_liters} onChange={handleChange} placeholder="2.0" />
            </div>
            <div className="field">
              <label htmlFor="exercise_minutes">Exercise <span className="hint">minutes</span></label>
              <input id="exercise_minutes" name="exercise_minutes" type="number" min="0" value={form.exercise_minutes} onChange={handleChange} placeholder="30" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Wellness & environment</h3>
          <div className="field">
            <label htmlFor="stress_level">Stress level</label>
            <div className="field-row">
              <input id="stress_level" name="stress_level" type="range" min="1" max="5" value={form.stress_level} onChange={handleChange} />
              <output>{form.stress_level}/5 · {STRESS_LABELS[stressIndex]}</output>
            </div>
          </div>
          <div className="field">
            <label htmlFor="environmental_exposure">Environmental exposure</label>
            <input id="environmental_exposure" name="environmental_exposure" value={form.environmental_exposure} onChange={handleChange} placeholder="e.g. pollution, sun, AC" />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Logging…" : "Log entry"}
          </button>
          {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}
        </div>
      </form>
    </div>
  );
}
