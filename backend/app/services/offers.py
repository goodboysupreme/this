"""Offer query helpers."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Offer


def filter_offers(
    db: Session,
    type: str | None = None,
    year: int | None = None,
    branch: str | None = None,
    company_id: int | None = None,
    role_category: str | None = None,
    min_cg: float | None = None,
    max_cg: float | None = None,
    limit: int = 100,
) -> list[Offer]:
    stmt = select(Offer).order_by(Offer.year.desc(), Offer.company_id)
    if type:
        stmt = stmt.where(Offer.type == type)
    if year:
        stmt = stmt.where(Offer.year == year)
    if branch:
        stmt = stmt.where(Offer.branch.ilike(branch))
    if company_id:
        stmt = stmt.where(Offer.company_id == company_id)
    if role_category:
        stmt = stmt.where(Offer.role_category == role_category)
    if min_cg is not None:
        stmt = stmt.where(Offer.cgpa_cutoff >= min_cg)
    if max_cg is not None:
        stmt = stmt.where(Offer.cgpa_cutoff <= max_cg)
    stmt = stmt.limit(max(1, min(limit, 1000)))
    return list(db.execute(stmt).scalars().all())
