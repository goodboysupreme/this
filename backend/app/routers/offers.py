"""Offer explorer endpoint with filters."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import OfferOut
from ..services import offers as offer_service

router = APIRouter(tags=["offers"])


@router.get("/offers", response_model=list[OfferOut])
def list_offers(
    type: str | None = None,
    year: int | None = None,
    branch: str | None = None,
    company_id: int | None = None,
    role_category: str | None = None,
    min_cg: float | None = Query(None, ge=0, le=10),
    max_cg: float | None = Query(None, ge=0, le=10),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[OfferOut]:
    offers = offer_service.filter_offers(
        db,
        type=type,
        year=year,
        branch=branch,
        company_id=company_id,
        role_category=role_category,
        min_cg=min_cg,
        max_cg=max_cg,
        limit=limit,
    )
    return [
        OfferOut(
            id=o.id,
            company_id=o.company_id,
            company_name=o.company.name,
            company_slug=o.company.slug,
            type=o.type,
            year=o.year,
            role=o.role,
            role_category=o.role_category,
            branch=o.branch,
            cgpa_cutoff=o.cgpa_cutoff,
            stipend_ctc=o.stipend_ctc,
            slots=o.slots,
        )
        for o in offers
    ]
