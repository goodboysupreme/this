"""Aggregations powering the dashboard summary endpoint."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import OFFER_TYPES, Company, Offer

CG_BUCKETS = ["<6.0", "6.0-7.0", "7.0-8.0", "8.0-9.0", "9.0-10.0"]


def summary(db: Session) -> dict:
    companies_count = db.execute(select(func.count(Company.id))).scalar_one()
    offers_count = db.execute(select(func.count(Offer.id))).scalar_one()

    offers_by_type = {t: 0 for t in OFFER_TYPES}
    for offer_type, count in db.execute(
        select(Offer.type, func.count(Offer.id)).group_by(Offer.type)
    ).all():
        offers_by_type[offer_type] = count

    avg_stipend_by_type: dict[str, float | None] = {}
    for offer_type, avg in db.execute(
        select(Offer.type, func.avg(Offer.stipend_ctc)).group_by(Offer.type)
    ).all():
        avg_stipend_by_type[offer_type] = round(avg, 2) if avg is not None else None

    top_recruiters = [
        {"name": name, "slug": slug, "offer_count": count}
        for name, slug, count in db.execute(
            select(Company.name, Company.slug, func.count(Offer.id))
            .join(Offer, Offer.company_id == Company.id)
            .group_by(Company.id)
            .order_by(func.count(Offer.id).desc())
            .limit(5)
        ).all()
    ]

    distribution = {bucket: 0 for bucket in CG_BUCKETS}
    for (cg,) in db.execute(
        select(Offer.cgpa_cutoff).where(Offer.cgpa_cutoff.is_not(None))
    ).all():
        if cg < 6.0:
            distribution["<6.0"] += 1
        elif cg < 7.0:
            distribution["6.0-7.0"] += 1
        elif cg < 8.0:
            distribution["7.0-8.0"] += 1
        elif cg < 9.0:
            distribution["8.0-9.0"] += 1
        else:
            distribution["9.0-10.0"] += 1

    branch_stats = [
        {
            "branch": branch,
            "offer_count": count,
            "avg_cgpa_cutoff": round(avg, 2) if avg is not None else None,
        }
        for branch, count, avg in db.execute(
            select(Offer.branch, func.count(Offer.id), func.avg(Offer.cgpa_cutoff))
            .where(Offer.branch.is_not(None))
            .group_by(Offer.branch)
            .order_by(func.count(Offer.id).desc())
        ).all()
    ]

    yearly_trend = [
        {
            "year": year,
            "offer_count": count,
            "avg_cgpa_cutoff": round(avg, 2) if avg is not None else None,
        }
        for year, count, avg in db.execute(
            select(Offer.year, func.count(Offer.id), func.avg(Offer.cgpa_cutoff))
            .group_by(Offer.year)
            .order_by(Offer.year)
        ).all()
    ]

    return {
        "companies_count": companies_count,
        "offers_count": offers_count,
        "offers_by_type": offers_by_type,
        "avg_stipend_by_type": avg_stipend_by_type,
        "top_recruiters": top_recruiters,
        "cg_cutoff_distribution": distribution,
        "branch_stats": branch_stats,
        "yearly_trend": yearly_trend,
    }
