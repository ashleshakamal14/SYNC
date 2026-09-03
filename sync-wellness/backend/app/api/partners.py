import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Partner
from app.schemas.wellness import PartnerInvite, PartnerUpdate, PartnerResponse

router = APIRouter(prefix="/api/partners", tags=["Partner Mode"])


@router.post("/invite", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
def invite_partner(
    invite: PartnerInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Prevent duplicate invites
    existing = db.query(Partner).filter(
        Partner.user_id == current_user.id,
        Partner.partner_email == invite.partner_email,
        Partner.status != "revoked",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Partner invitation already exists")

    token = secrets.token_urlsafe(32)
    partner = Partner(
        user_id=current_user.id,
        partner_email=invite.partner_email,
        permission_cycle=int(invite.permission_cycle),
        permission_mood=int(invite.permission_mood),
        permission_profile=int(invite.permission_profile),
        invite_token=token,
        status="pending",
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)

    # In production, send invite email here
    return _to_response(partner)


@router.get("", response_model=List[PartnerResponse])
@router.get("/", response_model=List[PartnerResponse])
def get_partners(

    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    partners = db.query(Partner).filter(
        Partner.user_id == current_user.id,
        Partner.status != "revoked",
    ).all()
    return [_to_response(p) for p in partners]


@router.put("/{partner_id}", response_model=PartnerResponse)
def update_partner_permissions(
    partner_id: int,
    update: PartnerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(Partner).filter(
        Partner.id == partner_id, Partner.user_id == current_user.id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")

    if update.permission_cycle is not None:
        p.permission_cycle = int(update.permission_cycle)
    if update.permission_mood is not None:
        p.permission_mood = int(update.permission_mood)
    if update.permission_profile is not None:
        p.permission_profile = int(update.permission_profile)

    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.post("/{partner_id}/revoke", response_model=PartnerResponse)
def revoke_partner(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(Partner).filter(
        Partner.id == partner_id, Partner.user_id == current_user.id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    p.status = "revoked"
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.post("/accept/{token}")
def accept_partner_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(Partner).filter(Partner.invite_token == token, Partner.status == "pending").first()
    if not p:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")

    p.status = "accepted"
    p.partner_user_id = current_user.id
    db.commit()
    return {"message": "Partner invitation accepted"}


def _to_response(p: Partner) -> PartnerResponse:
    return PartnerResponse(
        id=p.id,
        user_id=p.user_id,
        partner_email=p.partner_email,
        permission_cycle=bool(p.permission_cycle),
        permission_mood=bool(p.permission_mood),
        permission_profile=bool(p.permission_profile),
        status=p.status,
        created_at=p.created_at,
    )
