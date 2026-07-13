import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

export default function ConsultantDermatologists() {
  const { user } = useAuth();
  const location = useLocation();
  const preSelectedId = location.state?.preSelectedDermatologistId || "";

  const [dermatologists, setDermatologists] = useState([]);
  const [selectedDermatologistId, setSelectedDermatologistId] = useState("");
  const [thread, setThread] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const loadDermatologists = async () => {
      try {
        const res = await api.get("/workspace/consultant/dermatologists");
        setDermatologists(res.data);
        if (res.data.length > 0) {
          // Use pre-selected ID if provided, otherwise default to first doctor
          const initialId = res.data.some((d) => d.id === preSelectedId)
            ? preSelectedId
            : res.data[0].id;
          setSelectedDermatologistId(initialId);
        }
      } catch (err) {
        setStatus({ type: "error", text: "Couldn't load dermatologists list." });
      } finally {
        setLoading(false);
      }
    };

    loadDermatologists();
  }, [preSelectedId]);

  useEffect(() => {
    if (!selectedDermatologistId || !user?.id) {
      setThread([]);
      return;
    }

    const loadThread = async () => {
      setThreadLoading(true);
      try {
        const res = await api.get("/workspace/professional/messages", {
          params: {
            dermatologist_id: selectedDermatologistId,
            consultant_id: user.id,
          },
        });
        setThread(res.data);
      } catch (err) {
        setStatus({ type: "error", text: "Couldn't load message history." });
      } finally {
        setThreadLoading(false);
      }
    };

    loadThread();
  }, [selectedDermatologistId, user?.id]);

  const selectedDermatologist = useMemo(
    () => dermatologists.find((d) => d.id === selectedDermatologistId) || null,
    [dermatologists, selectedDermatologistId]
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedDermatologistId || !messageBody.trim() || !user?.id) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await api.post(
        "/workspace/professional/messages",
        { body: messageBody.trim() },
        {
          params: {
            dermatologist_id: selectedDermatologistId,
            consultant_id: user.id,
          },
        }
      );
      setThread((current) => [...current, res.data]);
      setMessageBody("");
    } catch (err) {
      setStatus({ type: "error", text: "Couldn't send message. Please try again." });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState label="Loading dermatologists directory…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Consultant workspace"
        title="Dermatologists Directory & Chat"
        description="Connect with qualified dermatologists to consult on skin treatments and progress."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      {dermatologists.length === 0 ? (
        <div className="card empty-state">
          <h3>No dermatologists available</h3>
          <p>Licensed dermatologists will appear here once they complete their professional profile.</p>
        </div>
      ) : (
        <div className="workspace-grid">
          {/* Dermatologists Sidebar */}
          <aside className="card workspace-sidebar">
            <h3>Dermatologists</h3>
            <div className="workspace-list">
              {dermatologists.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`workspace-list-item${d.id === selectedDermatologistId ? " active" : ""}`}
                  onClick={() => setSelectedDermatologistId(d.id)}
                >
                  <strong>{d.full_name}</strong>
                  <span>{d.email}</span>
                  {d.specialty && (
                    <span className="workspace-list-note" style={{ color: "var(--color-gold)" }}>
                      {d.specialty}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Conversation Window */}
          {selectedDermatologist && (
            <div className="workspace-main">
              <section className="section" style={{ marginBottom: "1.5rem" }}>
                <div className="card" style={{ borderLeft: "4px solid var(--color-gold)" }}>
                  <div className="appointment-card-header">
                    <div>
                      <span className="eyebrow">Medical Partner</span>
                      <h3>{selectedDermatologist.full_name}</h3>
                      <p className="stat-note">{selectedDermatologist.email}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>
                    {selectedDermatologist.clinic_name && <p><strong>Clinic:</strong> {selectedDermatologist.clinic_name}</p>}
                    {selectedDermatologist.specialty && <p><strong>Specialty:</strong> {selectedDermatologist.specialty}</p>}
                    {selectedDermatologist.phone && <p><strong>Phone:</strong> {selectedDermatologist.phone}</p>}
                    {selectedDermatologist.bio && <p style={{ fontStyle: "italic", marginTop: "0.5rem" }}>"{selectedDermatologist.bio}"</p>}
                  </div>
                </div>
              </section>

              <section className="section">
                <h2 className="section-title">Professional Chat Thread</h2>
                <div className="card">
                  {threadLoading ? (
                    <LoadingState label="Loading chat history…" />
                  ) : thread.length === 0 ? (
                    <div className="empty-chat">
                      <h3>No messages yet</h3>
                      <p>Send a message to start coordinating care with {selectedDermatologist.full_name}.</p>
                    </div>
                  ) : (
                    <div className="message-thread">
                      {thread.map((msg) => (
                        <div
                          key={msg.id}
                          className={`message-bubble${msg.sender_user_id === selectedDermatologist.id ? " incoming" : " outgoing"}`}
                        >
                          <strong>{msg.sender_name}</strong>
                          <p>{msg.body}</p>
                          <span>{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="message-form">
                    <div className="field">
                      <label htmlFor="dermatologistMessage">Send professional message</label>
                      <textarea
                        id="dermatologistMessage"
                        rows="3"
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder="Coordinate clinical concerns, ask about routines..."
                        maxLength={2000}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={sending || !messageBody.trim()}>
                      {sending ? "Sending…" : "Send message"}
                    </button>
                  </form>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
