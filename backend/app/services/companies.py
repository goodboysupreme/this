"""Company query helpers."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import OFFER_TYPES, Company, Experience, Offer


def list_companies(
    db: Session, search: str | None = None, sector: str | None = None
) -> list[tuple[Company, int]]:
    stmt = (
        select(Company, func.count(Offer.id).label("offer_count"))
        .outerjoin(Offer, Offer.company_id == Company.id)
        .group_by(Company.id)
        .order_by(Company.name)
    )
    if search:
        stmt = stmt.where(Company.name.ilike(f"%{search}%"))
    if sector:
        stmt = stmt.where(Company.sector.ilike(sector))
    return [(row[0], row[1]) for row in db.execute(stmt).all()]


def get_by_slug(db: Session, slug: str) -> Company | None:
    return db.execute(select(Company).where(Company.slug == slug)).scalar_one_or_none()


def company_offers(db: Session, company_id: int) -> list[Offer]:
    return list(
        db.execute(
            select(Offer)
            .where(Offer.company_id == company_id)
            .order_by(Offer.year.desc(), Offer.type)
        )
        .scalars()
        .all()
    )


def approved_experiences(db: Session, company_id: int) -> list[Experience]:
    return list(
        db.execute(
            select(Experience)
            .where(Experience.company_id == company_id, Experience.approved.is_(True))
            .order_by(Experience.year.desc())
        )
        .scalars()
        .all()
    )


def offer_types_for(db: Session, company_id: int) -> list[str]:
    present = set(
        db.execute(
            select(Offer.type).where(Offer.company_id == company_id).distinct()
        )
        .scalars()
        .all()
    )
    return [t for t in OFFER_TYPES if t in present]
