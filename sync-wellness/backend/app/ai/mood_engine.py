"""
Mood Analysis Engine
Sentiment analysis, statistical aggregation, pattern detection,
and Cycle + Mood Correlation analysis.
SYNC provides general wellness observations, NOT medical diagnoses.
"""
from typing import List, Optional, Dict, Any
from datetime import date, timedelta
import statistics
import re
from app.ai.cycle_engine import get_phase_for_day


MOOD_VALENCE = {
    "happy": 0.9,
    "energetic": 0.8,
    "calm": 0.6,
    "neutral": 0.0,
    "tired": -0.3,
    "sad": -0.6,
    "anxious": -0.7,
    "irritated": -0.75,
}

MOOD_SCORE_BASE = {
    "happy": 9,
    "energetic": 8,
    "calm": 7,
    "neutral": 5,
    "tired": 4,
    "sad": 3,
    "anxious": 2,
    "irritated": 2,
}

POSITIVE_WORDS = {
    "great", "amazing", "wonderful", "happy", "joy", "love", "excited", "fantastic",
    "good", "better", "nice", "calm", "peaceful", "relaxed", "energized", "motivated",
    "productive", "grateful", "blessed", "positive", "upbeat", "cheerful", "content",
}

NEGATIVE_WORDS = {
    "sad", "terrible", "awful", "horrible", "depressed", "anxious", "worried", "stressed",
    "angry", "upset", "frustrated", "exhausted", "tired", "fatigue", "pain", "hurt",
    "lonely", "hopeless", "overwhelmed", "nervous", "irritated", "annoyed", "miserable",
}


def analyze_sentiment(text: Optional[str], mood: str) -> float:
    """
    Rule-based sentiment analysis.
    Returns score -1 (very negative) to 1 (very positive).
    """
    score = MOOD_VALENCE.get(mood.lower(), 0.0)

    if not text:
        return score

    words = set(re.findall(r'\b[a-z]+\b', text.lower()))
    pos_count = len(words & POSITIVE_WORDS)
    neg_count = len(words & NEGATIVE_WORDS)

    if pos_count + neg_count > 0:
        text_score = (pos_count - neg_count) / (pos_count + neg_count)
        score = 0.4 * score + 0.6 * text_score

    return round(max(-1.0, min(1.0, score)), 3)


def detect_mood_patterns(mood_logs: List[Dict[str, Any]]) -> List[str]:
    """
    Detect wellness patterns in mood entries.
    Returns non-medical observations.
    """
    if not mood_logs:
        return []

    patterns = []
    recent = mood_logs[-14:]  # Last 14 entries

    # Check average stress
    stress_vals = [m["stress_level"] for m in recent if m.get("stress_level") is not None]
    if stress_vals:
        avg_stress = sum(stress_vals) / len(stress_vals)
        if avg_stress >= 7:
            patterns.append(
                "Your recent logs show elevated stress levels. "
                "Consider incorporating gentle restorative practices like deep breathing or calming walks."
            )
        elif avg_stress <= 3:
            patterns.append("Your recorded stress levels appear well-managed recently. Great work!")

    # Check anxiety
    anxiety_vals = [m["anxiety_level"] for m in recent if m.get("anxiety_level") is not None]
    if anxiety_vals:
        avg_anxiety = sum(anxiety_vals) / len(anxiety_vals)
        if avg_anxiety >= 7:
            patterns.append(
                "Elevated feelings of tension or anxiety have been noted recently. "
                "Mindfulness, journaling, or speaking with a trusted person can offer comforting support."
            )

    # Check energy trends
    energy_vals = [m["energy_level"] for m in recent if m.get("energy_level") is not None]
    if energy_vals:
        avg_energy = sum(energy_vals) / len(energy_vals)
        if avg_energy <= 4:
            patterns.append(
                "Recorded energy was lower in recent check-ins. "
                "Ensure you're prioritizing restorative sleep, nourishing meals, and hydration."
            )
        elif avg_energy >= 7.5:
            patterns.append("High energy levels reported in recent check-ins. Wonderful vitality!")

    # Check sleep trends
    sleep_vals = [m["sleep_hours"] for m in recent if m.get("sleep_hours") is not None]
    if sleep_vals:
        avg_sleep = sum(sleep_vals) / len(sleep_vals)
        if avg_sleep < 6.5:
            patterns.append(
                f"Your recent average sleep is {avg_sleep:.1f} hours. "
                "Aiming for 7–8 hours of consistent sleep supports mood regulation and hormonal balance."
            )

    # Mood frequencies
    moods = [m.get("mood", "").lower() for m in recent]
    negative_moods = [m for m in moods if m in {"sad", "anxious", "irritated", "tired"}]
    if len(moods) > 0 and len(negative_moods) >= len(moods) * 0.6:
        patterns.append(
            "You have logged more challenging moods recently. "
            "Be compassionate with yourself. Reaching out to a healthcare professional or support system is always encouraged."
        )

    happy_moods = [m for m in moods if m in {"happy", "energetic", "calm"}]
    if len(moods) > 0 and len(happy_moods) >= len(moods) * 0.7:
        patterns.append("Your mood logs have been predominantly positive and balanced recently!")

    return patterns


def mood_summary(mood_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate comprehensive statistical summary for mood logs.
    """
    if not mood_logs:
        return {
            "has_data": False,
            "total_entries": 0,
            "average_mood_score": None,
            "average_stress": None,
            "average_anxiety": None,
            "average_energy": None,
            "average_sleep": None,
            "dominant_mood": None,
            "mood_distribution": {},
            "mood_trend": [],
            "patterns": [],
            "recent_entries": [],
        }

    mood_scores = [
        m.get("mood_score") or MOOD_SCORE_BASE.get(m.get("mood", "").lower(), 5)
        for m in mood_logs
    ]
    stress_vals = [m["stress_level"] for m in mood_logs if m.get("stress_level") is not None]
    anxiety_vals = [m["anxiety_level"] for m in mood_logs if m.get("anxiety_level") is not None]
    energy_vals = [m["energy_level"] for m in mood_logs if m.get("energy_level") is not None]
    sleep_vals = [m["sleep_hours"] for m in mood_logs if m.get("sleep_hours") is not None]

    moods = [m.get("mood", "").lower() for m in mood_logs if m.get("mood")]
    mood_counts: Dict[str, int] = {}
    for m in moods:
        mood_counts[m] = mood_counts.get(m, 0) + 1

    dominant = max(mood_counts, key=mood_counts.get) if mood_counts else None
    patterns = detect_mood_patterns(mood_logs)

    # Trend points
    trend = []
    for log in mood_logs[-30:]:
        trend.append({
            "date": str(log.get("date")),
            "mood": log.get("mood"),
            "mood_score": log.get("mood_score") or MOOD_SCORE_BASE.get(log.get("mood", "").lower(), 5),
            "stress": log.get("stress_level"),
            "anxiety": log.get("anxiety_level"),
            "energy": log.get("energy_level"),
            "sleep": log.get("sleep_hours"),
            "sentiment": log.get("sentiment_score"),
        })

    return {
        "has_data": True,
        "total_entries": len(mood_logs),
        "average_mood_score": round(statistics.mean(mood_scores), 1) if mood_scores else None,
        "average_stress": round(statistics.mean(stress_vals), 1) if stress_vals else None,
        "average_anxiety": round(statistics.mean(anxiety_vals), 1) if anxiety_vals else None,
        "average_energy": round(statistics.mean(energy_vals), 1) if energy_vals else None,
        "average_sleep": round(statistics.mean(sleep_vals), 1) if sleep_vals else None,
        "dominant_mood": dominant,
        "mood_distribution": mood_counts,
        "mood_trend": trend,
        "patterns": patterns,
    }


def analyze_cycle_mood_correlation(
    cycle_history: List[Dict[str, Any]],
    mood_logs: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Phase 5 — Cycle + Mood Correlation Analysis.
    Correlates logged mood, stress, energy, and sleep with cycle phases.
    Uses non-prescriptive, supportive wellness language (NO medical diagnoses).
    """
    if not cycle_history or not mood_logs:
        return {
            "has_data": False,
            "message": "More tracking data is needed to identify patterns across your cycle phases.",
            "phase_correlations": {},
            "insights": [],
        }

    # Group mood entries by cycle phase based on cycle period_starts
    # Sort cycles chronologically
    sorted_cycles = sorted(
        cycle_history,
        key=lambda c: c["period_start"] if isinstance(c["period_start"], date) else date.fromisoformat(str(c["period_start"]))
    )

    phase_data: Dict[str, Dict[str, List[float]]] = {
        "menstrual": {"mood_score": [], "stress": [], "energy": [], "sleep": []},
        "follicular": {"mood_score": [], "stress": [], "energy": [], "sleep": []},
        "ovulation": {"mood_score": [], "stress": [], "energy": [], "sleep": []},
        "luteal": {"mood_score": [], "stress": [], "energy": [], "sleep": []},
    }

    for log in mood_logs:
        log_date = log["date"] if isinstance(log["date"], date) else date.fromisoformat(str(log["date"]))

        # Find the cycle that applies to this date
        applicable_cycle = None
        for i, cycle in enumerate(sorted_cycles):
            start = cycle["period_start"] if isinstance(cycle["period_start"], date) else date.fromisoformat(str(cycle["period_start"]))
            if i + 1 < len(sorted_cycles):
                next_start = sorted_cycles[i + 1]["period_start"]
                if isinstance(next_start, str):
                    next_start = date.fromisoformat(next_start)
                if start <= log_date < next_start:
                    applicable_cycle = cycle
                    break
            else:
                # Latest cycle
                if log_date >= start:
                    applicable_cycle = cycle
                    break

        if applicable_cycle:
            c_start = applicable_cycle["period_start"] if isinstance(applicable_cycle["period_start"], date) else date.fromisoformat(str(applicable_cycle["period_start"]))
            cycle_len = applicable_cycle.get("cycle_length", 28) or 28
            cycle_day = (log_date - c_start).days + 1

            if 1 <= cycle_day <= cycle_len + 14:
                phase = get_phase_for_day(cycle_day, cycle_len)
                m_score = log.get("mood_score") or MOOD_SCORE_BASE.get(log.get("mood", "").lower(), 5)
                phase_data[phase]["mood_score"].append(m_score)

                if log.get("stress_level") is not None:
                    phase_data[phase]["stress"].append(log["stress_level"])
                if log.get("energy_level") is not None:
                    phase_data[phase]["energy"].append(log["energy_level"])
                if log.get("sleep_hours") is not None:
                    phase_data[phase]["sleep"].append(log["sleep_hours"])

    # Aggregate by phase
    correlations: Dict[str, Dict[str, Any]] = {}
    for phase, values in phase_data.items():
        correlations[phase] = {
            "entries_count": len(values["mood_score"]),
            "avg_mood_score": round(statistics.mean(values["mood_score"]), 1) if values["mood_score"] else None,
            "avg_stress": round(statistics.mean(values["stress"]), 1) if values["stress"] else None,
            "avg_energy": round(statistics.mean(values["energy"]), 1) if values["energy"] else None,
            "avg_sleep": round(statistics.mean(values["sleep"]), 1) if values["sleep"] else None,
        }

    # Generate supportive, non-prescriptive insights
    insights = []
    total_assigned = sum(c["entries_count"] for c in correlations.values())

    if total_assigned < 4:
        insights.append("Continue tracking your mood and cycle regularly to uncover your personal wellness trends.")
    else:
        # Energy observation
        energy_by_phase = {p: c["avg_energy"] for p, c in correlations.items() if c["avg_energy"] is not None}
        if len(energy_by_phase) >= 2:
            lowest_energy_phase = min(energy_by_phase, key=energy_by_phase.get)
            highest_energy_phase = max(energy_by_phase, key=energy_by_phase.get)
            if energy_by_phase[highest_energy_phase] - energy_by_phase[lowest_energy_phase] >= 1.5:
                insights.append(
                    f"Your recorded energy was higher on average during the {highest_energy_phase} phase "
                    f"and lower on average during the {lowest_energy_phase} phase."
                )

        # Stress observation
        stress_by_phase = {p: c["avg_stress"] for p, c in correlations.items() if c["avg_stress"] is not None}
        if len(stress_by_phase) >= 2:
            highest_stress_phase = max(stress_by_phase, key=stress_by_phase.get)
            if stress_by_phase[highest_stress_phase] >= 6.0:
                insights.append(
                    f"Recorded stress was elevated on average during your {highest_stress_phase} phase. "
                    "Incorporating extra restorative rest during this window may support comfort."
                )

        # Sleep observation
        sleep_by_phase = {p: c["avg_sleep"] for p, c in correlations.items() if c["avg_sleep"] is not None}
        if len(sleep_by_phase) >= 2:
            highest_sleep_phase = max(sleep_by_phase, key=sleep_by_phase.get)
            insights.append(
                f"You recorded your longest sleep averages during the {highest_sleep_phase} phase."
            )

    return {
        "has_data": total_assigned > 0,
        "total_correlated_entries": total_assigned,
        "phase_correlations": correlations,
        "insights": insights,
        "disclaimer": (
            "These observations reflect statistical patterns from your logged entries and are not medical diagnoses."
        ),
    }
