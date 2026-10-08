"""
Gemini AI Service for SYNC Women's Wellness Companion
Interacts with the Google Gemini API using the official google-genai SDK.
Strictly preserves privacy and medical safety boundaries.
"""
import logging
from typing import Tuple, List, Optional, Dict, Any
from datetime import date
from app.core.config import settings

logger = logging.getLogger("sync.ai.gemini")

# System Safety Prompt for Gemini
WELLNESS_SYSTEM_INSTRUCTION = """You are SYNC, an empathetic, supportive, and scientifically grounded AI Women's Wellness Companion.
Your purpose is to provide educational, holistic wellness information covering menstrual health, cycle phases, nutrition, sleep, stress management, hydration, and lifestyle comfort.

CRITICAL SAFETY & MEDICAL GUIDELINES:
1. You are a wellness educational companion, NOT a medical doctor or diagnostic system.
2. NEVER diagnose medical conditions, prescribe pharmaceutical dosages, or claim medical certainty.
3. Use gentle, supportive, and non-prescriptive language (e.g., "Many people find gentle heat helpful...", "Nutritional sources rich in iron include...").
4. If a user asks about symptoms or irregularities, provide general educational context and kindly advise them to consult a qualified healthcare provider for personalized medical evaluation.
5. MEDICAL EMERGENCIES: If the user mentions acute severe pain, hemorrhaging/excessive bleeding, sudden severe cramping with fever, difficulty breathing, or emotional distress involving self-harm, immediately and compassionately instruct them to seek emergency medical attention or contact local emergency services.
6. Keep responses concise, warm, structured with bullet points where helpful, and easy to read.
"""


def build_user_wellness_context(
    cycle_info: Optional[Dict[str, Any]] = None,
    recent_mood: Optional[Dict[str, Any]] = None,
    recent_symptoms: Optional[List[str]] = None,
) -> str:
    """
    Constructs a concise, privacy-safe wellness context summary for the LLM.
    Strictly excludes PII, credentials, or private identifiers.
    """
    parts = []

    if cycle_info and cycle_info.get("has_data"):
        metrics = cycle_info.get("metrics") or {}
        cycle_day = metrics.get("cycle_day")
        phase = metrics.get("current_phase")
        next_p = metrics.get("predicted_next_cycle")
        days_until = metrics.get("days_until_next_period")

        c_text = "Current Cycle State: "
        if cycle_day:
            c_text += f"Day {cycle_day} "
        if phase:
            c_text += f"({phase.capitalize()} Phase). "
        if next_p and days_until is not None:
            c_text += f"Next estimated period in ~{days_until} days. "
        parts.append(c_text.strip())

    if recent_mood and recent_mood.get("has_data"):
        m_parts = []
        if recent_mood.get("dominant_mood"):
            m_parts.append(f"Recent mood trend: {recent_mood['dominant_mood']}")
        if recent_mood.get("average_stress") is not None:
            m_parts.append(f"Avg stress: {recent_mood['average_stress']}/10")
        if recent_mood.get("average_energy") is not None:
            m_parts.append(f"Avg energy: {recent_mood['average_energy']}/10")
        if recent_mood.get("average_sleep") is not None:
            m_parts.append(f"Avg sleep: {recent_mood['average_sleep']} hrs")
        if m_parts:
            parts.append("Recent Wellness Indicators: " + ", ".join(m_parts) + ".")

    if recent_symptoms:
        parts.append(f"Recent logged symptoms: {', '.join(recent_symptoms[:5])}.")

    if not parts:
        return "User has not logged cycle or mood data yet."

    return "User's Recent Wellness Context:\n" + "\n".join(f"- {p}" for p in parts)


class GeminiService:
    def __init__(self):
        self._client = None
        self._initialized = False

    def _get_client(self):
        if not self._initialized:
            api_key = settings.GEMINI_API_KEY
            if api_key and api_key not in ["your-gemini-api-key-here", "", None]:
                try:
                    from google import genai
                    self._client = genai.Client(api_key=api_key)
                    logger.info("Gemini AI Client successfully initialized with official SDK.")
                except Exception as e:
                    logger.warning(f"Could not initialize official Gemini Client: {e}")
                    self._client = None
            else:
                logger.info("GEMINI_API_KEY not configured or using mock mode.")
            self._initialized = True
        return self._client

    async def generate_response(
        self,
        user_message: str,
        wellness_context: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[str, List[str]]:
        """
        Sends message to Gemini with system safety guidelines and optional wellness context.
        Returns (response_text, sources_list).
        """
        client = self._get_client()

        if not client:
            from app.ai.rag_engine import get_mock_response
            return get_mock_response(user_message)

        try:
            # Build full prompt
            prompt_parts = []
            if wellness_context and "has not logged" not in wellness_context:
                prompt_parts.append(f"[{wellness_context}]\n")

            if chat_history:
                recent_history = chat_history[-6:]  # Last 3 turns
                for msg in recent_history:
                    role = "User" if msg.get("role") == "user" else "SYNC"
                    prompt_parts.append(f"{role}: {msg.get('content')}")

            prompt_parts.append(f"User: {user_message}")
            full_prompt = "\n".join(prompt_parts)

            # Generate via Gemini 2.5 Flash / 1.5 Flash
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=full_prompt,
                config={
                    "system_instruction": WELLNESS_SYSTEM_INSTRUCTION,
                    "temperature": 0.4,
                }
            )

            answer = response.text or ""
            sources = ["SYNC AI Wellness Engine", "Gemini Clinical & Wellness Knowledge Base"]

            # Ensure medical disclaimer footer is present
            if "professional medical" not in answer.lower() and "doctor" not in answer.lower():
                answer += (
                    "\n\n---\n*SYNC provides general wellness education and is not a substitute "
                    "for professional medical diagnosis or care.*"
                )

            return answer, sources

        except Exception as e:
            logger.error(f"Gemini API generation error: {e}", exc_info=True)
            from app.ai.rag_engine import get_mock_response
            answer, sources = get_mock_response(user_message)
            return answer, sources


# Global singleton instance
gemini_service = GeminiService()
