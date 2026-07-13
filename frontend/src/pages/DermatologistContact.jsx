import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

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
        <ContactDetail label="Address" value={doctor.address} />
        <ContactDetail label="Email" value={doctor.email} href={`mailto:${doctor.email}`} />
        <ContactDetail label="Phone" value={doctor.phone} href={doctor.phone ? `tel:${doctor.phone.replace(/[^\d+]/g, "")}` : undefined} />
        <ContactDetail
          label="Website"
          value={doctor.website?.startsWith("http") ? "Visit website" : doctor.website}
          href={doctor.website?.startsWith("http") ? doctor.website : doctor.website?.startsWith("mailto:") ? doctor.website : undefined}
        />
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
  const [requests, setRequests] = useState([]);
  const [progressEntries, setProgressEntries] = useState([]);
  const [thread, setThread] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [status, setStatus] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, assignedRes, requestsRes, progressRes] = await Promise.all([
        api.get("/dermatologists/"),
        api.get("/users/me/dermatologist").catch(() => ({ data: null })),
        api.get("/appointments/requests/me").catch(() => ({ data: [] })),
        api.get("/progress/").catch(() => ({ data: [] })),
      ]);
      setDermatologists(listRes.data);
      setAssigned(assignedRes.data);
      setRequests(requestsRes.data);
      setProgressEntries(progressRes.data);
    } catch {
      setStatus({ type: "error", text: "Couldn't load dermatologist contacts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!assigned?.id) {
      setThread([]);
      return;
    }

    const loadThread = async () => {
      setThreadLoading(true);
      try {
        const res = await api.get("/workspace/my-dermatologist/messages");
        setThread(res.data);
      } catch {
        setStatus((current) => current || { type: "error", text: "Couldn't load messages with your dermatologist." });
      } finally {
        setThreadLoading(false);
      }
    };

    loadThread();
  }, [assigned?.id]);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!assigned || !messageBody.trim()) return;

    setSendingMessage(true);
    setStatus(null);
    try {
      const res = await api.post("/workspace/my-dermatologist/messages", {
        body: messageBody.trim(),
      });
      setThread((current) => [...current, res.data]);
      setMessageBody("");
      setStatus({ type: "ok", text: "Message sent to your dermatologist." });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.detail || "Couldn't send your message.",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAppointmentRequest = async (e) => {
    e.preventDefault();
    setSendingRequest(true);
    setStatus(null);
    try {
      const res = await api.post("/appointments/requests", {
        request_message: requestMessage.trim() || null,
      });
      setRequests((current) => [res.data, ...current]);
      setRequestMessage("");
      setStatus({ type: "ok", text: "Appointment request sent to your dermatologist." });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.detail || "Couldn't send your appointment request.",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) return <LoadingState label="Loading dermatologist contacts…" />;

  const hasPendingRequest = requests.some(
    (request) =>
      request.status === "pending" &&
      request.dermatologist_user_id === assigned?.id
  );
  const recentProgressEntries = useMemo(() => progressEntries.slice(0, 3), [progressEntries]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Expert support"
        title="Dermatologist Contact"
        description="Connect with a licensed dermatologist from a patient-only page. Consultant and dermatologist workspaces stay separated and private."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      {assigned && (
        <section className="section">
          <h2 className="section-title">Your dermatologist</h2>
          <DermatologistCard doctor={assigned} isAssigned />
        </section>
      )}

      {assigned && (
        <section className="section">
          <h2 className="section-title">Appointment request</h2>
          <div className="card form-card">
            <h3>Request an appointment</h3>
            <p className="stat-note">
              Send a simple request to {assigned.full_name}. They can accept or decline it from their workspace.
            </p>
            <form onSubmit={handleAppointmentRequest}>
              <div className="field">
                <label htmlFor="appointmentMessage">Message for your dermatologist</label>
                <textarea
                  id="appointmentMessage"
                  rows="4"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Share a short note about what you need help with."
                  maxLength={1000}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sendingRequest || hasPendingRequest}
              >
                {sendingRequest ? "Sending request…" : hasPendingRequest ? "Pending request already sent" : "Send appointment request"}
              </button>
            </form>
          </div>
        </section>
      )}

      {assigned && (
        <section className="section">
          <div className="section-heading-row">
            <h2 className="section-title">Your progress snapshot</h2>
            <Link to="/progress" className="btn btn-secondary">
              Open full progress tracker
            </Link>
          </div>
          <div className="card">
            <p className="stat-note">
              Your assigned dermatologist can review the entries below from their private patient progress workspace.
            </p>
            {recentProgressEntries.length === 0 ? (
              <div className="empty-chat">
                <h3>No progress entries yet</h3>
                <p>Add your first progress update so your dermatologist can track your skin journey.</p>
              </div>
            ) : (
              <div className="progress-preview-list">
                {recentProgressEntries.map((entry) => (
                  <div key={entry.id} className="progress-preview-row">
                    <div>
                      <strong>{formatDate(entry.entry_date)}</strong>
                      <p>{entry.notes || "No notes added."}</p>
                    </div>
                    <div className="progress-preview-stats">
                      <span>Hydration: {entry.hydration_score ?? "-"}</span>
                      <span>Breakouts: {entry.breakout_count ?? "-"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Messages with your dermatologist</h2>
        {!assigned ? (
          <div className="card empty-state">
            <h3>Assign a dermatologist first</h3>
            <p>Once you choose a dermatologist, you can send direct messages and share progress updates here.</p>
          </div>
        ) : (
          <div className="card">
            {threadLoading ? (
              <LoadingState label="Loading your conversation…" />
            ) : thread.length === 0 ? (
              <div className="empty-chat">
                <h3>No messages yet</h3>
                <p>Send your first message to start the conversation with {assigned.full_name}.</p>
              </div>
            ) : (
              <div className="message-thread">
                {thread.map((message) => (
                  <div
                    key={message.id}
                    className={`message-bubble${message.sender_user_id === assigned.id ? " incoming" : " outgoing"}`}
                  >
                    <strong>{message.sender_name}</strong>
                    <p>{message.body}</p>
                    <span>{new Date(message.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="message-form">
              <div className="field">
                <label htmlFor="dermatologistMessage">Send a message</label>
                <textarea
                  id="dermatologistMessage"
                  rows="3"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Ask a follow-up question or share a progress update."
                  maxLength={2000}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={sendingMessage || !messageBody.trim()}>
                {sendingMessage ? "Sending…" : "Send message"}
              </button>
            </form>
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Your request history</h2>
        {requests.length === 0 ? (
          <div className="card empty-state">
            <h3>No appointment requests yet</h3>
            <p>Once you send a request to your assigned dermatologist, it will show up here with its current status.</p>
          </div>
        ) : (
          <div className="appointment-grid">
            {requests.map((request) => (
              <div key={request.id} className="card appointment-card">
                <div className="appointment-card-header">
                  <div>
                    <h3>{request.dermatologist_name}</h3>
                    <p className="stat-note">{request.dermatologist_email}</p>
                  </div>
                  <span className={`status-pill status-${request.status}`}>{request.status}</span>
                </div>
                <div className="appointment-meta">
                  <span>Sent on {new Date(request.created_at).toLocaleString()}</span>
                  {request.reviewed_at && <span>Reviewed on {new Date(request.reviewed_at).toLocaleString()}</span>}
                </div>
                <div className="appointment-copy">
                  <strong>Your message</strong>
                  <p>{request.request_message || "No message provided."}</p>
                </div>
                {request.response_message && (
                  <div className="appointment-copy">
                    <strong>Dermatologist response</strong>
                    <p>{request.response_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

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
