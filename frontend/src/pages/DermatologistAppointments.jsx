import { useEffect, useState } from "react";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";

function AppointmentRequestCard({ request, onReview, busyId }) {
  const isPending = request.status === "pending";

  return (
    <div className="card appointment-card">
      <div className="appointment-card-header">
        <div>
          <h3>{request.patient_name}</h3>
          <p className="stat-note">{request.patient_email}</p>
        </div>
        <span className={`status-pill status-${request.status}`}>{request.status}</span>
      </div>

      <div className="appointment-meta">
        <span>Requested on {new Date(request.created_at).toLocaleString()}</span>
        {request.reviewed_at && <span>Reviewed on {new Date(request.reviewed_at).toLocaleString()}</span>}
      </div>

      <div className="appointment-copy">
        <strong>Patient note</strong>
        <p>{request.request_message || "No message provided."}</p>
      </div>

      {request.response_message && (
        <div className="appointment-copy">
          <strong>Your response</strong>
          <p>{request.response_message}</p>
        </div>
      )}

      {isPending && (
        <div className="appointment-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busyId === request.id}
            onClick={() => onReview(request.id, "accepted")}
          >
            {busyId === request.id ? "Saving…" : "Accept"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busyId === request.id}
            onClick={() => onReview(request.id, "declined")}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

export default function DermatologistAppointments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/appointments/requests/inbox");
      setRequests(res.data);
    } catch {
      setStatus({ type: "error", text: "Couldn't load appointment requests." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (requestId, decision) => {
    setBusyId(requestId);
    setStatus(null);
    try {
      const res = await api.patch(`/appointments/requests/${requestId}`, {
        status: decision,
      });
      setRequests((current) =>
        current.map((item) => (item.id === requestId ? res.data : item))
      );
      setStatus({
        type: "ok",
        text: `Appointment request ${decision === "accepted" ? "accepted" : "declined"}.`,
      });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.detail || "Couldn't update this appointment request.",
      });
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <LoadingState label="Loading appointment requests…" />;

  const pendingRequests = requests.filter((item) => item.status === "pending");
  const reviewedRequests = requests.filter((item) => item.status !== "pending");

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dermatologist workspace"
        title="Appointment Requests"
        description="Review pending requests from patients connected to your dermatologist profile."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      <section className="section">
        <h2 className="section-title">Pending requests</h2>
        {pendingRequests.length === 0 ? (
          <div className="card empty-state">
            <h3>No pending requests</h3>
            <p>New patient appointment requests will appear here as soon as they are submitted.</p>
          </div>
        ) : (
          <div className="appointment-grid">
            {pendingRequests.map((request) => (
              <AppointmentRequestCard key={request.id} request={request} onReview={handleReview} busyId={busyId} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Reviewed requests</h2>
        {reviewedRequests.length === 0 ? (
          <div className="card empty-state">
            <h3>No reviewed requests yet</h3>
            <p>Accepted and declined requests will be listed here after you review them.</p>
          </div>
        ) : (
          <div className="appointment-grid">
            {reviewedRequests.map((request) => (
              <AppointmentRequestCard key={request.id} request={request} onReview={handleReview} busyId={busyId} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
