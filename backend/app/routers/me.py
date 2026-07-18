"""Endpoints scoped to the authenticated user (saved items)."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth_deps import get_current_user
from ..db import get_db
from ..models import Company, Favorite, Offer, User
from ..schemas import CompanyListItem

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/favorites", response_model=list[CompanyListItem])
def list_favorites(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CompanyListItem]:
    stmt = (
        select(Company, func.count(Offer.id).label("offer_count"))
        .join(Favorite, Favorite.company_id == Company.id)
        .outerjoin(Offer, Offer.company_id == Company.id)
        .where(Favorite.user_id == user.id)
        .group_by(Company.id)
        .order_by(Company.name)
    )
    return [
        CompanyListItem(
            id=c.id, name=c.name, slug=c.slug, sector=c.sector, offer_count=count
        )
        for c, count in db.execute(stmt).all()
    ]
