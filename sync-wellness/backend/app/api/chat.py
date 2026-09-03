import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import ChatHistory
from app.schemas.wellness import ChatRequest, ChatResponse
from app.ai.rag_engine import chat as rag_chat

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def send_message(

    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    answer, sources = await rag_chat(req.question)

    history = ChatHistory(
        user_id=current_user.id,
        question=req.question,
        answer=answer,
        sources=json.dumps(sources),
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return ChatResponse(
        id=history.id,
        question=history.question,
        answer=history.answer,
        sources=sources,
        timestamp=history.timestamp,
    )


@router.get("/history", response_model=List[ChatResponse])
def get_chat_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        sources = json.loads(h.sources) if h.sources else []
        result.append(ChatResponse(
            id=h.id,
            question=h.question,
            answer=h.answer,
            sources=sources,
            timestamp=h.timestamp,
        ))
    return result


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).delete()
    db.commit()
