"""Analytics-lite: unauthenticated page-event ingestion."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import PageEvent
from ..schemas import OkOut, PageEventIn

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/event", response_model=OkOut, status_code=201)
def track_event(payload: PageEventIn, db: Session = Depends(get_db)) -> OkOut:
    db.add(PageEvent(path=payload.path))
    db.commit()
    return OkOut()
