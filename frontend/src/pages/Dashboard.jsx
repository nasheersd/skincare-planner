import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/axios";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import RitualRing from "../components/RitualRing";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [routine, setRoutine] = useState([]);
  const [completedStepIds, setCompletedStepIds] = useState([]);
  const [scoreData, setScoreData] = useState(null);
  const [lifestyleEntries, setLifestyleEntries] = useState([]);
  
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

      // 2. Fetch skin profile
      const profileRes = await api.get("/skin-profile/").catch(() => null);
      if (profileRes) {
        setProfile(profileRes.data);
      }

      // 3. Fetch skin score breakdown
      try {
        const scoreRes = await api.get("/v1/assessment/score");
        setScoreData(scoreRes.data);
      } catch (err) {
        if (err.response?.status === 400 || err.response?.status === 404) {
          setNeedsAssessment(true);
          setLoading(false);
          return;
        } else {
          throw err;
        }
      }

      // 4. Fetch active routines
      const routineRes = await api.get("/v1/routine");
      setRoutine(routineRes.data);

      // 5. Fetch today's logs
      const todayStr = new Date().toISOString().slice(0, 10);
      const logsRes = await api.get(`/v1/routine/logs?log_date=${todayStr}`);
      const completedIds = (logsRes.data?.completed_steps || []).map((step) => step.routine_step_id);
      setCompletedStepIds(completedIds);

      // 6. Fetch lifestyle entries
      const lifestyleRes = await api.get("/lifestyle/").catch(() => ({ data: [] }));
      setLifestyleEntries(lifestyleRes.data);
      
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
      const targetState = !isCurrentlyCompleted;

      await api.post("/v1/routine/log", {
        routine_step_id: stepId,
        completed: targetState,
        log_date: todayStr
      });

      if (targetState) {
        setCompletedStepIds((prev) => [...prev, stepId]);
      } else {
        setCompletedStepIds((prev) => prev.filter((id) => id !== stepId));
      }

      const scoreRes = await api.get("/v1/assessment/score");
      setScoreData(scoreRes.data);
    } catch (err) {
      setError("Failed to update routine log. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHabitChange = async (type, increment) => {
    if (actionLoading) return;
    setActionLoading(true);
    setError("");

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      let todayEntry = lifestyleEntries.find(e => e.entry_date === todayStr);

      let sleepVal = 8.0;
      let waterVal = 2.0;
      let stressVal = 3;
      let envVal = "normal indoor";

      if (todayEntry) {
        sleepVal = todayEntry.sleep_hours;
        waterVal = todayEntry.water_intake_liters;
        stressVal = todayEntry.stress_level;
        envVal = todayEntry.environmental_exposure;
      }

      if (type === "water") {
        waterVal = Math.max(0, waterVal + increment);
      } else if (type === "sleep") {
        sleepVal = Math.max(0, sleepVal + increment);
      }

      let res;
      if (todayEntry) {
        res = await api.put(`/lifestyle/${todayEntry.id}`, {
          entry_date: todayStr,
          sleep_hours: sleepVal,
          water_intake_liters: waterVal,
          stress_level: stressVal,
          environmental_exposure: envVal
        });
      } else {
        res = await api.post("/lifestyle/", {
          entry_date: todayStr,
          sleep_hours: sleepVal,
          water_intake_liters: waterVal,
          stress_level: stressVal,
          environmental_exposure: envVal
        });
      }

      setLifestyleEntries(prev => {
        const filtered = prev.filter(e => e.entry_date !== todayStr);
        return [res.data, ...filtered];
      });

      const scoreRes = await api.get("/v1/assessment/score");
      setScoreData(scoreRes.data);
    } catch (err) {
      setError("Failed to update daily habits. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState label="Loading your customized dashboard…" />;
  if (me?.role === "dermatologist") return <Navigate to="/dermatologist/dashboard" replace />;
  if (me?.role === "skincare_consultant") return <Navigate to="/consultant/dashboard" replace />;

  const firstName = me?.full_name?.split(" ")[0] || "there";
  const amSteps = routine.filter((s) => s.time_of_day === "AM" || s.time_of_day === "am");
  const pmSteps = routine.filter((s) => s.time_of_day === "PM" || s.time_of_day === "pm");

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayHabit = lifestyleEntries.find(e => e.entry_date === todayStr);
  const todayWater = todayHabit ? todayHabit.water_intake_liters : 1.8;
  const todaySleep = todayHabit ? todayHabit.sleep_hours : 7.0;

  // Format date nicely e.g., "May 21, 2025"
  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="page dashboard-page" style={{ padding: "0 1rem" }}>
      {/* Premium Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", letterSpacing: "-0.02em", color: "var(--color-ink)", marginBottom: "0.25rem" }}>
            Welcome back, {me?.full_name?.split(" ")[0]}! 👋
          </h1>
          <p style={{ color: "var(--color-ink-muted)", fontSize: "0.9rem" }}>
            Here's your skin summary and personalized recommendations.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          {/* Notification bell */}
          <div style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", background: "var(--color-surface)", borderRadius: "50%", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-soft)" }}>
            <span style={{ fontSize: "1.2rem" }}>🔔</span>
            <span style={{ position: "absolute", top: "8px", right: "8px", width: "8px", height: "8px", background: "var(--color-danger)", borderRadius: "50%" }}></span>
          </div>
          {/* Date Picker Badge */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", fontSize: "0.88rem", color: "var(--color-ink)", boxShadow: "var(--shadow-soft)" }}>
            <span>📅</span> {formattedDate}
          </div>
          {/* User profile avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--color-primary-tint)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", border: "2px solid var(--color-primary)", fontSize: "1.1rem" }}>
              {me?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={{ display: "none", flexDirection: "column" }} className="profile-text">
              <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--color-ink)" }}>{me?.full_name}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-ink-muted)" }}>Premium User</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="status-msg error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      {needsAssessment ? (
        <div className="card onboarding-card fade-in" style={{ padding: "3rem", textAlign: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lift)" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }}>✨</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "1rem" }}>Activate Your Personal Companion</h2>
          <p style={{ color: "var(--color-ink-muted)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
            You haven't activated your profile intelligence yet. Complete our quick, expert-validated skin assessment to generate your personalized AM/PM routine, skin score matrix, and tailored recommendations.
          </p>
          <Link to="/skin-assessment" className="btn btn-primary" style={{ padding: "0.85rem 2.2rem", fontSize: "1rem", borderRadius: "var(--radius-md)" }}>
            Start Skin Assessment
          </Link>
        </div>
      ) : (
        <div className="dashboard-content-flow fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* TOP 5 STATUS CARDS BLOCK */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
            
            {/* Card 1: Skin Health Score */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skin Health Score</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.4rem" }}>
                    <span style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--color-ink)" }}>{scoreData ? Math.round(scoreData.overall_score) : 78}</span>
                    <span style={{ fontSize: "0.9rem", color: "var(--color-ink-faint)" }}>/100</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-success)", fontSize: "0.82rem", fontWeight: "700", marginTop: "0.5rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-success)" }}></span> Good
                </div>
              </div>
              <div style={{ width: "70px", height: "70px" }}>
                <RitualRing size={70} progress={(scoreData?.overall_score || 78) / 100} color="var(--color-primary)" />
              </div>
            </div>

            {/* Card 2: Skin Type */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skin Type</span>
                <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "0.4rem", textTransform: "capitalize" }}>
                  {profile?.skin_type || "Combination"}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)", marginTop: "0.25rem" }}>
                  T-Zone: Oily | Cheeks: Normal
                </p>
              </div>
              <Link to="/skin-profile" style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none", alignSelf: "flex-start", marginTop: "0.5rem" }}>
                View Details →
              </Link>
            </div>

            {/* Card 3: Top Concerns */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Concerns</span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginTop: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile?.skin_concerns?.split(",").slice(0, 2).join(" & ") || "Acne & Dark Spots"}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)", marginTop: "0.25rem" }}>
                  Active condition alert
                </p>
              </div>
              <Link to="/skin-profile" style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none", alignSelf: "flex-start", marginTop: "0.5rem" }}>
                View Analysis →
              </Link>
            </div>

            {/* Card 4: Skin Age */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Skin Age</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem", marginTop: "0.4rem" }}>
                  <span style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--color-ink)" }}>{profile?.age || 24}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>y/o</span>
                </div>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--color-ink-faint)", marginTop: "0.5rem" }}>
                Your actual age: {profile?.age || 24}
              </p>
            </div>

            {/* Card 5: Hydration Level */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", margin: 0, minHeight: "135px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hydration Level</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: "700" }}>Good</span>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-ink)", marginTop: "0.4rem" }}>
                  {todayWater.toFixed(1)} L <span style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)", fontWeight: "500" }}>/ 2.5 L</span>
                </div>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ width: "100%", height: "6px", background: "var(--color-surface-sunken)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (todayWater / 2.5) * 100)}%`, height: "100%", background: "var(--color-primary)", borderRadius: "4px" }} />
                </div>
              </div>
            </div>

          </div>

          {/* MIDDLE GRID: Today's Routine, Skin Health Progress, and Insights */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", flexWrap: "wrap" }}>
            
            {/* AM/PM Daily Routine */}
            <div className="card" style={{ padding: "1.5rem 1.75rem", margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)" }}>☀️ Today's Routine</h3>
                <Link to="/skin-assessment" style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none" }}>
                  View Full Routine →
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Morning Routine Checklist */}
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>☀️</span> Morning Routine
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {amSteps.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>No AM steps generated yet.</p>
                    ) : (
                      amSteps.map((step) => {
                        const isCompleted = completedStepIds.includes(step.id);
                        return (
                          <div 
                            key={step.id} 
                            onClick={() => handleCheckboxChange(step.id, isCompleted)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.2s" }}
                          >
                            <span style={{ fontSize: "0.88rem", fontWeight: "600", color: isCompleted ? "var(--color-ink-muted)" : "var(--color-ink)" }}>
                              Step {step.step_number}: {step.step_category}
                            </span>
                            <span style={{ fontSize: "1.1rem", color: isCompleted ? "var(--color-success)" : "var(--color-ink-faint)" }}>
                              {isCompleted ? "✓" : "○"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Evening Routine Checklist */}
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "var(--color-ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🌙</span> Evening Routine
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {pmSteps.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--color-ink-faint)" }}>No PM steps generated yet.</p>
                    ) : (
                      pmSteps.map((step) => {
                        const isCompleted = completedStepIds.includes(step.id);
                        return (
                          <div 
                            key={step.id} 
                            onClick={() => handleCheckboxChange(step.id, isCompleted)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", cursor: "pointer", transition: "all 0.2s" }}
                          >
                            <span style={{ fontSize: "0.88rem", fontWeight: "600", color: isCompleted ? "var(--color-ink-muted)" : "var(--color-ink)" }}>
                              Step {step.step_number}: {step.step_category}
                            </span>
                            <span style={{ fontSize: "1.1rem", color: isCompleted ? "var(--color-success)" : "var(--color-ink-faint)" }}>
                              {isCompleted ? "✓" : "○"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Score History Graph & Insights */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Skin Health Progress */}
              <div className="card" style={{ padding: "1.5rem", margin: 0, flex: 1 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "0.25rem" }}>Skin Health Progress</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--color-ink-muted)", marginBottom: "1.25rem" }}>
                  Your skin health score trend over the last month.
                </p>

                <div style={{ width: "100%", overflowX: "auto" }}>
                  <svg viewBox="0 0 400 120" style={{ width: "100%", height: "auto" }}>
                    <polyline
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3.5"
                      points="20,80 80,60 140,55 200,68 260,42 320,48 380,22"
                    />
                    {[
                      { x: 20, y: 80 },
                      { x: 80, y: 60 },
                      { x: 140, y: 55 },
                      { x: 200, y: 68 },
                      { x: 260, y: 42 },
                      { x: 320, y: 48 },
                      { x: 380, y: 22 }
                    ].map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="var(--color-primary)" strokeWidth="3" />
                    ))}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-ink-faint)", marginTop: "0.6rem" }}>
                    <span>May 1</span>
                    <span>May 7</span>
                    <span>May 14</span>
                    <span>May 21</span>
                  </div>
                </div>
              </div>

              {/* Insights Card */}
              <div className="card" style={{ padding: "1.25rem 1.5rem", margin: 0, background: "var(--color-primary-tint)", border: "1px solid var(--color-primary)" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--color-primary-dark)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  ✨ Clinical Insights
                </h4>
                <ul style={{ paddingLeft: "1.2rem", fontSize: "0.82rem", color: "var(--color-ink-muted)", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <li>Your skin shows minor dryness. Use a hydrating moisturizer with Ceramides.</li>
                  <li>Consistency is high this week. Continue applying SPF daily to prevent UV damage.</li>
                </ul>
              </div>

            </div>

          </div>

          {/* TODAY'S HABITS SECTION */}
          <div className="card" style={{ padding: "1.5rem 1.75rem", margin: 0 }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)", marginBottom: "1.25rem" }}>💧 Lifestyle Habit Trackers</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-ink)" }}>Water Intake</strong>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", marginTop: "0.2rem" }}>Target: 2.5L / Day</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("water", -0.25)} disabled={actionLoading}>-250ml</button>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{todayWater.toFixed(2)} L</span>
                  <button className="btn btn-primary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("water", 0.25)} disabled={actionLoading}>+250ml</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--color-ink)" }}>Sleep Hours</strong>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-ink-muted)", marginTop: "0.2rem" }}>Target: 8.0h / Day</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button className="btn btn-secondary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("sleep", -0.5)} disabled={actionLoading}>-0.5h</button>
                  <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{todaySleep.toFixed(1)} h</span>
                  <button className="btn btn-primary btn-sm" style={{ padding: "0.3rem 0.6rem", fontSize: "0.78rem" }} onClick={() => handleHabitChange("sleep", 0.5)} disabled={actionLoading}>+0.5h</button>
                </div>
              </div>

            </div>
          </div>

          {/* RECOMMENDED PRODUCTS SECTION */}
          <div className="card" style={{ padding: "1.5rem 1.75rem", margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-ink)" }}>🧴 Recommended Products for You</h3>
              <Link to="/recommendations" style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none" }}>
                View All →
              </Link>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              {[
                { name: "Minimalist 2% Salicylic Acid Face Wash", price: "₹349", rating: "4.6" },
                { name: "The Ordinary Niacinamide 10%", price: "₹550", rating: "4.7" },
                { name: "Fixderma Shadow SPF 50+ Gel", price: "₹599", rating: "4.6" },
                { name: "La Roche-Posay Effaclar Duo+", price: "₹1,250", rating: "4.5" }
              ].map((p, i) => (
                <div key={i} style={{ padding: "1rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "140px" }}>
                  <div>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-ink)", marginBottom: "0.3rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.name}</h4>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: "700" }}>{p.price}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-ink-muted)" }}>
                    <span>⭐ {p.rating}</span>
                    <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>Best Match</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
