import { useState } from "react";
import api from "../api/axios";

export default function SkinAssessment() {
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    sleep_hours: "",
    water_intake_liters: "",
    exercise_minutes: "",
    stress_level: 3,
    environmental_exposure: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/lifestyle/", {
        ...form,
        sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null,
        water_intake_liters: form.water_intake_liters ? Number(form.water_intake_liters) : null,
        exercise_minutes: form.exercise_minutes ? Number(form.exercise_minutes) : null,
        stress_level: Number(form.stress_level),
      });
      setStatus("Lifestyle entry logged!");
    } catch (err) {
      setStatus(err.response?.data?.detail || "Failed to log entry.");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto" }}>
      <h2>Skin Assessment - Lifestyle Check-in</h2>
      <p>This feeds the AI recommendation engine in later milestones. No AI analysis happens yet.</p>
      <form onSubmit={handleSubmit}>
        <label>Date <input name="entry_date" type="date" value={form.entry_date} onChange={handleChange} /></label>
        <label>Sleep (hours) <input name="sleep_hours" type="number" step="0.5" value={form.sleep_hours} onChange={handleChange} /></label>
        <label>Water Intake (liters) <input name="water_intake_liters" type="number" step="0.1" value={form.water_intake_liters} onChange={handleChange} /></label>
        <label>Exercise (minutes) <input name="exercise_minutes" type="number" value={form.exercise_minutes} onChange={handleChange} /></label>
        <label>Stress Level (1-5)
          <input name="stress_level" type="range" min="1" max="5" value={form.stress_level} onChange={handleChange} />
          {form.stress_level}
        </label>
        <label>Environmental Exposure <input name="environmental_exposure" value={form.environmental_exposure} onChange={handleChange} placeholder="pollution, sun, AC" /></label>
        <button type="submit">Log Entry</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
