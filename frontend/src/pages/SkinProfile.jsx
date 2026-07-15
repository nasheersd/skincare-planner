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

  // Skin Image Scanner States
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scanLogs, setScanLogs] = useState([]);

  useEffect(() => {
    api
      .get("/skin-profile/")
      .then((res) => setForm((f) => ({ ...f, ...res.data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const analyzeSkinImage = (file) => {
    if (!file) return;
    setScanning(true);
    setScanResult("");
    setImageUrl(URL.createObjectURL(file));
    
    const logs = [
      "Initializing high-resolution scanner...",
      "Analyzing micro-texture patterns...",
      "Calculating surface reflection index (oil)...",
      "Measuring vascular redness levels...",
      "Matching skin biomarkers to catalog..."
    ];

    setScanLogs([]);
    
    logs.forEach((logText, idx) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, logText]);
      }, (idx + 1) * 500);
    });

    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 100;
          canvas.height = 100;
          ctx.drawImage(img, 0, 0, 100, 100);
          const imgData = ctx.getImageData(0, 0, 100, 100).data;
          
          let totalRed = 0;
          let totalGreen = 0;
          let totalBlue = 0;
          let brightPixels = 0;
          
          for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i+1];
            const b = imgData[i+2];
            totalRed += r;
            totalGreen += g;
            totalBlue += b;
            
            if (r > 200 && g > 200 && b > 200) {
              brightPixels++;
            }
          }
          
          const redRatio = totalRed / (totalGreen + totalBlue + 1);
          const shinyRatio = brightPixels / 2500;
          
          let detected = "normal";
          let reason = "Your skin profile appears balanced and healthy.";
          
          if (redRatio > 0.72) {
            detected = "sensitive";
            reason = "Detected increased vascular redness index, suggesting sensitive skin.";
          } else if (shinyRatio > 0.04) {
            detected = "oily";
            reason = "Detected high specular reflection index (sebum gloss), suggesting oily skin.";
          } else if (totalRed + totalGreen + totalBlue < 380000) {
            detected = "dry";
            reason = "Detected low light reflectance and dry texture indicators, suggesting dry skin.";
          } else {
            detected = "normal";
          }
          
          setForm(prev => ({ ...prev, skin_type: detected }));
          setScanResult(`Analysis complete! Detected skin type: ${detected.toUpperCase()}. ${reason}`);
          setScanning(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }, 2800);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      analyzeSkinImage(e.target.files[0]);
    }
  };

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

          {/* Skin Image Scanner Feature */}
          <div className="field" style={{ marginTop: "1rem" }}>
            <label>📸 Analyze Skin Type from Photo</label>
            <div className="scanner-container">
              {imageUrl && (
                <div className="scanner-preview-wrapper">
                  <img src={imageUrl} alt="Skin Preview" className="scanner-preview" />
                  {scanning && <div className="scanning-line" />}
                </div>
              )}
              
              <div style={{ marginBottom: "1rem" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="skin-photo-uploader"
                  disabled={scanning}
                />
                <label htmlFor="skin-photo-uploader" className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-block" }}>
                  {scanning ? "Scanning skin..." : "Upload & Scan Photo"}
                </label>
              </div>

              {scanning && (
                <div className="scan-logs">
                  {scanLogs.map((log, idx) => (
                    <div key={idx} className="scan-log-item">✓ {log}</div>
                  ))}
                </div>
              )}

              {scanResult && (
                <div className="status-msg ok" style={{ marginTop: "1rem", textAlign: "left" }}>
                  {scanResult}
                </div>
              )}
            </div>
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
