from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Symptom
from app.schemas.wellness import SymptomCreate, SymptomUpdate, SymptomResponse

router = APIRouter(prefix="/api/symptoms", tags=["Symptom Tracking"])


@router.post("", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
def create_symptom(
    symptom_in: SymptomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    symptom = Symptom(
        user_id=current_user.id,
        date=symptom_in.date,
        symptom_type=symptom_in.symptom_type,
        severity=symptom_in.severity,
        notes=symptom_in.notes,
    )
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return SymptomResponse.model_validate(symptom)


@router.get("", response_model=List[SymptomResponse])
@router.get("/", response_model=List[SymptomResponse])
def get_symptoms(

    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    symptoms = (
        db.query(Symptom)
        .filter(Symptom.user_id == current_user.id)
        .order_by(Symptom.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [SymptomResponse.model_validate(s) for s in symptoms]


@router.get("/analysis", response_model=dict)
def get_symptom_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    symptoms = db.query(Symptom).filter(Symptom.user_id == current_user.id).all()
    if not symptoms:
        return {"has_data": False}

    # Frequency by type
    freq: Dict[str, int] = {}
    severity_by_type: Dict[str, List[int]] = {}
    for s in symptoms:
        freq[s.symptom_type] = freq.get(s.symptom_type, 0) + 1
        severity_by_type.setdefault(s.symptom_type, []).append(s.severity)

    avg_severity = {k: round(sum(v) / len(v), 1) for k, v in severity_by_type.items()}
    most_common = sorted(freq.items(), key=lambda x: -x[1])[:5]

    return {
        "has_data": True,
        "frequency": freq,
        "average_severity": avg_severity,
        "most_common": most_common,
        "total_entries": len(symptoms),
    }


@router.get("/{symptom_id}", response_model=SymptomResponse)
def get_symptom(
    symptom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(Symptom).filter(Symptom.id == symptom_id, Symptom.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return SymptomResponse.model_validate(s)


@router.put("/{symptom_id}", response_model=SymptomResponse)
def update_symptom(
    symptom_id: int,
    update: SymptomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(Symptom).filter(Symptom.id == symptom_id, Symptom.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Symptom not found")
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return SymptomResponse.model_validate(s)


@router.delete("/{symptom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_symptom(
    symptom_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = db.query(Symptom).filter(Symptom.id == symptom_id, Symptom.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Symptom not found")
    db.delete(s)
    db.commit()
