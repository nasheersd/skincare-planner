import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}

export default function ProgressTracking() {
  const [entries, setEntries] = useState([]);
  const [assignedDermatologist, setAssignedDermatologist] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().slice(0, 10),
    hydration_score: "",
    breakout_count: "",
    notes: "",
    photo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const loadData = async () => {
    try {
      const [entriesRes, dermatologistRes, historyRes] = await Promise.all([
        api.get("/progress/"),
        api.get("/users/me/dermatologist").catch(() => ({ data: null })),
        api.get("/v1/assessment/history").catch(() => ({ data: [] })),
      ]);
      setEntries(entriesRes.data);
      setAssignedDermatologist(dermatologistRes.data);
      setScoreHistory(historyRes.data);
    } catch {
      setStatus({ type: "error", text: "Couldn't load your progress timeline." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const res = await api.post("/progress/", {
        ...form,
        hydration_score: form.hydration_score ? Number(form.hydration_score) : null,
        breakout_count: form.breakout_count ? Number(form.breakout_count) : null,
        notes: form.notes.trim() || null,
        photo_url: form.photo_url.trim() || null,
      });
      setEntries((current) => [res.data, ...current]);
      setForm((current) => ({
        ...current,
        hydration_score: "",
        breakout_count: "",
        notes: "",
        photo_url: "",
      }));
      setStatus({ type: "ok", text: "Progress entry added successfully." });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.detail || "Couldn't save this progress entry.",
      });
    } finally {
      setSaving(false);
    }
  };

  const averageHydration = useMemo(() => {
    const scores = entries
      .map((entry) => entry.hydration_score)
      .filter((score) => typeof score === "number");
    if (scores.length === 0) return null;
    return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
  }, [entries]);

  const latestEntry = entries[0] || null;

  const renderScoreChart = () => {
    if (scoreHistory.length < 2) {
      return (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-fg-muted)" }}>
          <p className="hint">Complete multiple skin assessments over time to generate a trend graph of your overall Skin Health Score.</p>
        </div>
      );
    }

    const width = 600;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 30;

    // Scale calculations
    const scores = scoreHistory.map((h) => h.overall_score);
    const maxScore = 100;
    const minScore = 0;

    const points = scoreHistory
      .map((h, i) => {
        const x = paddingLeft + (i / (scoreHistory.length - 1)) * (width - paddingLeft - paddingRight);
        const y = height - paddingBottom - ((h.overall_score - minScore) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: "500px", height: "auto" }}>
          {/* Grid lines */}
          {[20, 40, 60, 80, 100].map((level) => {
            const y = height - paddingBottom - ((level - minScore) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);
            return (
              <g key={level}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="var(--color-border)" strokeDasharray="3,3" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-fg-muted)">{level}</text>
              </g>
            );
          })}

          {/* Trend line */}
          <polyline fill="none" stroke="var(--color-gold)" strokeWidth="3" points={points} />

          {/* Value circles & labels */}
          {scoreHistory.map((h, i) => {
            const x = paddingLeft + (i / (scoreHistory.length - 1)) * (width - paddingLeft - paddingRight);
            const y = height - paddingBottom - ((h.overall_score - minScore) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);
            const formattedDate = new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return (
              <g key={h.id}>
                <circle cx={x} cy={y} r="5" fill="var(--color-primary)" stroke="var(--color-gold)" strokeWidth="2.5" />
                <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-gold)">
                  {Math.round(h.overall_score)}
                </text>
                <text x={x} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--color-fg-muted)">
                  {formattedDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) return <LoadingState label="Loading your progress timeline…" />;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Patient progress"
        title="Progress Tracking"
        description="Track your skincare progress here. Your recent entries are visible inside your dermatologist's private workspace after you connect with one."
      />

      {status && <div className={`status-msg ${status.type}`}>{status.text}</div>}

      <section className="section">
        <h2 className="section-title">Progress overview</h2>
        <div className="card-grid">
          <div className="card summary-card">
            <div className="summary-label">Entries logged</div>
            <div className="summary-value">{entries.length}</div>
            <p className="summary-note">Build a timeline your dermatologist can review.</p>
          </div>
          <div className="card summary-card">
            <div className="summary-label">Average hydration</div>
            <div className="summary-value">{averageHydration ?? "-"}</div>
            <p className="summary-note">Calculated from every entry with a hydration score.</p>
          </div>
          <div className="card summary-card">
            <div className="summary-label">Assigned dermatologist</div>
            <div className="summary-value progress-summary-text">
              {assignedDermatologist ? assignedDermatologist.full_name : "None"}
            </div>
            <p className="summary-note">
              {assignedDermatologist ? "You can message them from the dermatologist page." : "Assign a dermatologist to share progress and start messaging."}
            </p>
          </div>
        </div>
      </section>

      {/* Skin Health Score Trend Chart Section */}
      <section className="section">
        <h2 className="section-title">Skin Health Score History</h2>
        <div className="card" style={{ padding: "1.5rem" }}>
          {renderScoreChart()}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Add progress entry</h2>
        <form onSubmit={handleSubmit} className="card form-card">
          <div className="form-section">
            <h3 className="form-section-title">Entry details</h3>
            <div className="field">
              <label htmlFor="entry_date">Entry date</label>
              <input id="entry_date" name="entry_date" type="date" value={form.entry_date} onChange={handleChange} />
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="hydration_score">Hydration score <span className="hint">0-10</span></label>
                <input
                  id="hydration_score"
                  name="hydration_score"
                  type="number"
                  min="0"
                  max="10"
                  value={form.hydration_score}
                  onChange={handleChange}
                  placeholder="7"
                />
              </div>
              <div className="field">
                <label htmlFor="breakout_count">Breakout count</label>
                <input
                  id="breakout_count"
                  name="breakout_count"
                  type="number"
                  min="0"
                  value={form.breakout_count}
                  onChange={handleChange}
                  placeholder="2"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                value={form.notes}
                onChange={handleChange}
                placeholder="Describe any changes, irritation, improvements, or routine updates."
              />
            </div>
            <div className="field">
              <label htmlFor="photo_url">Photo URL</label>
              <input
                id="photo_url"
                name="photo_url"
                value={form.photo_url}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save progress entry"}
            </button>
          </div>
        </form>
      </section>

      <section className="section">
        <div className="section-heading-row">
          <h2 className="section-title">Recent timeline</h2>
          <Link to="/dermatologist" className="btn btn-secondary">
            Open dermatologist page
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="card empty-state">
            <h3>No progress entries yet</h3>
            <p>Log your first update to start building a progress history for yourself and your dermatologist.</p>
          </div>
        ) : (
          <div className="progress-entry-list">
            {entries.map((entry) => (
              <article key={entry.id} className="card progress-entry-card">
                <div className="appointment-card-header">
                  <div>
                    <h3>{formatDate(entry.entry_date)}</h3>
                    <p className="stat-note">Saved on {new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                  <span className="eyebrow eyebrow-inline">Patient entry</span>
                </div>
                <div className="detail-grid">
                  <div className="detail-box">
                    <strong>Hydration</strong>
                    <p>{entry.hydration_score ?? "Not set"}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Breakouts</strong>
                    <p>{entry.breakout_count ?? "Not set"}</p>
                  </div>
                  <div className="detail-box">
                    <strong>Photo</strong>
                    <p>{entry.photo_url ? <a href={entry.photo_url} target="_blank" rel="noreferrer">Open photo</a> : "No photo attached"}</p>
                  </div>
                </div>
                <div className="appointment-copy">
                  <strong>Notes</strong>
                  <p>{entry.notes || "No notes added for this day."}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {latestEntry && (
          <div className="card inline-note-card">
            <strong>Latest update shared</strong>
            <p>
              Your most recent entry from {formatDate(latestEntry.entry_date)} is available to your assigned dermatologist inside their patient progress page.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
