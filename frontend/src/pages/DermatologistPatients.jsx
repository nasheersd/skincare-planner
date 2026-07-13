import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function DermatologistPatients() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [thread, setThread] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await api.get("/workspace/dermatologist/patients");
        setPatients(res.data);
        if (res.data.length > 0) {
          setSelectedPatientId(res.data[0].id);
        }
      } catch {
        setStatus({ type: "error", text: "Couldn't load patients for your workspace." });
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      setThread([]);
      return;
    }

    const loadThread = async () => {
      setThreadLoading(true);
      try {
        const res = await api.get(`/workspace/dermatologist/patients/${selectedPatientId}/messages`);
        setThread(res.data);
      } catch {
        setStatus({ type: "error", text: "Couldn't load the message thread for this patient." });
      } finally {
        setThreadLoading(false);
      }
    };

    loadThread();
  }, [selectedPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !messageBody.trim()) return;

    setSending(true);
    setStatus(null);
    try {
      const res = await api.post(`/workspace/dermatologist/patients/${selectedPatientId}/messages`, {
        body: messageBody.trim(),
      });
      setThread((current) => [...current, res.data]);
      setPatients((current) =>
        current.map((patient) =>
          patient.id === selectedPatientId
            ? { ...patient, recent_messages: [...patient.recent_messages.slice(-2), res.data] }
            : patient
        )
      );
      setMessageBody("");
      setStatus({ type: "ok", text: "Message sent to the patient." });
    } catch {
      setStatus({ type: "error", text: "Couldn't send the message to this patient." });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState label="Loading patient workspace…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dermatologist workspace"
        title="Patient Progress & Messages"
        description="Review assigned patient progress and send direct messages from your separated dermatologist page."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      {patients.length === 0 ? (
        <div className="card empty-state">
          <h3>No patients assigned yet</h3>
          <p>Assigned patients and their progress will appear here once users connect to your dermatologist profile.</p>
        </div>
      ) : (
        <div className="workspace-grid">
          <aside className="card workspace-sidebar">
            <h3>Assigned patients</h3>
            <div className="workspace-list">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className={`workspace-list-item${patient.id === selectedPatientId ? " active" : ""}`}
                  onClick={() => setSelectedPatientId(patient.id)}
                >
                  <strong>{patient.full_name}</strong>
                  <span>{patient.email}</span>
                  <span className="workspace-list-note">
                    Appointment: {patient.latest_appointment_status || "none"}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {selectedPatient && (
            <div className="workspace-main">
              <section className="section">
                <div className="card">
                  <div className="appointment-card-header">
                    <div>
                      <h3>{selectedPatient.full_name}</h3>
                      <p className="stat-note">{selectedPatient.email}</p>
                    </div>
                    <span className="eyebrow eyebrow-inline">Assigned patient</span>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-box">
                      <strong>Skin profile</strong>
                      <p>Type: {selectedPatient.skin_profile?.skin_type || "Not set"}</p>
                      <p>Concerns: {selectedPatient.skin_profile?.skin_concerns || "Not set"}</p>
                      <p>Sensitivities: {selectedPatient.skin_profile?.skin_sensitivities || "Not set"}</p>
                    </div>
                    <div className="detail-box">
                      <strong>Recent lifestyle</strong>
                      {selectedPatient.lifestyle_entries.length === 0 ? (
                        <p>No lifestyle entries yet.</p>
                      ) : (
                        selectedPatient.lifestyle_entries.map((entry) => (
                          <p key={entry.id}>
                            {formatDate(entry.entry_date)} · Sleep {entry.sleep_hours ?? "-"}h · Water {entry.water_intake_liters ?? "-"}L · Stress {entry.stress_level ?? "-"}
                          </p>
                        ))
                      )}
                    </div>
                    <div className="detail-box">
                      <strong>Recent progress</strong>
                      {selectedPatient.progress_entries.length === 0 ? (
                        <p>No progress entries yet.</p>
                      ) : (
                        selectedPatient.progress_entries.map((entry) => (
                          <p key={entry.id}>
                            {formatDate(entry.entry_date)} · Hydration {entry.hydration_score ?? "-"} · Breakouts {entry.breakout_count ?? "-"} · {entry.notes || "No notes"}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="section">
                <h2 className="section-title">Messages</h2>
                <div className="card">
                  {threadLoading ? (
                    <LoadingState label="Loading conversation…" />
                  ) : thread.length === 0 ? (
                    <div className="empty-chat">
                      <h3>No messages yet</h3>
                      <p>Send the first message to start the conversation with this patient.</p>
                    </div>
                  ) : (
                    <div className="message-thread">
                      {thread.map((message) => (
                        <div
                          key={message.id}
                          className={`message-bubble${message.sender_user_id === selectedPatient.id ? " incoming" : " outgoing"}`}
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
                      <label htmlFor="patientMessage">Send a message</label>
                      <textarea
                        id="patientMessage"
                        rows="3"
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder="Write guidance or a follow-up note for this patient."
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
