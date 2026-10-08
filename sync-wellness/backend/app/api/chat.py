import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import (
    Cycle,
    MoodLog,
    Symptom,
    ChatHistory,
    Conversation,
    ChatMessage,
)
from app.schemas.wellness import (
    ChatRequest,
    ChatResponse,
    ChatMessageResponse,
    ConversationResponse,
)
from app.ai.gemini_service import (
    gemini_service,
    build_user_wellness_context,
)
from app.ai.cycle_engine import (
    calculate_cycle_metrics,
    predict_next_cycle_with_fallback,
)
from app.ai.mood_engine import (
    mood_summary,
    MOOD_SCORE_BASE,
)

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


# ============================================================
# SEND CHAT MESSAGE (GEMINI POWERED + WELLNESS CONTEXT)
# ============================================================

@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    response_model=ChatResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Authenticated chatbot endpoint powered by Google Gemini.
    Incorporates minimal, privacy-preserving user wellness context
    (cycle phase, recent mood, symptoms) and strictly isolates data.
    """
    user_query = req.message or req.question or ""
    if not user_query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    # 1. Fetch User's Recent Wellness Context (Secure & Minimal)
    latest_cycle = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start.desc())
        .first()
    )

    cycle_info = None
    if latest_cycle:
        history = (
            db.query(Cycle)
            .filter(Cycle.user_id == current_user.id)
            .order_by(Cycle.period_start)
            .all()
        )
        h_dicts = [
            {"period_start": c.period_start, "cycle_length": c.cycle_length, "period_length": c.period_length}
            for c in history
        ]
        prediction = predict_next_cycle_with_fallback(h_dicts, user_profile={"age": current_user.age})
        cycle_info = {
            "has_data": True,
            "metrics": {
                "cycle_day": prediction.get("cycle_day"),
                "current_phase": prediction.get("current_phase"),
                "predicted_next_cycle": prediction.get("predicted_next_period"),
                "days_until_next_period": prediction.get("days_until_next_period"),
            }
        }

    # Fetch recent mood entries
    recent_moods = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == current_user.id)
        .order_by(MoodLog.date.desc())
        .limit(7)
        .all()
    )
    mood_info = None
    if recent_moods:
        m_dicts = [
            {
                "mood": m.mood,
                "mood_score": m.mood_score or MOOD_SCORE_BASE.get(m.mood.lower(), 5),
                "stress_level": m.stress_level,
                "anxiety_level": m.anxiety_level,
                "energy_level": m.energy_level,
                "sleep_hours": m.sleep_hours,
            }
            for m in recent_moods
        ]
        mood_info = mood_summary(m_dicts)

    # Fetch recent symptoms
    recent_symptoms = (
        db.query(Symptom.symptom_type)
        .filter(Symptom.user_id == current_user.id)
        .order_by(Symptom.date.desc())
        .limit(5)
        .all()
    )
    symptom_names = [s[0] for s in recent_symptoms]

    wellness_context = build_user_wellness_context(
        cycle_info=cycle_info,
        recent_mood=mood_info,
        recent_symptoms=symptom_names,
    )

    # 2. Manage Conversation & Message History
    conversation = None
    if req.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == req.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )

    if not conversation:
        conversation = Conversation(
            user_id=current_user.id,
            title=user_query[:50],
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Retrieve recent chat history for conversation continuity
    history_msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.conversation_id == conversation.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(6)
        .all()
    )
    history_dicts = [{"role": m.role, "content": m.content} for m in history_msgs]

    # 3. Call Gemini AI Service
    answer, sources = await gemini_service.generate_response(
        user_message=user_query,
        wellness_context=wellness_context,
        chat_history=history_dicts,
    )

    # 4. Save User Message & Assistant Response
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=user_query,
    )
    bot_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        sources=json.dumps(sources),
    )
    db.add(user_msg)
    db.add(bot_msg)

    # Also persist to legacy ChatHistory for full backward compatibility
    history_entry = ChatHistory(
        user_id=current_user.id,
        question=user_query,
        answer=answer,
        sources=json.dumps(sources),
    )
    db.add(history_entry)

    db.commit()
    db.refresh(history_entry)

    return ChatResponse(
        id=history_entry.id,
        message=user_query,
        question=user_query,
        response=answer,
        answer=answer,
        conversation_id=conversation.id,
        sources=sources,
        timestamp=history_entry.timestamp or datetime.utcnow(),
    )


# ============================================================
# GET CHAT HISTORY (USER ISOLATED)
# ============================================================

@router.get(
    "/history",
    response_model=List[ChatResponse],
)
def get_chat_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get chat history for the authenticated user only.
    Users cannot access another user's chat messages.
    """
    history = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for h in history:
        sources_list = []
        if h.sources:
            try:
                sources_list = json.loads(h.sources)
            except Exception:
                sources_list = [h.sources]

        result.append(
            ChatResponse(
                id=h.id,
                message=h.question,
                question=h.question,
                response=h.answer,
                answer=h.answer,
                sources=sources_list,
                timestamp=h.timestamp or datetime.utcnow(),
            )
        )

    return result


# ============================================================
# CLEAR CHAT HISTORY (USER ISOLATED)
# ============================================================

@router.delete(
    "/history",
    status_code=status.HTTP_204_NO_CONTENT,
)
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear all chat history and conversations for the authenticated user.
    """
    db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).delete()
    db.query(Conversation).filter(Conversation.user_id == current_user.id).delete()
    db.commit()

    return None
