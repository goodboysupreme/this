"""Admin endpoints, guarded by the X-Admin-Key header.

Experience moderation, dataset upload (reuses the scripts/ingest
normalizers) and a small analytics overview.
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Company, Experience, Offer, PageEvent, User
from ..schemas import (
    AdminAnalyticsOut,
    AdminAnalyticsTotals,
    CsvImportResult,
    ExperienceBankItem,
    OkOut,
    PageEventCount,
)

router = APIRouter(prefix="/admin", tags=["admin"])

DATASET_KINDS = ("placement", "ps1", "ps2", "si", "companies")

SCRIPTS_DIR = Path(__file__).resolve().parents[3] / "scripts"


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    if x_admin_key != settings.admin_key:
        raise HTTPException(status_code=403, detail="invalid or missing admin key")


def _import_ingest_modules():
    """Import the scripts/ingest normalizers (they live outside the package)."""
    if str(SCRIPTS_DIR) not in sys.path:
        sys.path.insert(0, str(SCRIPTS_DIR))
    from ingest import common, ingest_companies  # noqa: PLC0415

    return common, ingest_companies


def _experience_item(experience: Experience, company: Company) -> ExperienceBankItem:
    return ExperienceBankItem(
        id=experience.id,
        company_name=company.name,
        company_slug=company.slug,
        type=experience.type,
        year=experience.year,
        author_hint=experience.author_hint,
        content=experience.content,
    )


@router.get("/experiences/pending", response_model=list[ExperienceBankItem])
def list_pending_experiences(
    _: None = Depends(require_admin), db: Session = Depends(get_db)
) -> list[ExperienceBankItem]:
    stmt = (
        select(Experience, Company)
        .join(Company, Company.id == Experience.company_id)
        .where(Experience.approved.is_(False))
        .order_by(Experience.id.desc())
    )
    return [_experience_item(e, c) for e, c in db.execute(stmt).all()]


def _get_experience_or_404(db: Session, experience_id: int) -> Experience:
    experience = db.get(Experience, experience_id)
    if experience is None:
        raise HTTPException(status_code=404, detail="experience not found")
    return experience


@router.post("/experiences/{experience_id}/approve", response_model=OkOut)
def approve_experience(
    experience_id: int,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OkOut:
    experience = _get_experience_or_404(db, experience_id)
    experience.approved = True
    db.commit()
    return OkOut()


@router.post("/experiences/{experience_id}/reject", response_model=OkOut)
def reject_experience(
    experience_id: int,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OkOut:
    experience = _get_experience_or_404(db, experience_id)
    db.delete(experience)
    db.commit()
    return OkOut()


def _get_or_create_company(db: Session, name: str, slugify) -> Company:
    slug = slugify(name)
    company = db.execute(
        select(Company).where(Company.slug == slug)
    ).scalar_one_or_none()
    if company is None:
        company = Company(name=name, slug=slug)
        db.add(company)
        db.flush()
    return company


def _import_dataset(db: Session, path: Path, kind: str) -> CsvImportResult:
    """Normalize the file with the scripts/ingest normalizers and insert rows.

    Defensive: rows the normalizer cannot map are skipped, duplicate company
    slugs are skipped, and per-row DB errors are skipped rather than aborting
    the whole file.
    """
    common, ingest_companies = _import_ingest_modules()
    df = common.read_table(path)
    raw_rows = len(df)
    imported = 0
    skipped = 0

    if kind == "companies":
        records = ingest_companies.normalize(path)
        skipped = raw_rows - len(records)
        for record in records:
            exists = db.execute(
                select(Company.id).where(Company.slug == record["slug"])
            ).first()
            if exists is not None:
                skipped += 1
                continue
            db.add(Company(**record))
            imported += 1
    else:
        records = common.normalize_frame(df, default_type=kind)
        skipped = raw_rows - len(records)
        for record in records:
            record = dict(record)
            company_name = record.pop("company")
            company = _get_or_create_company(
                db, company_name, ingest_companies.slugify
            )
            db.add(Offer(company_id=company.id, **record))
            imported += 1

    db.commit()
    return CsvImportResult(imported=imported, skipped=skipped)


@router.post("/dataset/upload", response_model=CsvImportResult)
def upload_dataset(
    file: UploadFile = File(...),
    kind: str = Form(...),
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CsvImportResult:
    if kind not in DATASET_KINDS:
        raise HTTPException(
            status_code=422,
            detail=f"kind must be one of {', '.join(DATASET_KINDS)}",
        )
    suffix = Path(file.filename or "upload.csv").suffix.lower()
    if suffix not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(status_code=422, detail="file must be .csv or .xlsx")

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix, prefix="placeiq-dataset-"
        ) as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name
        return _import_dataset(db, Path(tmp_path), kind)
    except HTTPException:
        raise
    except Exception as exc:  # defensive: malformed files must not 500 opaque
        db.rollback()
        raise HTTPException(status_code=422, detail=f"could not import file: {exc}")
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


@router.get("/analytics", response_model=AdminAnalyticsOut)
def admin_analytics(
    _: None = Depends(require_admin), db: Session = Depends(get_db)
) -> AdminAnalyticsOut:
    path_rows = db.execute(
        select(PageEvent.path, func.count().label("count"))
        .group_by(PageEvent.path)
        .order_by(func.count().desc())
    ).all()
    events = db.scalar(select(func.count(PageEvent.id))) or 0
    users = db.scalar(select(func.count(User.id))) or 0
    pending = (
        db.scalar(select(func.count(Experience.id)).where(Experience.approved.is_(False)))
        or 0
    )
    return AdminAnalyticsOut(
        page_events=[PageEventCount(path=p, count=c) for p, c in path_rows],
        totals=AdminAnalyticsTotals(
            events=events, users=users, experiences_pending=pending
        ),
    )
