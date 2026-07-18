"""Company, cutoff-prediction and compare endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth_deps import get_current_user, get_optional_user
from ..db import get_db
from ..models import Favorite, User
from ..schemas import (
    CompanyDetail,
    CompanyListItem,
    CompareItem,
    CompareResponse,
    CutoffPrediction,
    ExperienceOut,
    FavoriteToggleOut,
    OfferOut,
)
from ..services import companies as company_service
from ..services.cutoff_predictor import predict_for_company

router = APIRouter(tags=["companies"])


def _offer_out(offer) -> OfferOut:
    return OfferOut(
        id=offer.id,
        company_id=offer.company_id,
        company_name=offer.company.name,
        company_slug=offer.company.slug,
        type=offer.type,
        year=offer.year,
        role=offer.role,
        role_category=offer.role_category,
        branch=offer.branch,
        cgpa_cutoff=offer.cgpa_cutoff,
        stipend_ctc=offer.stipend_ctc,
        slots=offer.slots,
    )


def _get_company_or_404(db: Session, slug: str):
    company = company_service.get_by_slug(db, slug)
    if company is None:
        raise HTTPException(status_code=404, detail=f"company '{slug}' not found")
    return company


@router.get("/companies", response_model=list[CompanyListItem])
def list_companies(
    search: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
) -> list[CompanyListItem]:
    return [
        CompanyListItem(
            id=c.id, name=c.name, slug=c.slug, sector=c.sector, offer_count=count
        )
        for c, count in company_service.list_companies(db, search=search, sector=sector)
    ]


@router.get("/companies/{slug}", response_model=CompanyDetail)
def company_detail(
    slug: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> CompanyDetail:
    company = _get_company_or_404(db, slug)
    offers = company_service.company_offers(db, company.id)
    experiences = company_service.approved_experiences(db, company.id)
    predictions = [
        CutoffPrediction(**predict_for_company(db, company, t))
        for t in company_service.offer_types_for(db, company.id)
    ]
    is_favorited = False
    if user is not None:
        is_favorited = (
            db.execute(
                select(Favorite.id).where(
                    Favorite.user_id == user.id, Favorite.company_id == company.id
                )
            ).first()
            is not None
        )
    return CompanyDetail(
        id=company.id,
        name=company.name,
        slug=company.slug,
        sector=company.sector,
        description=company.description,
        offers=[_offer_out(o) for o in offers],
        experiences=[
            ExperienceOut(
                id=e.id,
                type=e.type,
                year=e.year,
                author_hint=e.author_hint,
                content=e.content,
            )
            for e in experiences
        ],
        cutoff_predictions=predictions,
        is_favorited=is_favorited,
    )


@router.post("/companies/{slug}/favorite", response_model=FavoriteToggleOut)
def toggle_favorite(
    slug: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FavoriteToggleOut:
    company = _get_company_or_404(db, slug)
    existing = db.execute(
        select(Favorite).where(
            Favorite.user_id == user.id, Favorite.company_id == company.id
        )
    ).scalar_one_or_none()
    if existing is not None:
        db.delete(existing)
        db.commit()
        return FavoriteToggleOut(favorited=False)
    db.add(Favorite(user_id=user.id, company_id=company.id))
    db.commit()
    return FavoriteToggleOut(favorited=True)


@router.get("/companies/{slug}/cutoff", response_model=CutoffPrediction)
def company_cutoff(
    slug: str,
    type: str = Query(..., description="placement|ps1|ps2|si"),
    db: Session = Depends(get_db),
) -> CutoffPrediction:
    company = _get_company_or_404(db, slug)
    return CutoffPrediction(**predict_for_company(db, company, type))


@router.get("/compare", response_model=CompareResponse)
def compare_companies(
    slugs: str = Query(..., description="comma-separated company slugs, e.g. a,b,c"),
    db: Session = Depends(get_db),
) -> CompareResponse:
    wanted = [s.strip() for s in slugs.split(",") if s.strip()]
    items: list[CompareItem] = []
    missing: list[str] = []
    for slug in wanted:
        company = company_service.get_by_slug(db, slug)
        if company is None:
            missing.append(slug)
            continue
        offers = company_service.company_offers(db, company.id)
        cgs = [o.cgpa_cutoff for o in offers if o.cgpa_cutoff is not None]
        pays = [o.stipend_ctc for o in offers if o.stipend_ctc is not None]
        count = len(offers)
        items.append(
            CompareItem(
                company=CompanyListItem(
                    id=company.id,
                    name=company.name,
                    slug=company.slug,
                    sector=company.sector,
                    offer_count=count,
                ),
                latest_year=max((o.year for o in offers), default=None),
                offer_types=company_service.offer_types_for(db, company.id),
                avg_cgpa_cutoff=round(sum(cgs) / len(cgs), 2) if cgs else None,
                ctc_or_stipend_range=[min(pays), max(pays)] if pays else None,
                cutoff_predictions=[
                    CutoffPrediction(**predict_for_company(db, company, t))
                    for t in company_service.offer_types_for(db, company.id)
                ],
            )
        )
    return CompareResponse(companies=items, missing_slugs=missing)
