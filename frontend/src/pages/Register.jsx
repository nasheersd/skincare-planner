import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import RitualRing from "../components/RitualRing";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dermatologist extra fields
  const [specialty, setSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);

  // Consultant extra fields
  const [specialization, setSpecialization] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [consultantPhone, setConsultantPhone] = useState("");
  const [consultantWebsite, setConsultantWebsite] = useState("");
  const [consultantBio, setConsultantBio] = useState("");

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Create main user account
      await register(fullName, email, password, role);

      // 2. Log in to establish current session (JWT token set in headers via axios interceptor)
      const loggedInUser = await login(email, password);

      // 3. Handle dermatologist profile setup and file upload
      if (role === "dermatologist") {
        let certificateUrl = null;

        // Upload certificate if provided
        if (certificateFile) {
          const formData = new FormData();
          formData.append("file", certificateFile);
          try {
            const uploadRes = await api.post("/workspace/upload-certificate", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            certificateUrl = uploadRes.data.url;
          } catch (uploadErr) {
            console.error("Certificate upload failed", uploadErr);
            throw new Error("User created, but certificate upload failed. You can upload it in your profile.");
          }
        }

        // Upsert dermatologist profile
        await api.put("/workspace/dermatologist-profile", {
          phone: phone || null,
          clinic_name: clinicName || null,
          specialty: specialty || null,
          bio: bio || null,
          address: address || null,
          website: website || null,
          accepting_new_patients: true,
          certificate_url: certificateUrl,
        });

        setSuccess(true);
        navigate("/dermatologist/dashboard", { replace: true });
      } 
      // 4. Handle consultant profile setup
      else if (role === "skincare_consultant") {
        await api.put("/workspace/consultant-profile", {
          phone: consultantPhone || null,
          organization_name: organizationName || null,
          specialization: specialization || null,
          bio: consultantBio || null,
          website: consultantWebsite || null,
        });

        setSuccess(true);
        navigate("/consultant/dashboard", { replace: true });
      } 
      // 5. Standard user setup
      else {
        setSuccess(true);
        navigate("/skin-profile", { replace: true });
      }
    } catch (err) {
      setError(err.message || err.response?.data?.detail || "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <RitualRing size={340} progress={0.4} color="var(--color-accent-tint)" trackColor="transparent" />
      <div className="auth-card" style={{ maxWidth: "540px", margin: "2rem auto" }}>
        <div className="auth-eyebrow">Get started</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Set up your workspace in a few minutes.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password <span className="hint">min 12 characters</span></label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} maxLength={72} />
          </div>
          <div className="field">
            <label htmlFor="role">I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Skincare user</option>
              <option value="skincare_consultant">Skincare consultant</option>
              <option value="dermatologist">Dermatologist</option>
            </select>
          </div>

          {/* Conditional Dermatologist Fields */}
          {role === "dermatologist" && (
            <div className="form-section-highlight card" style={{ padding: "1.25rem", margin: "1.5rem 0", background: "var(--color-bg-card-hover)" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-gold)", fontSize: "1.1rem" }}>Dermatologist Professional Details</h3>
              <div className="field">
                <label htmlFor="specialty">Specialty / Specialization *</label>
                <input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Pediatric, Cosmetic, Clinical" required />
              </div>
              <div className="field">
                <label htmlFor="clinicName">Clinic Name</label>
                <input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="e.g. Skin Care Center" />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 (555) 123-4567" />
              </div>
              <div className="field">
                <label htmlFor="address">Address</label>
                <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Medical Way" />
              </div>
              <div className="field">
                <label htmlFor="website">Website</label>
                <input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
              </div>
              <div className="field">
                <label htmlFor="bio">Professional Bio</label>
                <textarea id="bio" rows="3" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell patients about your background and experience..." />
              </div>
              <div className="field">
                <label htmlFor="certificate">Upload Certificate (PDF / Image) *</label>
                <input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required />
                <span className="hint">Required for registration verification. Acceptable formats: PDF, JPG, PNG.</span>
              </div>
            </div>
          )}

          {/* Conditional Consultant Fields */}
          {role === "skincare_consultant" && (
            <div className="form-section-highlight card" style={{ padding: "1.25rem", margin: "1.5rem 0", background: "var(--color-bg-card-hover)" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "var(--color-gold)", fontSize: "1.1rem" }}>Consultant Professional Details</h3>
              <div className="field">
                <label htmlFor="specialization">Specialization *</label>
                <input id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Acne consultation, anti-aging" required />
              </div>
              <div className="field">
                <label htmlFor="organizationName">Organization / Brand Name</label>
                <input id="organizationName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. Glow Aesthetics" />
              </div>
              <div className="field">
                <label htmlFor="consultantPhone">Phone Number</label>
                <input id="consultantPhone" value={consultantPhone} onChange={(e) => setConsultantPhone(e.target.value)} placeholder="e.g. +1 (555) 987-6543" />
              </div>
              <div className="field">
                <label htmlFor="consultantWebsite">Website</label>
                <input id="consultantWebsite" type="url" value={consultantWebsite} onChange={(e) => setConsultantWebsite(e.target.value)} placeholder="https://example.com" />
              </div>
              <div className="field">
                <label htmlFor="consultantBio">Consultant Bio</label>
                <textarea id="consultantBio" rows="3" value={consultantBio} onChange={(e) => setConsultantBio(e.target.value)} placeholder="Describe your skincare consultation approach..." />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || success}>
            {loading ? "Creating account…" : "Create account"}
          </button>
          {error && <div className="status-msg error" style={{ marginTop: "1rem" }}>{error}</div>}
          {success && <div className="status-msg ok" style={{ marginTop: "1rem" }}>Account created successfully! Redirecting...</div>}
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
