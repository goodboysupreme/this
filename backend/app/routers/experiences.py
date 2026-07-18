"""Experience bank: public submit (moderated) + approved listing."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Company, Experience
from ..schemas import ExperienceBankItem, ExperienceIn, OkOut
from ..services import companies as company_service

router = APIRouter(prefix="/experiences", tags=["experiences"])


@router.post("", response_model=OkOut, status_code=201)
def submit_experience(
    payload: ExperienceIn, db: Session = Depends(get_db)
) -> OkOut:
    company = company_service.get_by_slug(db, payload.company_slug)
    if company is None:
        raise HTTPException(
            status_code=404, detail=f"company '{payload.company_slug}' not found"
        )
    db.add(
        Experience(
            company_id=company.id,
            type=payload.type,
            year=payload.year,
            author_hint=payload.author_hint,
            content=payload.content,
            approved=False,
        )
    )
    db.commit()
    return OkOut()


@router.get("", response_model=list[ExperienceBankItem])
def list_experiences(
    type: str | None = Query(default=None, description="placement|ps1|ps2|si"),
    company_slug: str | None = None,
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ExperienceBankItem]:
    stmt = (
        select(Experience, Company)
        .join(Company, Company.id == Experience.company_id)
        .where(Experience.approved.is_(True))
        .order_by(Experience.year.desc(), Experience.id.desc())
        .limit(limit)
    )
    if type:
        stmt = stmt.where(Experience.type == type)
    if company_slug:
        stmt = stmt.where(Company.slug == company_slug)
    return [
        ExperienceBankItem(
            id=e.id,
            company_name=c.name,
            company_slug=c.slug,
            type=e.type,
            year=e.year,
            author_hint=e.author_hint,
            content=e.content,
        )
        for e, c in db.execute(stmt).all()
    ]
