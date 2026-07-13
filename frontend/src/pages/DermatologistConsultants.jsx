import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

export default function DermatologistConsultants() {
  const { user } = useAuth();
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState("");
  const [thread, setThread] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const loadConsultants = async () => {
      try {
        const res = await api.get("/workspace/dermatologist/consultants");
        setConsultants(res.data);
        if (res.data.length > 0) {
          setSelectedConsultantId(res.data[0].user_id);
        }
      } catch (err) {
        setStatus({ type: "error", text: "Couldn't load consultants." });
      } finally {
        setLoading(false);
      }
    };

    loadConsultants();
  }, []);

  useEffect(() => {
    if (!selectedConsultantId || !user?.id) {
      setThread([]);
      return;
    }

    const loadThread = async () => {
      setThreadLoading(true);
      try {
        const res = await api.get("/workspace/professional/messages", {
          params: {
            dermatologist_id: user.id,
            consultant_id: selectedConsultantId,
          },
        });
        setThread(res.data);
      } catch (err) {
        setStatus({ type: "error", text: "Couldn't load the message thread with this consultant." });
      } finally {
        setThreadLoading(false);
      }
    };

    loadThread();
  }, [selectedConsultantId, user?.id]);

  const selectedConsultant = useMemo(
    () => consultants.find((c) => c.user_id === selectedConsultantId) || null,
    [consultants, selectedConsultantId]
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedConsultantId || !messageBody.trim() || !user?.id) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await api.post(
        "/workspace/professional/messages",
        { body: messageBody.trim() },
        {
          params: {
            dermatologist_id: user.id,
            consultant_id: selectedConsultantId,
          },
        }
      );
      setThread((current) => [...current, res.data]);
      setMessageBody("");
    } catch (err) {
      setStatus({ type: "error", text: "Couldn't send the message." });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState label="Loading consultant list…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dermatologist workspace"
        title="Consultants Chat"
        description="Communicate directly with registered skincare consultants to coordinate on customer routines and progress updates."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      {consultants.length === 0 ? (
        <div className="card empty-state">
          <h3>No skincare consultants found</h3>
          <p>Consultants will appear here once they register in the system.</p>
        </div>
      ) : (
        <div className="workspace-grid">
          {/* Consultants Sidebar */}
          <aside className="card workspace-sidebar">
            <h3>Skincare Consultants</h3>
            <div className="workspace-list">
              {consultants.map((c) => (
                <button
                  key={c.user_id}
                  type="button"
                  className={`workspace-list-item${c.user_id === selectedConsultantId ? " active" : ""}`}
                  onClick={() => setSelectedConsultantId(c.user_id)}
                >
                  <strong>{c.full_name}</strong>
                  <span>{c.email}</span>
                  {c.specialization && (
                    <span className="workspace-list-note" style={{ color: "var(--color-gold)" }}>
                      Spec: {c.specialization}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Conversation Window */}
          {selectedConsultant && (
            <div className="workspace-main">
              <section className="section" style={{ marginBottom: "1.5rem" }}>
                <div className="card" style={{ borderLeft: "4px solid var(--color-gold)" }}>
                  <div className="appointment-card-header">
                    <div>
                      <span className="eyebrow">Consulting Partner</span>
                      <h3>{selectedConsultant.full_name}</h3>
                      <p className="stat-note">{selectedConsultant.email}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--color-fg-muted)" }}>
                    {selectedConsultant.organization_name && <p><strong>Organization:</strong> {selectedConsultant.organization_name}</p>}
                    {selectedConsultant.specialization && <p><strong>Specialization:</strong> {selectedConsultant.specialization}</p>}
                    {selectedConsultant.bio && <p style={{ fontStyle: "italic", marginTop: "0.5rem" }}>"{selectedConsultant.bio}"</p>}
                  </div>
                </div>
              </section>

              <section className="section">
                <h2 className="section-title">Professional Chat Thread</h2>
                <div className="card">
                  {threadLoading ? (
                    <LoadingState label="Loading conversation history…" />
                  ) : thread.length === 0 ? (
                    <div className="empty-chat">
                      <h3>No messages yet</h3>
                      <p>Send a message to start coordinating with {selectedConsultant.full_name}.</p>
                    </div>
                  ) : (
                    <div className="message-thread">
                      {thread.map((msg) => (
                        <div
                          key={msg.id}
                          className={`message-bubble${msg.sender_user_id === selectedConsultant.user_id ? " incoming" : " outgoing"}`}
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
                      <label htmlFor="consultantMessage">Send a message</label>
                      <textarea
                        id="consultantMessage"
                        rows="3"
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder="Write a message to coordinate care for patients..."
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
