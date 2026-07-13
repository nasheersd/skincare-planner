import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import RitualRing from "../components/RitualRing";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [routine, setRoutine] = useState([]);
  const [completedStepIds, setCompletedStepIds] = useState([]);
  const [scoreData, setScoreData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch current user
      const userRes = await api.get("/users/me");
      setMe(userRes.data);

      if (userRes.data.role === "dermatologist" || userRes.data.role === "skincare_consultant") {
        setLoading(false);
        return;
      }

      // 2. Fetch skin score breakdown
      try {
        const scoreRes = await api.get("/v1/assessment/score");
        setScoreData(scoreRes.data);
      } catch (err) {
        // If profile doesn't exist, user needs assessment
        if (err.response?.status === 400 || err.response?.status === 404) {
          setNeedsAssessment(true);
          setLoading(false);
          return;
        } else {
          throw err;
        }
      }

      // 3. Fetch active routines
      const routineRes = await api.get("/v1/routine");
      setRoutine(routineRes.data);

      // 4. Fetch today's logs
      const todayStr = new Date().toISOString().slice(0, 10);
      const logsRes = await api.get(`/v1/routine/logs?log_date=${todayStr}`);
      const completedIds = (logsRes.data?.completed_steps || []).map((step) => step.routine_step_id);
      setCompletedStepIds(completedIds);
      
      setNeedsAssessment(false);
    } catch (err) {
      setError("Couldn't load your skincare dashboard. Try refreshing the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckboxChange = async (stepId, isCurrentlyCompleted) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError("");

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      // Toggle state
      const targetState = !isCurrentlyCompleted;

      // POST log to backend (writes to MongoDB)
      await api.post("/v1/routine/log", {
        routine_step_id: stepId,
        completed: targetState,
        log_date: todayStr
      });

      // Update local checked states
      if (targetState) {
        setCompletedStepIds((prev) => [...prev, stepId]);
      } else {
        setCompletedStepIds((prev) => prev.filter((id) => id !== stepId));
      }

      // Re-fetch score breakdown to show real-time score updates
      const scoreRes = await api.get("/v1/assessment/score");
      setScoreData(scoreRes.data);
    } catch (err) {
      setError("Failed to update routine log. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState label="Loading your customized dashboard…" />;
  if (me?.role === "dermatologist") return <Navigate to="/dermatologist/dashboard" replace />;
  if (me?.role === "skincare_consultant") return <Navigate to="/consultant/dashboard" replace />;

  const firstName = me?.full_name?.split(" ")[0] || "there";

  // Filter routine by time of day
  const amSteps = routine.filter((s) => s.time_of_day === "AM");
  const pmSteps = routine.filter((s) => s.time_of_day === "PM");
  const weeklySteps = routine.filter((s) => s.time_of_day === "Weekly");

  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow="Milestone 2 · Care Planner"
        title={`Welcome, ${firstName}`}
        description="Monitor your skin score, lifestyle metrics, daily routine completion, and care progress."
      />

      {error && <div className="status-msg error">{error}</div>}

      {needsAssessment ? (
        <div className="card onboarding-card fade-in">
          <div className="onboarding-icon">✨</div>
          <h2>Activate Your Personalized Planner</h2>
          <p>
            You haven't completed your skin assessment yet. Take our rapid 4-step medical-grade skin
            questionnaire to unlock your personalized morning and evening routines, tracking metrics,
            and automated Skin Health Score.
          </p>
          <Link to="/skin-assessment" className="btn btn-primary btn-large">
            Start Skin Assessment
          </Link>
        </div>
      ) : (
        <div className="dashboard-grid fade-in">
          {/* Section 1: Score & Metrics Overview */}
          {scoreData && (
            <section className="dashboard-section score-overview-section">
              <h2 className="section-title">Skin Scoring Analysis</h2>
              <div className="card score-main-card">
                <div className="score-ring-wrapper">
                  <RitualRing size={120} progress={scoreData.overall_score / 100} color="var(--color-primary)" />
                  <div className="score-ring-label">
                    <span className="score-number">{Math.round(scoreData.overall_score)}</span>
                    <span className="score-denom">/100</span>
                  </div>
                </div>

                <div className="score-breakdown-details">
                  <h3>Skin Health Score</h3>
                  <p className="subtitle">Calculated daily using our multi-weighted algorithm pipeline.</p>
                  
                  <div className="score-sliders-grid">
                    <div className="score-slider-row">
                      <span className="slider-label">Skin Condition (35%)</span>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill cond-fill" style={{ width: `${scoreData.skin_condition_score}%` }} />
                      </div>
                      <span className="slider-value">{scoreData.skin_condition_score}</span>
                    </div>

                    <div className="score-slider-row">
                      <span className="slider-label">Routine Consistency (20%)</span>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill consist-fill" style={{ width: `${scoreData.consistency_score}%` }} />
                      </div>
                      <span className="slider-value">{scoreData.consistency_score}%</span>
                    </div>

                    <div className="score-slider-row">
                      <span className="slider-label">Lifestyle Habits (20%)</span>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill habits-fill" style={{ width: `${scoreData.lifestyle_score}%` }} />
                      </div>
                      <span className="slider-value">{scoreData.lifestyle_score}</span>
                    </div>

                    <div className="score-slider-row">
                      <span className="slider-label">Sleep Quality (15%)</span>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill sleep-fill" style={{ width: `${scoreData.sleep_score}%` }} />
                      </div>
                      <span className="slider-value">{scoreData.sleep_score}</span>
                    </div>

                    <div className="score-slider-row">
                      <span className="slider-label">Hydration Level (10%)</span>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill hydro-fill" style={{ width: `${scoreData.hydration_score}%` }} />
                      </div>
                      <span className="slider-value">{scoreData.hydration_score}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 2: Daily Skincare Planner Grid */}
          <section className="dashboard-section planner-section">
            <h2 className="section-title">Your Skincare Planner</h2>
            <div className="planner-grid-three">
              
              {/* Card 1: Morning Routine */}
              <div className="card routine-column am-column">
                <div className="routine-column-header">
                  <span className="time-icon">☀️</span>
                  <h3>Morning Plan (AM)</h3>
                </div>
                <div className="routine-steps-list">
                  {amSteps.length === 0 ? (
                    <p className="no-steps-text">No AM steps generated.</p>
                  ) : (
                    amSteps.map((step) => {
                      const isCompleted = completedStepIds.includes(step.id);
                      return (
                        <div key={step.id} className={`routine-step-item ${isCompleted ? "completed" : ""}`}>
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleCheckboxChange(step.id, isCompleted)}
                              disabled={actionLoading}
                            />
                            <span className="custom-checkmark" />
                            <div className="step-text-wrapper">
                              <span className="step-num">Step {step.step_number}</span>
                              <span className="step-cat">{step.step_category}</span>
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 2: Evening Routine */}
              <div className="card routine-column pm-column">
                <div className="routine-column-header">
                  <span className="time-icon">🌙</span>
                  <h3>Evening Plan (PM)</h3>
                </div>
                <div className="routine-steps-list">
                  {pmSteps.length === 0 ? (
                    <p className="no-steps-text">No PM steps generated.</p>
                  ) : (
                    pmSteps.map((step) => {
                      const isCompleted = completedStepIds.includes(step.id);
                      return (
                        <div key={step.id} className={`routine-step-item ${isCompleted ? "completed" : ""}`}>
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleCheckboxChange(step.id, isCompleted)}
                              disabled={actionLoading}
                            />
                            <span className="custom-checkmark" />
                            <div className="step-text-wrapper">
                              <span className="step-num">Step {step.step_number}</span>
                              <span className="step-cat">{step.step_category}</span>
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card 3: Weekly Highlights */}
              <div className="card routine-column weekly-column">
                <div className="routine-column-header">
                  <span className="time-icon">📅</span>
                  <h3>Weekly Highlights</h3>
                </div>
                <div className="routine-steps-list">
                  {weeklySteps.length === 0 ? (
                    <p className="no-steps-text">No weekly steps generated.</p>
                  ) : (
                    weeklySteps.map((step) => {
                      const isCompleted = completedStepIds.includes(step.id);
                      return (
                        <div key={step.id} className={`routine-step-item ${isCompleted ? "completed" : ""}`}>
                          <label className="checkbox-container">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleCheckboxChange(step.id, isCompleted)}
                              disabled={actionLoading}
                            />
                            <span className="custom-checkmark" />
                            <div className="step-text-wrapper">
                              <span className="step-num">Step {step.step_number}</span>
                              <span className="step-cat">{step.step_category}</span>
                            </div>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* Quick Actions (Keep intact from original design) */}
          <section className="dashboard-section actions-section">
            <h2 className="section-title">Navigation</h2>
            <div className="dashboard-footer-links">
              <Link to="/skin-assessment" className="btn btn-secondary">
                Retake Skin Assessment
              </Link>
              <Link to="/skin-profile" className="btn btn-secondary">
                View Skin Profile
              </Link>
              <Link to="/recommendations" className="btn btn-secondary">
                Product Catalog
              </Link>
              <Link to="/progress" className="btn btn-secondary">
                Skin Logs History
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
