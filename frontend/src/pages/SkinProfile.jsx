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
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get("/skin-profile/").then((res) => setForm((f) => ({ ...f, ...res.data }))).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/skin-profile/", { ...form, age: form.age ? Number(form.age) : null });
      setStatus("Saved!");
    } catch {
      setStatus("Failed to save.");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto" }}>
      <h2>Skin Profile</h2>
      <form onSubmit={handleSubmit}>
        <label>Age <input name="age" type="number" value={form.age || ""} onChange={handleChange} /></label>
        <label>Gender <input name="gender" value={form.gender || ""} onChange={handleChange} /></label>
        <label>Skin Type
          <select name="skin_type" value={form.skin_type || "normal"} onChange={handleChange}>
            {SKIN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>Skin Concerns <input name="skin_concerns" value={form.skin_concerns || ""} onChange={handleChange} placeholder="acne, dullness" /></label>
        <label>Allergies <input name="allergies" value={form.allergies || ""} onChange={handleChange} placeholder="fragrance, nuts" /></label>
        <label>Sensitivities <input name="skin_sensitivities" value={form.skin_sensitivities || ""} onChange={handleChange} placeholder="sun, alcohol-based products" /></label>
        <button type="submit">Save Profile</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
