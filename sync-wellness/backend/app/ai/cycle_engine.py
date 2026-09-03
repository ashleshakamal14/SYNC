"""
Cycle Prediction Engine
Rule-based first, with ML-assisted refinement when enough data exists.
Predictions are clearly labeled as estimates.
"""
from datetime import date, timedelta
from typing import Optional, List
import statistics


PHASE_BOUNDARIES = {
    "menstrual": (1, 5),      # days 1-5
    "follicular": (6, 13),    # days 6-13
    "ovulation": (14, 16),    # days 14-16
    "luteal": (17, 28),       # days 17-28
}


def get_phase_for_day(cycle_day: int, cycle_length: int = 28) -> str:
    """Determine cycle phase from cycle day."""
    # Scale phases proportionally to actual cycle length
    period_end = 5
    ovulation_day = round(cycle_length * 0.5)  # ~halfway
    follicular_end = ovulation_day - 2
    ovulation_end = ovulation_day + 1

    if cycle_day <= period_end:
        return "menstrual"
    elif cycle_day <= follicular_end:
        return "follicular"
    elif cycle_day <= ovulation_end:
        return "ovulation"
    else:
        return "luteal"


def calculate_cycle_metrics(
    period_start: date,
    cycle_length: int = 28,
    period_length: int = 5,
) -> dict:
    """
    Calculate key cycle metrics from a period start date.
    Returns estimates — not medical predictions.
    """
    today = date.today()
    cycle_day = (today - period_start).days + 1
    phase = get_phase_for_day(cycle_day, cycle_length)

    ovulation_date = period_start + timedelta(days=cycle_length // 2 - 1)
    fertile_start = ovulation_date - timedelta(days=5)
    fertile_end = ovulation_date + timedelta(days=1)
    next_period = period_start + timedelta(days=cycle_length)
    days_until_next = (next_period - today).days

    return {
        "cycle_day": max(1, cycle_day),
        "current_phase": phase,
        "ovulation_date": ovulation_date,
        "fertile_window_start": fertile_start,
        "fertile_window_end": fertile_end,
        "predicted_next_cycle": next_period,
        "days_until_next_period": days_until_next,
        "cycle_length": cycle_length,
        "period_length": period_length,
    }


def predict_next_cycle_ml(cycle_history: List[dict]) -> Optional[int]:
    """
    Simple ML-assisted prediction using cycle length history.
    Uses weighted average giving more weight to recent cycles.
    Returns predicted cycle length or None if insufficient data.
    """
    if len(cycle_history) < 3:
        return None

    lengths = [c.get("cycle_length", 28) for c in cycle_history[-6:]]
    if not lengths:
        return None

    # Weighted average: more recent cycles get higher weight
    weights = list(range(1, len(lengths) + 1))
    weighted_sum = sum(l * w for l, w in zip(lengths, weights))
    total_weight = sum(weights)
    predicted = round(weighted_sum / total_weight)

    # Clamp to reasonable range
    return max(21, min(35, predicted))


def analyze_cycle_irregularity(cycle_history: List[dict]) -> dict:
    """Analyze cycle irregularity from history."""
    if len(cycle_history) < 2:
        return {"is_regular": True, "variation": 0, "observation": ""}

    lengths = [c.get("cycle_length", 28) for c in cycle_history]
    variation = max(lengths) - min(lengths)
    std_dev = statistics.stdev(lengths) if len(lengths) > 1 else 0

    is_regular = variation <= 7 and std_dev <= 3

    if not is_regular:
        observation = (
            "Your cycle lengths show some variation. "
            "This is common and can be influenced by stress, diet, and lifestyle. "
            "If concerned, please consult a healthcare professional."
        )
    else:
        observation = "Your cycles appear regular based on your recent logs."

    return {
        "is_regular": is_regular,
        "variation": variation,
        "std_dev": round(std_dev, 1),
        "average_length": round(statistics.mean(lengths), 1),
        "observation": observation,
    }


# Phase guide content (wellness suggestions, NOT medical prescriptions)
PHASE_GUIDE = {
    "menstrual": {
        "phase_name": "Menstrual Phase",
        "description": "Your body is shedding the uterine lining. Focus on rest and recovery.",
        "nutrition": [
            "Iron-rich foods like lentils, spinach, and fortified cereals",
            "Stay well hydrated — aim for 8+ glasses of water",
            "Magnesium-rich foods like dark chocolate, nuts, and seeds",
            "Ginger or chamomile tea may help with cramp discomfort",
            "Avoid excessive caffeine and alcohol",
        ],
        "exercise": [
            "Gentle yoga or stretching",
            "Light walks in fresh air",
            "Swimming at a comfortable pace",
            "Listen to your body — rest is productive too",
        ],
        "sleep": [
            "Prioritize 8–9 hours of sleep",
            "A warm bath before bed may help with cramps",
            "Use a hot water bottle for comfort",
        ],
        "selfcare": [
            "Be gentle with yourself — it's okay to slow down",
            "Journaling can help process emotions",
            "Reduce social commitments if needed",
            "Heating pads for cramp relief",
        ],
        "productivity": [
            "Great time for reflection and planning",
            "Focus on creative, low-intensity tasks",
            "Review and evaluate rather than start new projects",
        ],
        "color": "#E91E8C",
        "emoji": "🌙",
    },
    "follicular": {
        "phase_name": "Follicular Phase",
        "description": "Estrogen is rising and energy is building. Great time to take on new challenges.",
        "nutrition": [
            "Protein-rich foods to support muscle repair",
            "Fermented foods like yogurt and kimchi for gut health",
            "Fresh fruits and vegetables rich in antioxidants",
            "Complex carbohydrates for sustained energy",
            "Keep hydration consistent",
        ],
        "exercise": [
            "Gradually increase workout intensity",
            "Cardio workouts — cycling, jogging, dancing",
            "Strength training is effective during this phase",
            "Try new fitness activities",
        ],
        "sleep": [
            "Aim for 7–8 hours",
            "Your sleep quality typically improves this phase",
            "Consistent wake times help sustain energy",
        ],
        "selfcare": [
            "Excellent time to try new experiences",
            "Social activities feel more energizing now",
            "Skincare routine — skin tends to be clearer",
            "Plan activities you've been putting off",
        ],
        "productivity": [
            "High motivation and focus — great for new projects",
            "Brainstorming and creative work",
            "Learning new skills",
            "Schedule important meetings or presentations",
        ],
        "color": "#4CAF50",
        "emoji": "🌱",
    },
    "ovulation": {
        "phase_name": "Ovulation Phase",
        "description": "Peak estrogen levels. Energy and confidence are typically highest.",
        "nutrition": [
            "Antioxidant-rich foods like berries and leafy greens",
            "Zinc-rich foods to support ovulation — pumpkin seeds, chickpeas",
            "Hydration is especially important",
            "Light, balanced meals",
            "Omega-3 rich foods like salmon, walnuts",
        ],
        "exercise": [
            "High-intensity workouts — HIIT, sprinting, dance",
            "Competitive sports — energy peaks here",
            "Strength training at heavier loads",
            "Group fitness classes",
        ],
        "sleep": [
            "You may need slightly less sleep — body is energized",
            "Maintain a consistent schedule",
            "Keep bedroom cool and dark",
        ],
        "selfcare": [
            "Social and communicative — great for connections",
            "Use your natural confidence for important conversations",
            "Creative expression and performance",
            "Take photos — you may feel your best now",
        ],
        "productivity": [
            "Peak performance for presentations and negotiations",
            "Team collaborations",
            "Important decisions and strategy",
            "Networking and social events",
        ],
        "color": "#FF9800",
        "emoji": "☀️",
    },
    "luteal": {
        "phase_name": "Luteal Phase",
        "description": "Progesterone rises. Your body is preparing for the next cycle. Focus on balance.",
        "nutrition": [
            "Complex carbohydrates to manage cravings — sweet potatoes, oats",
            "Magnesium-rich foods for PMS support — dark leafy greens, nuts",
            "Calcium-rich foods — dairy, fortified alternatives",
            "Reduce caffeine and sodium to manage bloating",
            "Vitamin B6 foods — bananas, chickpeas, potatoes",
        ],
        "exercise": [
            "Moderate-intensity exercise — yoga, pilates, walking",
            "Reduce intensity as the phase progresses",
            "Stretching and mobility work",
            "Listen to your body — avoid overexertion",
        ],
        "sleep": [
            "You may feel more tired — prioritize 8+ hours",
            "Relaxing evening routines",
            "Limit screen time before bed",
            "Herbal teas like chamomile may help",
        ],
        "selfcare": [
            "Introspection and journaling",
            "Reduce social obligations if energy is low",
            "Cozy self-care — baths, reading, comfort",
            "Be compassionate with yourself",
        ],
        "productivity": [
            "Detail-oriented tasks suit this phase well",
            "Wrap up ongoing projects",
            "Administrative and organizational work",
            "Reflection and review rather than starting new ventures",
        ],
        "color": "#9C27B0",
        "emoji": "🌸",
    },
}


def get_phase_guide(phase: str) -> dict:
    """Get wellness guide for a cycle phase."""
    return PHASE_GUIDE.get(phase, PHASE_GUIDE["follicular"])
