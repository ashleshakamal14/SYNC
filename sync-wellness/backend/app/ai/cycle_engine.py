"""
Cycle Prediction Engine

Uses the trained Random Forest ML model for next-cycle prediction.
Also provides cycle phase calculations, irregularity analysis,
and wellness guidance.

Predictions are estimates and are not medical predictions.
"""

from datetime import date, timedelta
from typing import Optional, List
from pathlib import Path
import statistics

import pandas as pd
import joblib


# ============================================================
# CYCLE PHASE BOUNDARIES
# ============================================================

PHASE_BOUNDARIES = {
    "menstrual": (1, 5),
    "follicular": (6, 13),
    "ovulation": (14, 16),
    "luteal": (17, 28),
}


# ============================================================
# GET CYCLE PHASE
# ============================================================

def get_phase_for_day(
    cycle_day: int,
    cycle_length: int = 28
) -> str:
    """
    Determine cycle phase from cycle day.

    Phase boundaries are scaled proportionally
    according to the cycle length.
    """

    period_end = 5

    # Approximately halfway through the cycle
    ovulation_day = round(cycle_length * 0.5)

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


# ============================================================
# CALCULATE CYCLE METRICS
# ============================================================

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

    cycle_day = (
        today - period_start
    ).days + 1

    phase = get_phase_for_day(
        cycle_day,
        cycle_length
    )

    # Estimated ovulation
    ovulation_date = (
        period_start
        + timedelta(days=cycle_length // 2 - 1)
    )

    # Estimated fertile window
    fertile_start = (
        ovulation_date
        - timedelta(days=5)
    )

    fertile_end = (
        ovulation_date
        + timedelta(days=1)
    )

    # Estimated next period
    next_period = (
        period_start
        + timedelta(days=cycle_length)
    )

    days_until_next = (
        next_period - today
    ).days

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


# ============================================================
# MACHINE LEARNING CYCLE PREDICTION
# ============================================================

def predict_next_cycle_ml(
    cycle_history: List[dict],
    user_profile: Optional[dict] = None,
) -> Optional[int]:
    """
    Predict the next menstrual cycle length using the
    trained Random Forest ML model.

    Model:
        RandomForestRegressor

    Target:
        next_cycle_length

    Input:
        Current cycle information +
        previous cycle information +
        wellness information +
        user profile

    Returns:
        Predicted cycle length in days.
        Returns None if prediction cannot be made.
    """

    # --------------------------------------------------------
    # Check input
    # --------------------------------------------------------

    if not cycle_history:
        return None

    try:

        # ----------------------------------------------------
        # Locate trained model
        #
        # cycle_engine.py:
        # backend/app/ai/cycle_engine.py
        #
        # Model:
        # backend/ml/models/cycle_predictor.pkl
        # ----------------------------------------------------

        model_path = (
            Path(__file__).resolve().parents[2]
            / "ml"
            / "models"
            / "cycle_predictor.pkl"
        )

        if not model_path.exists():

            print(
                f"ML model not found: {model_path}"
            )

            return None

        # ----------------------------------------------------
        # Load trained Random Forest pipeline
        # ----------------------------------------------------

        model = joblib.load(model_path)

        # ----------------------------------------------------
        # Current cycle
        # ----------------------------------------------------

        current = cycle_history[-1]

        current_length = current.get(
            "cycle_length"
        )

        if current_length is None:
            return None

        current_length = float(
            current_length
        )

        # ----------------------------------------------------
        # Previous cycle
        # ----------------------------------------------------

        if len(cycle_history) >= 2:

            previous = cycle_history[-2]

        else:

            previous = {}

        prev_cycle_length = previous.get(
            "cycle_length"
        )

        if prev_cycle_length is not None:

            prev_cycle_length = float(
                prev_cycle_length
            )

        # ----------------------------------------------------
        # Get all historical cycle lengths
        # ----------------------------------------------------

        historical_lengths = [
            c.get("cycle_length")
            for c in cycle_history
            if c.get("cycle_length") is not None
        ]

        # Remove current cycle
        previous_lengths = historical_lengths[:-1]

        # ----------------------------------------------------
        # Previous 3 cycle average
        # ----------------------------------------------------

        last_three = previous_lengths[-3:]

        if last_three:

            rolling_mean_3 = (
                sum(last_three)
                / len(last_three)
            )

        else:

            rolling_mean_3 = None

        # ----------------------------------------------------
        # Previous 3 cycle standard deviation
        # ----------------------------------------------------

        if len(last_three) >= 2:

            rolling_std_3 = pd.Series(
                last_three
            ).std()

        else:

            rolling_std_3 = None

        # ----------------------------------------------------
        # Previous 2 cycle average
        # ----------------------------------------------------

        last_two = previous_lengths[-2:]

        if last_two:

            prev2_mean = (
                sum(last_two)
                / len(last_two)
            )

        else:

            prev2_mean = None

        # ----------------------------------------------------
        # Current cycle length change
        # ----------------------------------------------------

        if prev_cycle_length is not None:

            cycle_length_change = (
                current_length
                - prev_cycle_length
            )

        else:

            cycle_length_change = None

        # ----------------------------------------------------
        # User profile
        # ----------------------------------------------------

        profile = user_profile or {}

        # ----------------------------------------------------
        # Build input data
        #
        # These feature names MUST match the features
        # used during model training.
        # ----------------------------------------------------

        input_data = {

            # ------------------------------
            # Cycle features
            # ------------------------------

            "cycle_number": current.get(
                "cycle_number",
                len(cycle_history)
            ),

            "cycle_length_days": current_length,

            "prev_cycle_length": prev_cycle_length,

            "rolling_mean_3": rolling_mean_3,

            "rolling_std_3": rolling_std_3,

            "prev2_mean": prev2_mean,

            "cycle_length_change": cycle_length_change,

            # ------------------------------
            # Current cycle wellness data
            # ------------------------------

            "pain_level": current.get(
                "pain_level"
            ),

            "mood_score": current.get(
                "mood_score"
            ),

            "stress_score_cycle": current.get(
                "stress_score_cycle"
            ),

            "sleep_hours_cycle": current.get(
                "sleep_hours_cycle"
            ),

            "energy_level": current.get(
                "energy_level"
            ),

            "concentration_score": current.get(
                "concentration_score"
            ),

            "work_hours_lost": current.get(
                "work_hours_lost"
            ),

            "estrogen_pgml": current.get(
                "estrogen_pgml"
            ),

            "progesterone_ngml": current.get(
                "progesterone_ngml"
            ),

            "overall_health_score": current.get(
                "overall_health_score"
            ),

            "log_consistency_score": current.get(
                "log_consistency_score"
            ),

            "prepared_before_period": current.get(
                "prepared_before_period"
            ),

            # ------------------------------
            # User profile
            # ------------------------------

            "age": profile.get(
                "age"
            ),

            "bmi": profile.get(
                "bmi"
            ),

            "sleep_hours": profile.get(
                "sleep_hours"
            ),

            "caffeine_intake": profile.get(
                "caffeine_intake"
            ),

            "water_intake_liters": profile.get(
                "water_intake_liters"
            ),

            "birth_control_use": profile.get(
                "birth_control_use"
            ),

            "pcos_diagnosed": profile.get(
                "pcos_diagnosed"
            ),

            "stress_score_baseline": profile.get(
                "stress_score_baseline"
            ),

            # ------------------------------
            # Current cycle categorical data
            # ------------------------------

            "cycle_phase": current.get(
                "cycle_phase"
            ),

            "flow_level": current.get(
                "flow_level"
            ),

            "pms_symptoms": current.get(
                "pms_symptoms"
            ),

            "ovulation_result": current.get(
                "ovulation_result"
            ),

            # ------------------------------
            # Profile categorical data
            # ------------------------------

            "diet_quality": profile.get(
                "diet_quality"
            ),

            "exercise_frequency": profile.get(
                "exercise_frequency"
            ),

            "alcohol_consumption": profile.get(
                "alcohol_consumption"
            ),

            "smoking_status": profile.get(
                "smoking_status"
            ),
        }

        # ----------------------------------------------------
        # Convert to DataFrame
        # ----------------------------------------------------

        input_df = pd.DataFrame(
            [input_data]
        )

        # ----------------------------------------------------
        # Predict
        # ----------------------------------------------------

        prediction = model.predict(
            input_df
        )[0]

        # ----------------------------------------------------
        # Round prediction
        # ----------------------------------------------------

        predicted_length = round(
            float(prediction)
        )

        # ----------------------------------------------------
        # Keep prediction within reasonable range
        # ----------------------------------------------------

        predicted_length = max(
            21,
            min(35, predicted_length)
        )

        print(
            "ML cycle prediction: "
            f"{predicted_length} days"
        )

        return predicted_length

    except Exception as e:

        print(
            "ML cycle prediction failed: "
            f"{e}"
        )

        return None


# ============================================================
# CYCLE IRREGULARITY ANALYSIS
# ============================================================

def analyze_cycle_irregularity(
    cycle_history: List[dict]
) -> dict:
    """
    Analyze cycle irregularity from history.
    """

    if len(cycle_history) < 2:

        return {
            "is_regular": True,
            "variation": 0,
            "observation": "",
        }

    lengths = [
        c.get("cycle_length", 28)
        for c in cycle_history
    ]

    variation = (
        max(lengths)
        - min(lengths)
    )

    std_dev = (
        statistics.stdev(lengths)
        if len(lengths) > 1
        else 0
    )

    is_regular = (
        variation <= 7
        and std_dev <= 3
    )

    if not is_regular:

        observation = (
            "Your cycle lengths show some variation. "
            "This is common and can be influenced by "
            "stress, diet, and lifestyle. "
            "If concerned, please consult a "
            "healthcare professional."
        )

    else:

        observation = (
            "Your cycles appear regular based on "
            "your recent logs."
        )

    return {

        "is_regular": is_regular,

        "variation": variation,

        "std_dev": round(
            std_dev,
            1
        ),

        "average_length": round(
            statistics.mean(lengths),
            1
        ),

        "observation": observation,
    }


# ============================================================
# PHASE GUIDE
# ============================================================

PHASE_GUIDE = {

    "menstrual": {

        "phase_name": "Menstrual Phase",

        "description": (
            "Your body is shedding the uterine lining. "
            "Focus on rest and recovery."
        ),

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
            "Heating pads for comfort",
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

        "description": (
            "Estrogen is rising and energy is building. "
            "Great time to take on new challenges."
        ),

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

        "description": (
            "Peak estrogen levels. Energy and confidence "
            "are typically highest."
        ),

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

        "description": (
            "Progesterone rises. Your body is preparing "
            "for the next cycle. Focus on balance."
        ),

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


# ============================================================
# GET PHASE GUIDE
# ============================================================

def get_phase_guide(
    phase: str
) -> dict:
    """
    Get wellness guide for a cycle phase.
    """

    return PHASE_GUIDE.get(
        phase,
        PHASE_GUIDE["follicular"]
    )


# ============================================================
# COMPREHENSIVE CYCLE STATS & FALLBACK PREDICTION
# ============================================================

def calculate_cycle_history_stats(
    cycle_history: List[dict]
) -> dict:
    """
    Calculate comprehensive historical statistics from user's logged cycles.
    """
    if not cycle_history:
        return {
            "total_cycles": 0,
            "average_cycle_length": None,
            "average_period_length": None,
            "shortest_cycle": None,
            "longest_cycle": None,
            "cycle_variability": None,
            "is_regular": True,
            "observation": "Log at least two cycle records to analyze historical patterns."
        }

    cycle_lengths = [
        int(c["cycle_length"])
        for c in cycle_history
        if c.get("cycle_length") is not None
    ]
    period_lengths = [
        int(c["period_length"])
        for c in cycle_history
        if c.get("period_length") is not None
    ]

    total = len(cycle_history)
    avg_cycle = round(statistics.mean(cycle_lengths), 1) if cycle_lengths else 28.0
    avg_period = round(statistics.mean(period_lengths), 1) if period_lengths else 5.0
    shortest = min(cycle_lengths) if cycle_lengths else None
    longest = max(cycle_lengths) if cycle_lengths else None
    variability = round(statistics.stdev(cycle_lengths), 1) if len(cycle_lengths) > 1 else 0.0

    irregularity = analyze_cycle_irregularity(cycle_history)

    return {
        "total_cycles": total,
        "average_cycle_length": avg_cycle,
        "average_period_length": avg_period,
        "shortest_cycle": shortest,
        "longest_cycle": longest,
        "cycle_variability": variability,
        "is_regular": irregularity.get("is_regular", True),
        "observation": irregularity.get("observation", "Your cycle lengths appear regular.")
    }


def predict_next_cycle_with_fallback(
    cycle_history: List[dict],
    user_profile: Optional[dict] = None,
) -> dict:
    """
    Predict next cycle date and length using trained ML model if available,
    falling back to historical average or baseline.
    """
    disclaimer = (
        "Cycle predictions are estimates based on your logged patterns. "
        "They are general wellness guidance and not medical certainty or guarantees of fertility."
    )

    if not cycle_history:
        today = date.today()
        metrics = calculate_cycle_metrics(today, 28, 5)
        return {
            "predicted_next_period": metrics["predicted_next_cycle"],
            "predicted_cycle_length": 28,
            "confidence": "standard_estimate",
            "method": "default_baseline",
            "ovulation_date": metrics["ovulation_date"],
            "fertile_window_start": metrics["fertile_window_start"],
            "fertile_window_end": metrics["fertile_window_end"],
            "current_phase": metrics["current_phase"],
            "cycle_day": metrics["cycle_day"],
            "days_until_next_period": metrics["days_until_next_period"],
            "disclaimer": disclaimer,
        }

    # Latest logged cycle
    latest = cycle_history[-1]
    latest_start = latest.get("period_start")
    if isinstance(latest_start, str):
        latest_start = date.fromisoformat(latest_start)
    elif not isinstance(latest_start, date):
        latest_start = date.today()

    period_length = latest.get("period_length", 5) or 5

    # Attempt ML Prediction
    ml_prediction = predict_next_cycle_ml(cycle_history, user_profile=user_profile)

    if ml_prediction is not None:
        predicted_length = ml_prediction
        method = "ml"
        confidence = "high" if len(cycle_history) >= 3 else "moderate"
    else:
        # Fallback to historical average
        valid_lengths = [
            c.get("cycle_length")
            for c in cycle_history
            if c.get("cycle_length") is not None
        ]
        if valid_lengths:
            predicted_length = round(statistics.mean(valid_lengths))
            predicted_length = max(21, min(35, predicted_length))
            method = "historical_average"
            confidence = "moderate"
        else:
            predicted_length = latest.get("cycle_length", 28) or 28
            method = "default_baseline"
            confidence = "standard_estimate"

    metrics = calculate_cycle_metrics(latest_start, predicted_length, period_length)

    return {
        "predicted_next_period": metrics["predicted_next_cycle"],
        "predicted_cycle_length": predicted_length,
        "confidence": confidence,
        "method": method,
        "ovulation_date": metrics["ovulation_date"],
        "fertile_window_start": metrics["fertile_window_start"],
        "fertile_window_end": metrics["fertile_window_end"],
        "current_phase": metrics["current_phase"],
        "cycle_day": metrics["cycle_day"],
        "days_until_next_period": metrics["days_until_next_period"],
        "disclaimer": disclaimer,
    }