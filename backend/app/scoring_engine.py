import math
from typing import List, Dict, Any, Optional

def calculate_skin_health_score(
    s_cond: float,
    l_habits: float,
    s_sleep: float,
    r_consist: float,
    h_hydro: float
) -> float:
    """
    Weighted scoring formula:
    Skin Health Score = (S_cond * 0.35) + (L_habits * 0.20) + (S_sleep * 0.15) + (R_consist * 0.20) + (H_hydro * 0.10)
    """
    score = (s_cond * 0.35) + (l_habits * 0.20) + (s_sleep * 0.15) + (r_consist * 0.20) + (h_hydro * 0.10)
    return round(max(0.0, min(100.0, score)), 2)


def calculate_s_cond(concerns: List[Dict[str, Any]]) -> float:
    """
    Start at 100. Subtract 15 points for every "high" severity concern,
    and 7 points for "medium" severity concerns. Low severity is 0. Capped at 0.
    """
    score = 100.0
    for c in concerns:
        severity = str(c.get("severity", "low")).lower()
        if severity == "high":
            score -= 15.0
        elif severity == "medium":
            score -= 7.0
    return max(0.0, score)


def calculate_l_habits(environmental_exposure: Optional[str]) -> float:
    """
    Start at 100. Deduct points if environmental exposure metrics show
    high unprotected UV index exposure.
    - High unprotected UV: deduct 30 points
    - Medium unprotected UV: deduct 15 points
    - Else: deduct 0 points
    """
    if not environmental_exposure:
        return 100.0

    exp_lower = environmental_exposure.lower()
    deduction = 0.0
    if "high" in exp_lower and ("uv" in exp_lower or "sun" in exp_lower or "unprotected" in exp_lower or "exposure" in exp_lower):
        deduction = 30.0
    elif "medium" in exp_lower and ("uv" in exp_lower or "sun" in exp_lower or "unprotected" in exp_lower or "exposure" in exp_lower):
        deduction = 15.0
    elif "uv" in exp_lower or "sun" in exp_lower or "unprotected" in exp_lower:
        deduction = 15.0  # Default to moderate/medium deduction if uv/sun/unprotected is mentioned
    
    return max(0.0, 100.0 - deduction)


def calculate_s_sleep(sleep_hours: Optional[float]) -> float:
    """
    Evaluate recorded sleep data against the ideal 8-hour target:
    ((Hours Logged / 8) * 100, capped at 100).
    """
    if sleep_hours is None or sleep_hours < 0:
        return 100.0  # Default to 100 if no sleep is logged
    return min(100.0, (sleep_hours / 8.0) * 100.0)


def calculate_h_hydro(water_intake_liters: Optional[float]) -> float:
    """
    Compare recorded water intake metrics against standard recommendations (2.0L).
    ((Water / 2.0) * 100, capped at 100).
    """
    if water_intake_liters is None or water_intake_liters < 0:
        return 100.0  # Default to 100 if no hydration is logged
    return min(100.0, (water_intake_liters / 2.0) * 100.0)


def calculate_r_consist(routine_logs: List[Dict[str, Any]], expected_weekly_steps: int) -> float:
    """
    Consistency: percentage of checks completed in MongoDB routine logs for the last 7 days.
    """
    if expected_weekly_steps <= 0:
        return 100.0

    completed_count = 0
    for log in routine_logs:
        completed_steps = log.get("completed_steps", [])
        completed_count += len(completed_steps)

    return min(100.0, (completed_count / expected_weekly_steps) * 100.0)
