"""
Recommendation Engine
Generates personalized wellness recommendations based on user data.
All recommendations are general wellness suggestions — not medical prescriptions.
"""
from typing import Optional, List, Dict


def generate_recommendations(
    phase: Optional[str],
    mood: Optional[str],
    symptoms: Optional[List[str]],
    water_intake: Optional[float],
    energy_level: Optional[int],
    stress_level: Optional[int],
) -> Dict:
    """
    Generate personalized wellness recommendations.
    Always includes an explainable reason.
    Never makes medical claims.
    """
    recs = []

    # --- Hydration ---
    if water_intake is not None and water_intake < 2.0:
        recs.append({
            "category": "hydration",
            "title": "Increase Water Intake",
            "suggestion": "Try to drink at least 2–2.5 liters of water today. "
                          "Proper hydration supports energy, skin health, and overall wellness.",
            "reason": f"Your logged water intake ({water_intake:.1f}L) is below the general recommended amount.",
            "priority": "high",
            "emoji": "💧",
        })

    # --- Stress ---
    if stress_level and stress_level >= 7:
        recs.append({
            "category": "stress",
            "title": "Stress Management",
            "suggestion": "Consider a 10-minute breathing exercise or short meditation session. "
                          "Apps like Calm or simple box breathing (4-4-4-4) can help.",
            "reason": f"Your logged stress level is {stress_level}/10.",
            "priority": "high",
            "emoji": "🧘",
        })

    # --- Energy ---
    if energy_level and energy_level <= 4:
        recs.append({
            "category": "energy",
            "title": "Boost Your Energy",
            "suggestion": "A 20-minute nap, a light walk, or a protein-rich snack can help restore energy. "
                          "Also ensure you're getting 7-9 hours of sleep tonight.",
            "reason": f"Your logged energy level is {energy_level}/10.",
            "priority": "medium",
            "emoji": "⚡",
        })

    # --- Symptom-based ---
    if symptoms:
        if "cramps" in symptoms:
            recs.append({
                "category": "comfort",
                "title": "Cramp Relief",
                "suggestion": "Gentle heat application, light walking, and staying hydrated may help with cramp discomfort. "
                              "Magnesium-rich foods like dark chocolate and nuts are often suggested for support.",
                "reason": "Cramps were logged in your symptoms.",
                "priority": "medium",
                "emoji": "🌡️",
            })
        if "fatigue" in symptoms:
            recs.append({
                "category": "energy",
                "title": "Rest and Recovery",
                "suggestion": "Prioritize rest today. Iron-rich foods like lentils and spinach, "
                              "combined with vitamin C, support energy levels.",
                "reason": "Fatigue was logged as a symptom.",
                "priority": "medium",
                "emoji": "😴",
            })
        if "acne" in symptoms:
            recs.append({
                "category": "skin",
                "title": "Skin Care",
                "suggestion": "Staying well hydrated, reducing sugar intake, and keeping skin clean "
                              "may support skin health during hormonal changes.",
                "reason": "Acne was noted in your symptoms.",
                "priority": "low",
                "emoji": "✨",
            })
        if "headache" in symptoms:
            recs.append({
                "category": "comfort",
                "title": "Headache Relief",
                "suggestion": "Drink water, rest in a quiet dark room if possible, "
                              "and consider a light neck/shoulder stretch. "
                              "Persistent or severe headaches should be evaluated by a healthcare professional.",
                "reason": "Headache was logged in your symptoms.",
                "priority": "medium",
                "emoji": "💆",
            })

    # --- Phase-based ---
    if phase == "menstrual":
        recs.append({
            "category": "nutrition",
            "title": "Iron-Rich Foods Today",
            "suggestion": "Include iron-rich foods like lentils, spinach, fortified cereals, "
                          "or lean meat to support energy during your period.",
            "reason": "You're in the menstrual phase, when iron replenishment is especially supportive.",
            "priority": "medium",
            "emoji": "🥬",
        })
    elif phase == "follicular":
        recs.append({
            "category": "activity",
            "title": "Great Time for Exercise",
            "suggestion": "Your energy is building — consider increasing your workout intensity "
                          "with cardio or strength training.",
            "reason": "During the follicular phase, energy levels typically rise.",
            "priority": "low",
            "emoji": "🏃",
        })
    elif phase == "ovulation":
        recs.append({
            "category": "nutrition",
            "title": "Antioxidant-Rich Foods",
            "suggestion": "Berries, leafy greens, and zinc-rich foods like pumpkin seeds "
                          "support overall wellness during ovulation.",
            "reason": "You're in the ovulation phase.",
            "priority": "low",
            "emoji": "🫐",
        })
    elif phase == "luteal":
        recs.append({
            "category": "nutrition",
            "title": "Balanced Meals & Comfort",
            "suggestion": "Complex carbohydrates like oats and sweet potatoes may help manage "
                          "energy and mood. Reduce caffeine to support sleep quality.",
            "reason": "The luteal phase often brings changes in energy and mood.",
            "priority": "medium",
            "emoji": "🥗",
        })

    # --- Mood-based ---
    if mood in {"anxious", "irritated", "sad"}:
        recs.append({
            "category": "mental_wellness",
            "title": "Emotional Wellness",
            "suggestion": "Journaling, a walk in nature, or talking to a trusted friend "
                          "can support emotional wellbeing. Be compassionate with yourself today.",
            "reason": f"You logged feeling {mood}.",
            "priority": "medium",
            "emoji": "💛",
        })

    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recs.sort(key=lambda x: priority_order.get(x["priority"], 3))

    return {
        "recommendations": recs,
        "disclaimer": (
            "These are general wellness suggestions based on your logged data. "
            "They are not medical advice. Please consult a qualified healthcare "
            "professional for any health concerns."
        ),
    }
