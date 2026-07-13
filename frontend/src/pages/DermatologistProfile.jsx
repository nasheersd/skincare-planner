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
    certificate_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseURL = api.defaults.baseURL || "http://localhost:8000/api";
    const serverRoot = baseURL.replace(/\/api$/, "");
    return `${serverRoot}${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      let updatedForm = { ...form };

      if (certificateFile) {
        const formData = new FormData();
        formData.append("file", certificateFile);
        const uploadRes = await api.post("/workspace/upload-certificate", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedForm.certificate_url = uploadRes.data.url;
        setForm((current) => ({ ...current, certificate_url: uploadRes.data.url }));
        setCertificateFile(null); // Clear selected file
      }

      await api.put("/workspace/dermatologist-profile", updatedForm);
      setStatus({ type: "ok", text: "Dermatologist profile saved successfully." });
    } catch (err) {
      setStatus({ type: "error", text: err.response?.data?.detail || "Couldn't save your dermatologist profile." });
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
          <h3 className="form-section-title">Contact & Verification</h3>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone || ""} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" value={form.website || ""} onChange={handleChange} placeholder="https://example.com" />
          </div>
          
          <div className="field">
            <label htmlFor="certificate">Upload Certificate (PDF / Image)</label>
            <input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
            <span className="hint">Upload a medical certificate or credential for verification.</span>
            
            {form.certificate_url && (
              <div style={{ marginTop: "0.75rem" }}>
                <span className="hint">Current Verification Document: </span>
                <a 
                  href={getFullUrl(form.certificate_url)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="contact-link"
                  style={{ display: "inline-block", fontWeight: "bold" }}
                >
                  View Certificate ↗
                </a>
              </div>
            )}
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
