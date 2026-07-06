import { useEffect, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";

function ContactDetail({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="contact-row">
      <span className="contact-label">{label}</span>
      {href ? (
        <a href={href} className="contact-value contact-link">{value}</a>
      ) : (
        <span className="contact-value">{value}</span>
      )}
    </div>
  );
}

function DermatologistCard({ doctor, isAssigned, onSelect, selecting }) {
  return (
    <div className={`card contact-card${isAssigned ? " contact-card-assigned" : ""}`}>
      <div className="contact-card-header">
        <div>
          <h3>{doctor.full_name}</h3>
          {doctor.specialty && <p className="contact-specialty">{doctor.specialty}</p>}
        </div>
        {isAssigned && <span className="eyebrow eyebrow-inline">Your contact</span>}
      </div>

      {doctor.bio && <p className="contact-bio">{doctor.bio}</p>}

      <div className="contact-details">
        <ContactDetail label="Clinic" value={doctor.clinic_name} />
        <ContactDetail label="Email" value={doctor.email} href={`mailto:${doctor.email}`} />
        <ContactDetail label="Phone" value={doctor.phone} href={doctor.phone ? `tel:${doctor.phone.replace(/[^\d+]/g, "")}` : undefined} />
      </div>

      {!isAssigned && onSelect && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onSelect(doctor.id)}
          disabled={selecting}
        >
          {selecting ? "Assigning…" : "Set as my dermatologist"}
        </button>
      )}
    </div>
  );
}

export default function DermatologistContact() {
  const [dermatologists, setDermatologists] = useState([]);
  const [assigned, setAssigned] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [status, setStatus] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, assignedRes] = await Promise.all([
        api.get("/dermatologists/"),
        api.get("/users/me/dermatologist").catch(() => ({ data: null })),
      ]);
      setDermatologists(listRes.data);
      setAssigned(assignedRes.data);
    } catch {
      setStatus({ type: "error", text: "Couldn't load dermatologist contacts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = async (dermatologistId) => {
    setSelecting(true);
    setStatus(null);
    try {
      const res = await api.put("/users/me/dermatologist", { dermatologist_id: dermatologistId });
      setAssigned(res.data);
      setStatus({ type: "ok", text: "Dermatologist assigned as your contact." });
    } catch {
      setStatus({ type: "error", text: "Couldn't assign dermatologist. Please try again." });
    } finally {
      setSelecting(false);
    }
  };

  if (loading) return <LoadingState label="Loading dermatologist contacts…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Expert support"
        title="Dermatologist Contact"
        description="Connect with a licensed dermatologist for professional guidance on your skincare journey."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      {assigned && (
        <section className="section">
          <h2 className="section-title">Your dermatologist</h2>
          <DermatologistCard doctor={assigned} isAssigned />
        </section>
      )}

      <section className="section">
        <h2 className="section-title">
          {assigned ? "Other available dermatologists" : "Available dermatologists"}
        </h2>
        {dermatologists.length === 0 ? (
          <div className="card empty-state">
            <h3>No dermatologists available yet</h3>
            <p>Check back soon — licensed dermatologists will be listed here for you to contact.</p>
          </div>
        ) : (
          <div className="contact-grid">
            {dermatologists
              .filter((d) => d.id !== assigned?.id)
              .map((doctor) => (
                <DermatologistCard
                  key={doctor.id}
                  doctor={doctor}
                  isAssigned={false}
                  onSelect={handleSelect}
                  selecting={selecting}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
