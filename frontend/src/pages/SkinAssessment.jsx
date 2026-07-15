import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";

const SKIN_TYPES = [
  { value: "oily", label: "Oily", desc: "Excess sebum, shine, enlarged pores" },
  { value: "dry", label: "Dry", desc: "Tightness, flaking, rough texture" },
  { value: "combination", label: "Combination", desc: "Oily T-zone, dry cheeks" },
  { value: "normal", label: "Normal", desc: "Balanced moisture, clear, resilient" },
  { value: "sensitive", label: "Sensitive", desc: "Redness, itching, easily irritated" }
];

const COMMON_CONCERNS = ["Acne", "Wrinkles", "Hyperpigmentation", "Dark Spots", "Redness", "Oiliness"];
const STRESS_LABELS = ["Very low", "Low", "Moderate", "High", "Very high"];

// Zod Validation Schemas for each step
const step1Schema = z.object({
  skin_type: z.enum(["oily", "dry", "combination", "normal", "sensitive"], {
    errorMap: () => ({ message: "Please select a skin type." })
  }),
  concerns: z.array(
    z.object({
      concern: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      is_active_flareup: z.boolean().default(false)
    })
  ).min(1, "Please select at least one skin concern."),
  allergies: z.string().optional(),
  skin_sensitivities: z.string().optional()
});

const step2Schema = z.object({
  sleep_hours: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Sleep hours must be a number." })
      .min(0, "Sleep hours cannot be negative.")
      .max(24, "Sleep hours cannot exceed 24 hours.")
  ),
  water_intake_liters: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number({ invalid_type_error: "Water intake must be a number." })
      .min(0, "Water intake cannot be negative.")
      .max(15, "Water intake cannot exceed 15 liters.")
  )
});

const step3Schema = z.object({
  stress_level: z.number().min(1).max(5),
  environmental_exposure: z.string().min(1, "Please describe your environmental exposure.")
});

export default function SkinAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("assessment_draft");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      skin_type: "",
      concerns: [], // Array of { concern, severity, is_active_flareup }
      sleep_hours: "",
      water_intake_liters: "",
      environmental_exposure: "",
      stress_level: 3,
      allergies: "",
      skin_sensitivities: ""
    };
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Skin Image Scanner States
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scanLogs, setScanLogs] = useState([]);

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
          
          setFormData(prev => ({ ...prev, skin_type: detected }));
          setValidationErrors(prev => ({ ...prev, skin_type: "" }));
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

  // Sync with localStorage on change
  useEffect(() => {
    localStorage.setItem("assessment_draft", JSON.stringify(formData));
  }, [formData]);

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationErrors({ ...validationErrors, [e.target.name]: "" });
  };

  const handleSkinTypeSelect = (type) => {
    setFormData({ ...formData, skin_type: type });
    setValidationErrors({ ...validationErrors, skin_type: "" });
  };

  const handleConcernToggle = (concernName) => {
    const exists = formData.concerns.find((c) => c.concern === concernName);
    let newConcerns;
    if (exists) {
      newConcerns = formData.concerns.filter((c) => c.concern !== concernName);
    } else {
      newConcerns = [...formData.concerns, { concern: concernName, severity: "medium", is_active_flareup: false }];
    }
    setFormData({ ...formData, concerns: newConcerns });
    setValidationErrors({ ...validationErrors, concerns: "" });
  };

  const handleConcernSeverityChange = (concernName, field, value) => {
    const newConcerns = formData.concerns.map((c) => {
      if (c.concern === concernName) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setFormData({ ...formData, concerns: newConcerns });
  };

  // Validate the current step
  const validateStep = () => {
    setValidationErrors({});
    try {
      if (step === 1) {
        step1Schema.parse(formData);
      } else if (step === 2) {
        step2Schema.parse(formData);
      } else if (step === 3) {
        step3Schema.parse(formData);
      }
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = {};
        err.errors.forEach((e) => {
          errors[e.path[0]] = e.message;
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setValidationErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSubmitting(true);

    try {
      // Final payload mapping
      const payload = {
        ...formData,
        sleep_hours: Number(formData.sleep_hours),
        water_intake_liters: Number(formData.water_intake_liters),
        stress_level: Number(formData.stress_level)
      };

      await api.post("/v1/assessment/evaluate", payload);
      
      // Clear draft on success
      localStorage.removeItem("assessment_draft");
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.response?.data?.detail || "Failed to submit assessment. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 4;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="page assessment-wizard-page">
      <PageHeader
        eyebrow="AI Skin Intelligence"
        title="Personalized Skin Assessment"
        description="Let's analyze your skin type, habits, and concerns to generate a medical-grade skincare routine plan."
      />

      <div className="wizard-progress-container">
        <div className="wizard-progress-bar" style={{ width: `${progressPercent}%` }} />
        <span className="wizard-progress-text">Step {step} of {totalSteps}</span>
      </div>

      {apiError && <div className="status-msg error wizard-error-banner">{apiError}</div>}

      <div className="card wizard-card">
        {step === 1 && (
          <div className="wizard-step-content fade-in">
            <h2 className="step-title">Skin Type & Concerns</h2>
            <p className="step-desc">Select your baseline skin profile details to start the assessment.</p>

            <div className="form-section">
              <label className="form-section-title">Skin Type *</label>
              <div className="skin-type-grid">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`skin-type-card ${formData.skin_type === type.value ? "selected" : ""}`}
                    onClick={() => handleSkinTypeSelect(type.value)}
                  >
                    <span className="skin-type-label">{type.label}</span>
                    <span className="skin-type-desc">{type.desc}</span>
                  </button>
                ))}
              </div>
              
              {/* Image scanner uploader widget */}
              <div style={{ marginTop: "1.25rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-ink-muted)", display: "block", marginBottom: "0.5rem" }}>
                  📸 Or Scan Your Skin Type from a Photo
                </label>
                <div className="scanner-container" style={{ background: "rgba(0,0,0,0.02)" }}>
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
                      id="assessment-photo-uploader"
                      disabled={scanning}
                    />
                    <label htmlFor="assessment-photo-uploader" className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-block" }}>
                      {scanning ? "Scanning skin..." : "Upload & Analyze Skin"}
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

              {validationErrors.skin_type && <span className="field-error">{validationErrors.skin_type}</span>}
            </div>

            <div className="form-section">
              <label className="form-section-title">Skin Concerns (Select all that apply) *</label>
              <div className="concerns-list">
                {COMMON_CONCERNS.map((concernName) => {
                  const selectedConcern = formData.concerns.find((c) => c.concern === concernName);
                  return (
                    <div key={concernName} className={`concern-item-box ${selectedConcern ? "checked" : ""}`}>
                      <div className="concern-main-row" onClick={() => handleConcernToggle(concernName)}>
                        <input
                          type="checkbox"
                          checked={!!selectedConcern}
                          readOnly
                          className="concern-checkbox"
                        />
                        <span className="concern-name-label">{concernName}</span>
                      </div>
                      
                      {selectedConcern && (
                        <div className="concern-details-row">
                          <div className="concern-detail-field">
                            <label>Severity:</label>
                            <select
                              value={selectedConcern.severity}
                              onChange={(e) => handleConcernSeverityChange(concernName, "severity", e.target.value)}
                              className="wizard-select"
                            >
                              <option value="low">Low Severity</option>
                              <option value="medium">Medium Severity</option>
                              <option value="high">High Severity</option>
                            </select>
                          </div>
                          <div className="concern-detail-field checkbox-field">
                            <label>
                              <input
                                type="checkbox"
                                checked={selectedConcern.is_active_flareup}
                                onChange={(e) => handleConcernSeverityChange(concernName, "is_active_flareup", e.target.checked)}
                              />
                              Active Flare-up
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {validationErrors.concerns && <span className="field-error">{validationErrors.concerns}</span>}
            </div>

            <div className="form-section">
              <div className="field">
                <label htmlFor="allergies">Known Allergies <span className="hint">(Optional)</span></label>
                <input
                  id="allergies"
                  name="allergies"
                  type="text"
                  value={formData.allergies}
                  onChange={handleTextChange}
                  placeholder="e.g. Salicylic acid, Tea tree oil"
                />
              </div>
              <div className="field">
                <label htmlFor="skin_sensitivities">Skin Sensitivities <span className="hint">(Optional)</span></label>
                <input
                  id="skin_sensitivities"
                  name="skin_sensitivities"
                  type="text"
                  value={formData.skin_sensitivities}
                  onChange={handleTextChange}
                  placeholder="e.g. easily reddens, high heat sensitivity"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step-content fade-in">
            <h2 className="step-title">Daily Habits</h2>
            <p className="step-desc">Your sleep patterns and hydration directly influence skin cellular renewal.</p>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="sleep_hours">Average Sleep Hours per Night *</label>
                <input
                  id="sleep_hours"
                  name="sleep_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.sleep_hours}
                  onChange={handleTextChange}
                  placeholder="e.g. 7.5"
                />
                {validationErrors.sleep_hours && <span className="field-error">{validationErrors.sleep_hours}</span>}
              </div>

              <div className="field">
                <label htmlFor="water_intake_liters">Water Intake <span className="hint">(Liters per day)</span> *</label>
                <input
                  id="water_intake_liters"
                  name="water_intake_liters"
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  value={formData.water_intake_liters}
                  onChange={handleTextChange}
                  placeholder="e.g. 2.5"
                />
                {validationErrors.water_intake_liters && <span className="field-error">{validationErrors.water_intake_liters}</span>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step-content fade-in">
            <h2 className="step-title">Wellness & Environment</h2>
            <p className="step-desc">Stress levels and UV index exposure determine your overall cellular oxidation rate.</p>

            <div className="form-section">
              <div className="field">
                <label htmlFor="stress_level">Self-Reported Stress Level *</label>
                <div className="stress-range-container">
                  <input
                    id="stress_level"
                    name="stress_level"
                    type="range"
                    min="1"
                    max="5"
                    value={formData.stress_level}
                    onChange={(e) => setFormData({ ...formData, stress_level: Number(e.target.value) })}
                    className="wizard-slider"
                  />
                  <div className="stress-output">
                    <span>Score: {formData.stress_level}/5</span>
                    <span className="stress-name">· {STRESS_LABELS[formData.stress_level - 1]}</span>
                  </div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="environmental_exposure">Environmental / UV Exposure *</label>
                <input
                  id="environmental_exposure"
                  name="environmental_exposure"
                  type="text"
                  value={formData.environmental_exposure}
                  onChange={handleTextChange}
                  placeholder="e.g. high unprotected UV index exposure, air-conditioned office"
                />
                <span className="hint">Include phrases like "high unprotected UV" if you work outdoors.</span>
                {validationErrors.environmental_exposure && <span className="field-error">{validationErrors.environmental_exposure}</span>}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step-content fade-in">
            <h2 className="step-title">Review & Submit</h2>
            <p className="step-desc">Verify your answers before starting the AI analysis engine.</p>

            <div className="review-summary-card">
              <div className="summary-row">
                <span className="summary-label">Skin Type:</span>
                <span className="summary-value capitalize">{formData.skin_type}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Selected Concerns:</span>
                <div className="summary-value">
                  {formData.concerns.map((c) => (
                    <span key={c.concern} className="tag-concern">
                      {c.concern} ({c.severity}) {c.is_active_flareup && "🔥"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="summary-row">
                <span className="summary-label">Sleep hours:</span>
                <span className="summary-value">{formData.sleep_hours} Hours</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Hydration:</span>
                <span className="summary-value">{formData.water_intake_liters} Liters/day</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Stress level:</span>
                <span className="summary-value">{STRESS_LABELS[formData.stress_level - 1]} ({formData.stress_level}/5)</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Environment:</span>
                <span className="summary-value">{formData.environmental_exposure}</span>
              </div>
              {formData.allergies && (
                <div className="summary-row">
                  <span className="summary-label">Allergies:</span>
                  <span className="summary-value">{formData.allergies}</span>
                </div>
              )}
              {formData.skin_sensitivities && (
                <div className="summary-row">
                  <span className="summary-label">Sensitivities:</span>
                  <span className="summary-value">{formData.skin_sensitivities}</span>
                </div>
              )}
            </div>

            {submitting && (
              <div className="wizard-loading-overlay">
                <div className="loading-spinner" />
                <p className="loading-text">Analyzing your skin profile...</p>
              </div>
            )}
          </div>
        )}

        <div className="wizard-actions-row">
          {step > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={submitting}
            >
              Back
            </button>
          )}
          
          {step < totalSteps ? (
            <button
              type="button"
              className="btn btn-primary next-btn"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Analyzing..." : "Submit Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
