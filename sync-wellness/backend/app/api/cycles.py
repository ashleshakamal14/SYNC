from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Cycle
from app.schemas.wellness import CycleCreate, CycleUpdate, CycleResponse

from app.ai.cycle_engine import (
    calculate_cycle_metrics,
    predict_next_cycle_ml,
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
    the trained ML cycle prediction model.
    """

    history = (
        db.query(Cycle)
        .filter(Cycle.user_id == cycle.user_id)
        .order_by(Cycle.period_start)
        .all()
    )

    history_dicts = [
        {
            "cycle_length": c.cycle_length,
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

    The trained ML model is used to predict the next cycle
    when enough historical information is available.
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
# GET ALL CYCLES
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
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all cycle records for the logged-in user.
    """

    cycles = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        CycleResponse.model_validate(cycle)
        for cycle in cycles
    ]


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
            "message": (
                "No cycle data yet. "
                "Log your first period to get started!"
            ),
        }

    history = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start)
        .all()
    )

    history_dicts = [
        {
            "cycle_length": c.cycle_length,
        }
        for c in history
    ]

    user_profile = {
        "age": current_user.age,
        "height": current_user.height,
        "weight": current_user.weight,
    }

    # Use the trained ML model to predict the next cycle length.
    predicted_length = (
        predict_next_cycle_ml(
            history_dicts,
            user_profile=user_profile,
        )
        or latest.cycle_length
    )

    metrics = calculate_cycle_metrics(
        latest.period_start,
        predicted_length,
        latest.period_length,
    )

    phase_guide = get_phase_guide(
        metrics["current_phase"]
    )

    irregularity = analyze_cycle_irregularity(
        history_dicts
    )

    return {
        "has_data": True,

        "latest_cycle": CycleResponse.model_validate(
            latest
        ),

        "metrics": metrics,

        "phase_guide": phase_guide,

        "irregularity_analysis": irregularity,

        "disclaimer": (
            "Cycle predictions are estimates based on "
            "your data. They are not medical predictions."
        ),
    }


# ============================================================
# GET SINGLE CYCLE
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
    Get a specific cycle record.
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
            status_code=404,
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
    Update an existing cycle record and
    recalculate ML-based predictions.
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
            status_code=404,
            detail="Cycle record not found",
        )

    update_data = update.model_dump(
        exclude_none=True
    )

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
    Delete a cycle record.
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
            status_code=404,
            detail="Cycle record not found",
        )

    db.delete(cycle)
    db.commit()

    return None