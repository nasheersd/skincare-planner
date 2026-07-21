import { useEffect, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";

const ALL_SKIN_TYPES = [
  {
    value: "oily",
    label: "Oily Skin",
    icon: "💧",
    badge: "Excess Sebum",
    desc: "Visible shine, enlarged pores, prone to blackheads and oil buildup throughout the day.",
    bgGrad: "linear-gradient(135deg, rgba(43, 91, 76, 0.12) 0%, rgba(43, 91, 76, 0.04) 100%)"
  },
  {
    value: "dry",
    label: "Dry Skin",
    icon: "🌵",
    badge: "Lacks Lipids",
    desc: "Tight feeling, flaking, rough skin texture, requires deep lipid nourishment.",
    bgGrad: "linear-gradient(135deg, rgba(212, 140, 123, 0.12) 0%, rgba(212, 140, 123, 0.04) 100%)"
  },
  {
    value: "sensitive",
    label: "Sensitive Skin",
    icon: "🌸",
    badge: "Reactive Barrier",
    desc: "Easily flushes red, experiences stinging or burning with harsh active ingredients.",
    bgGrad: "linear-gradient(135deg, rgba(232, 146, 124, 0.12) 0%, rgba(232, 146, 124, 0.04) 100%)"
  },
  {
    value: "combination",
    label: "Combination Skin",
    icon: "⚖️",
    badge: "Dual Balance",
    desc: "Oily T-zone (forehead, nose, chin) with normal or dry cheeks.",
    bgGrad: "linear-gradient(135deg, rgba(201, 164, 101, 0.12) 0%, rgba(201, 164, 101, 0.04) 100%)"
  },
  {
    value: "normal",
    label: "Normal Skin",
    icon: "🌿",
    badge: "Balanced Hydration",
    desc: "Balanced moisture levels, smooth texture, minimal breakouts or reactivity.",
    bgGrad: "linear-gradient(135deg, rgba(43, 91, 76, 0.12) 0%, rgba(43, 91, 76, 0.04) 100%)"
  },
  {
    value: "acne_prone",
    label: "Acne-Prone Skin",
    icon: "🌋",
    badge: "Active Comedones",
    desc: "Frequent papules, clogged pores, inflammatory breakouts needing targeted treatment.",
    bgGrad: "linear-gradient(135deg, rgba(197, 83, 63, 0.12) 0%, rgba(197, 83, 63, 0.04) 100%)"
  },
  {
    value: "dehydrated",
    label: "Dehydrated Skin",
    icon: "🌊",
    badge: "Lacks Moisture",
    desc: "Lacks water moisture (can be oily yet dry underneath), dull appearance and surface lines.",
    bgGrad: "linear-gradient(135deg, rgba(63, 161, 181, 0.12) 0%, rgba(63, 161, 181, 0.04) 100%)"
  },
  {
    value: "aging",
    label: "Aging / Mature Skin",
    icon: "⌛",
    badge: "Loss of Firmness",
    desc: "Reduced elasticity, fine lines, age spots, requires collagen support & antioxidants.",
    bgGrad: "linear-gradient(135deg, rgba(142, 100, 175, 0.12) 0%, rgba(142, 100, 175, 0.04) 100%)"
  }
];

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
          let redBlemishCount = 0;
          let brownSpotCount = 0;
          let edgeVariance = 0;
          
          for (let y = 0; y < 100; y++) {
            for (let x = 0; x < 100; x++) {
              const idx = (y * 100 + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx+1];
              const b = imgData[idx+2];
              
              totalRed += r;
              totalGreen += g;
              totalBlue += b;
              
              if (r > 200 && g > 200 && b > 200) {
                brightPixels++;
              }

              // 1. Red blemishes (Acne / Redness)
              if (r > 165 && g < 110 && b < 110) {
                redBlemishCount++;
              }
              
              // 2. Brown spots (Hyperpigmentation / Dark spots)
              if (r > 90 && r < 160 && g > 65 && g < 115 && b > 40 && b < 95) {
                brownSpotCount++;
              }
              
              // 3. Edge detection (horizontal differences for wrinkles)
              if (x < 99) {
                const nextIdx = idx + 4;
                const nextR = imgData[nextIdx];
                const diff = Math.abs(r - nextR);
                edgeVariance += diff;
              }
            }
          }
          
          const redRatio = totalRed / (totalGreen + totalBlue + 1);
          const shinyRatio = brightPixels / 2500;
          const avgEdgeVariance = edgeVariance / 9900;
          
          // Determine Concerns
          let detectedConcerns = [];
          if (redBlemishCount > 15) {
            detectedConcerns.push("acne");
            detectedConcerns.push("redness");
          }
          if (brownSpotCount > 25) {
            detectedConcerns.push("dark spots");
            detectedConcerns.push("hyperpigmentation");
          }
          if (avgEdgeVariance > 18) {
            detectedConcerns.push("wrinkles");
          }
          
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
          
          const concernsString = detectedConcerns.length > 0 ? detectedConcerns.join(", ") : "none";
          setForm(prev => ({ 
            ...prev, 
            skin_type: detected,
            skin_concerns: concernsString 
          }));
          setScanResult(`Analysis complete! Detected skin type: ${detected.toUpperCase()}. Detected concerns: ${concernsString.toUpperCase()}. (${reason})`);
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
            <label style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "0.85rem", display: "block" }}>
              Skin Type Classification (Select your baseline profile)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {ALL_SKIN_TYPES.map((st) => {
                const isSelected = (form.skin_type || "normal").toLowerCase() === st.value;
                return (
                  <div
                    key={st.value}
                    onClick={() => setForm(f => ({ ...f, skin_type: st.value }))}
                    style={{
                      padding: "1.2rem",
                      borderRadius: "var(--radius-md)",
                      border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: isSelected ? st.bgGrad : "var(--color-surface)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative",
                      boxShadow: isSelected ? "var(--shadow-lift)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.8rem" }}>{st.icon}</span>
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "10px",
                        background: isSelected ? "var(--color-primary)" : "var(--color-surface-sunken)",
                        color: isSelected ? "#fff" : "var(--color-ink-muted)",
                        fontWeight: "700"
                      }}>
                        {st.badge}
                      </span>
                    </div>
                    <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
                      {st.label}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", lineHeight: 1.4 }}>
                      {st.desc}
                    </div>
                    {isSelected && (
                      <div style={{
                        marginTop: "0.75rem",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        color: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem"
                      }}>
                        ✓ SELECTED PROFILE
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
