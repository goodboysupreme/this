"""Dashboard statistics endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..schemas import StatsSummary
from ..services import stats as stats_service

router = APIRouter(tags=["stats"])


@router.get("/stats/summary", response_model=StatsSummary)
def stats_summary(db: Session = Depends(get_db)) -> StatsSummary:
    return StatsSummary(**stats_service.summary(db))
