"""
Mood Analysis Engine
Sentiment analysis + pattern detection for mood data.
Uses rule-based analysis with optional ML enhancement.
"""
from typing import List, Optional, Dict
from datetime import date, timedelta
import re


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
    Simple rule-based sentiment analysis.
    Returns score -1 (very negative) to 1 (very positive).
    """
    # Start with mood base valence
    score = MOOD_VALENCE.get(mood, 0.0)

    if not text:
        return score

    words = set(re.findall(r'\b[a-z]+\b', text.lower()))
    pos_count = len(words & POSITIVE_WORDS)
    neg_count = len(words & NEGATIVE_WORDS)

    if pos_count + neg_count > 0:
        text_score = (pos_count - neg_count) / (pos_count + neg_count)
        # Blend mood score and text score
        score = 0.4 * score + 0.6 * text_score

    return round(max(-1.0, min(1.0, score)), 3)


def detect_mood_patterns(mood_logs: List[Dict]) -> List[str]:
    """
    Detect patterns in mood data.
    Returns list of observations (NOT diagnoses).
    """
    if not mood_logs or len(mood_logs) < 5:
        return []

    patterns = []
    recent = mood_logs[-14:]  # Last 2 weeks

    # Check average stress
    stress_vals = [m["stress_level"] for m in recent if m.get("stress_level")]
    if stress_vals:
        avg_stress = sum(stress_vals) / len(stress_vals)
        if avg_stress >= 7:
            patterns.append(
                "Your recent logs show elevated stress levels. "
                "Consider incorporating stress-reduction practices like deep breathing or meditation."
            )
        elif avg_stress <= 3:
            patterns.append("Your stress levels appear well-managed in recent entries. Great work!")

    # Check energy trends
    energy_vals = [m["energy_level"] for m in recent if m.get("energy_level")]
    if energy_vals:
        avg_energy = sum(energy_vals) / len(energy_vals)
        if avg_energy <= 4:
            patterns.append(
                "Low energy levels noted in recent entries. "
                "Ensure you're getting adequate sleep, nutrition, and hydration."
            )

    # Mood frequency
    moods = [m["mood"] for m in recent]
    negative_moods = [m for m in moods if m in {"sad", "anxious", "irritated"}]
    if len(negative_moods) >= len(recent) * 0.6:
        patterns.append(
            "You've logged more challenging moods recently. "
            "Reaching out to someone you trust or a wellness professional can help. "
            "Remember, it's okay to ask for support."
        )

    happy_moods = [m for m in moods if m in {"happy", "energetic", "calm"}]
    if len(happy_moods) >= len(recent) * 0.7:
        patterns.append("Your mood logs have been mostly positive recently. Keep up the good self-care!")

    return patterns


def mood_summary(mood_logs: List[Dict]) -> Dict:
    """Generate a mood summary from logs."""
    if not mood_logs:
        return {"average_mood": None, "dominant_mood": None, "patterns": []}

    moods = [m["mood"] for m in mood_logs]
    mood_counts: Dict[str, int] = {}
    for m in moods:
        mood_counts[m] = mood_counts.get(m, 0) + 1

    dominant = max(mood_counts, key=mood_counts.get)
    patterns = detect_mood_patterns(mood_logs)

    # Average sentiment score
    scores = [m.get("sentiment_score") for m in mood_logs if m.get("sentiment_score") is not None]
    avg_score = round(sum(scores) / len(scores), 2) if scores else None

    return {
        "dominant_mood": dominant,
        "mood_distribution": mood_counts,
        "average_sentiment": avg_score,
        "patterns": patterns,
        "total_logs": len(mood_logs),
    }
