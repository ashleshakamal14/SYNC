from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Nutrition
from app.schemas.wellness import NutritionCreate, NutritionUpdate, NutritionResponse

router = APIRouter(prefix="/api/nutrition", tags=["Nutrition"])


@router.post("", response_model=NutritionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=NutritionResponse, status_code=status.HTTP_201_CREATED)
def create_nutrition(
    n_in: NutritionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = Nutrition(
        user_id=current_user.id,
        date=n_in.date,
        water_intake=n_in.water_intake,
        iron_level=n_in.iron_level,
        hemoglobin=n_in.hemoglobin,
        diet_plan=n_in.diet_plan,
        meals=n_in.meals,
        notes=n_in.notes,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return NutritionResponse.model_validate(n)


@router.get("", response_model=List[NutritionResponse])
@router.get("/", response_model=List[NutritionResponse])
def get_nutrition(

    skip: int = 0,
    limit: int = 60,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(Nutrition)
        .filter(Nutrition.user_id == current_user.id)
        .order_by(Nutrition.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [NutritionResponse.model_validate(n) for n in logs]


@router.get("/today", response_model=dict)
def get_today_nutrition(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import date
    today = date.today()
    n = db.query(Nutrition).filter(
        Nutrition.user_id == current_user.id,
        Nutrition.date == today,
    ).first()

    if not n:
        return {"has_data": False, "date": str(today)}

    return {"has_data": True, "log": NutritionResponse.model_validate(n)}


@router.get("/{nutrition_id}", response_model=NutritionResponse)
def get_nutrition_entry(
    nutrition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = db.query(Nutrition).filter(
        Nutrition.id == nutrition_id, Nutrition.user_id == current_user.id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    return NutritionResponse.model_validate(n)


@router.put("/{nutrition_id}", response_model=NutritionResponse)
def update_nutrition(
    nutrition_id: int,
    update: NutritionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = db.query(Nutrition).filter(
        Nutrition.id == nutrition_id, Nutrition.user_id == current_user.id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    for field, value in update.model_dump(exclude_none=True).items():
        setattr(n, field, value)
    db.commit()
    db.refresh(n)
    return NutritionResponse.model_validate(n)


@router.delete("/{nutrition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nutrition(
    nutrition_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = db.query(Nutrition).filter(
        Nutrition.id == nutrition_id, Nutrition.user_id == current_user.id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    db.delete(n)
    db.commit()
