from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Cycle
from app.schemas.wellness import (
    CycleCreate,
    CycleUpdate,
    CycleResponse,
    CyclePredictionResponse,
    CycleStatsResponse,
)
from app.ai.cycle_engine import (
    calculate_cycle_metrics,
    predict_next_cycle_ml,
    predict_next_cycle_with_fallback,
    calculate_cycle_history_stats,
    get_phase_guide,
    analyze_cycle_irregularity,
)


router = APIRouter(prefix="/api/cycles", tags=["Cycle Tracking"])


def _enrich_cycle(
    cycle: Cycle,
    db: Session,
    current_user: User,
) -> Cycle:
    """
    Recalculate cycle predictions and phase using
    the trained ML cycle prediction model with reliable fallback.
    """
    history = (
        db.query(Cycle)
        .filter(Cycle.user_id == cycle.user_id)
        .order_by(Cycle.period_start)
        .all()
    )

    history_dicts = [
        {
            "period_start": c.period_start,
            "period_end": c.period_end,
            "cycle_length": c.cycle_length,
            "period_length": c.period_length,
        }
        for c in history
    ]

    user_profile = {
        "age": current_user.age,
        "height": current_user.height,
        "weight": current_user.weight,
    }

    predicted_length = (
        predict_next_cycle_ml(
            history_dicts,
            user_profile=user_profile,
        )
        or cycle.cycle_length
    )

    metrics = calculate_cycle_metrics(
        cycle.period_start,
        predicted_length,
        cycle.period_length,
    )

    cycle.predicted_next_cycle = metrics["predicted_next_cycle"]
    cycle.current_phase = metrics["current_phase"]
    cycle.ovulation_date = metrics["ovulation_date"]
    cycle.fertile_window_start = metrics["fertile_window_start"]
    cycle.fertile_window_end = metrics["fertile_window_end"]

    return cycle


# ============================================================
# CREATE CYCLE
# ============================================================

@router.post(
    "",
    response_model=CycleResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    response_model=CycleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_cycle(
    cycle_in: CycleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new menstrual cycle record.
    The authenticated user's ID is enforced from JWT.
    """
    cycle = Cycle(
        user_id=current_user.id,
        period_start=cycle_in.period_start,
        period_end=cycle_in.period_end,
        cycle_length=cycle_in.cycle_length,
        period_length=cycle_in.period_length,
        notes=cycle_in.notes,
    )

    _enrich_cycle(
        cycle,
        db,
        current_user,
    )

    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    return CycleResponse.model_validate(cycle)


# ============================================================
# GET ALL CYCLES (USER ISOLATED)
# ============================================================

@router.get(
    "",
    response_model=List[CycleResponse],
)
@router.get(
    "/",
    response_model=List[CycleResponse],
)
def get_cycles(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all cycle records for the authenticated user.
    """
    cycles = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [CycleResponse.model_validate(c) for c in cycles]


# ============================================================
# GET CURRENT CYCLE INFORMATION
# ============================================================

@router.get(
    "/current",
    response_model=dict,
)
def get_current_cycle_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the user's latest cycle information,
    ML-based next-cycle prediction, phase information,
    and irregularity analysis.
    """
    latest = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start.desc())
        .first()
    )

    if not latest:
        return {
            "has_data": False,
            "message": "No cycle data yet. Log your first period to get started!",
        }

    history = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start)
        .all()
    )

    history_dicts = [
        {
            "period_start": c.period_start,
            "period_end": c.period_end,
            "cycle_length": c.cycle_length,
            "period_length": c.period_length,
        }
        for c in history
    ]

    user_profile = {
        "age": current_user.age,
        "height": current_user.height,
        "weight": current_user.weight,
    }

    # Prediction with fallback
    prediction_info = predict_next_cycle_with_fallback(
        history_dicts,
        user_profile=user_profile,
    )

    phase_guide = get_phase_guide(
        prediction_info["current_phase"] or "follicular"
    )

    irregularity = analyze_cycle_irregularity(
        history_dicts
    )

    stats = calculate_cycle_history_stats(
        history_dicts
    )

    return {
        "has_data": True,
        "latest_cycle": CycleResponse.model_validate(latest),
        "metrics": {
            "cycle_day": prediction_info["cycle_day"],
            "current_phase": prediction_info["current_phase"],
            "ovulation_date": prediction_info["ovulation_date"],
            "fertile_window_start": prediction_info["fertile_window_start"],
            "fertile_window_end": prediction_info["fertile_window_end"],
            "predicted_next_cycle": prediction_info["predicted_next_period"],
            "days_until_next_period": prediction_info["days_until_next_period"],
            "cycle_length": prediction_info["predicted_cycle_length"],
            "period_length": latest.period_length,
        },
        "prediction": prediction_info,
        "phase_guide": phase_guide,
        "irregularity_analysis": irregularity,
        "stats": stats,
        "disclaimer": prediction_info["disclaimer"],
    }


# ============================================================
# GET CYCLE PREDICTION (PHASE 2 & 3 ENDPOINT)
# ============================================================

@router.get(
    "/prediction",
    response_model=CyclePredictionResponse,
)
def get_cycle_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get estimated next period date using trained ML model
    with fallback to historical average.
    """
    history = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start)
        .all()
    )

    history_dicts = [
        {
            "period_start": c.period_start,
            "period_end": c.period_end,
            "cycle_length": c.cycle_length,
            "period_length": c.period_length,
        }
        for c in history
    ]

    user_profile = {
        "age": current_user.age,
        "height": current_user.height,
        "weight": current_user.weight,
    }

    prediction = predict_next_cycle_with_fallback(
        history_dicts,
        user_profile=user_profile,
    )

    return CyclePredictionResponse(**prediction)


# ============================================================
# GET CYCLE STATS (AVERAGES, VARIABILITY, SHORTEST/LONGEST)
# ============================================================

@router.get(
    "/stats",
    response_model=CycleStatsResponse,
)
def get_cycle_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate user's cycle history statistics:
    average cycle length, average period length, shortest/longest cycle,
    and cycle variability (standard deviation).
    """
    history = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start)
        .all()
    )

    history_dicts = [
        {
            "period_start": c.period_start,
            "period_end": c.period_end,
            "cycle_length": c.cycle_length,
            "period_length": c.period_length,
        }
        for c in history
    ]

    stats = calculate_cycle_history_stats(history_dicts)
    return CycleStatsResponse(**stats)


# ============================================================
# GET SINGLE CYCLE (USER ISOLATED)
# ============================================================

@router.get(
    "/{cycle_id}",
    response_model=CycleResponse,
)
def get_cycle(
    cycle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific cycle record. Enforces user isolation.
    """
    cycle = (
        db.query(Cycle)
        .filter(
            Cycle.id == cycle_id,
            Cycle.user_id == current_user.id,
        )
        .first()
    )

    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cycle record not found",
        )

    return CycleResponse.model_validate(cycle)


# ============================================================
# UPDATE CYCLE
# ============================================================

@router.put(
    "/{cycle_id}",
    response_model=CycleResponse,
)
def update_cycle(
    cycle_id: int,
    update: CycleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing cycle record and recalculate predictions.
    """
    cycle = (
        db.query(Cycle)
        .filter(
            Cycle.id == cycle_id,
            Cycle.user_id == current_user.id,
        )
        .first()
    )

    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cycle record not found",
        )

    update_data = update.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(cycle, field, value)

    _enrich_cycle(
        cycle,
        db,
        current_user,
    )

    db.commit()
    db.refresh(cycle)

    return CycleResponse.model_validate(cycle)


# ============================================================
# DELETE CYCLE
# ============================================================

@router.delete(
    "/{cycle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_cycle(
    cycle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a cycle record. Enforces user isolation.
    """
    cycle = (
        db.query(Cycle)
        .filter(
            Cycle.id == cycle_id,
            Cycle.user_id == current_user.id,
        )
        .first()
    )

    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cycle record not found",
        )

    db.delete(cycle)
    db.commit()

    return None