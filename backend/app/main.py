"""PlaceIQ API — FastAPI application entrypoint.

An initiative by Vansh Malik, BITS Pilani.
"""

import time
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import SessionLocal, init_db
from .routers import (
    admin,
    analytics,
    auth,
    companies,
    experiences,
    health,
    me,
    offers,
    outreach,
    resume,
    stats,
)

app = FastAPI(
    title="PlaceIQ API",
    description="BITS Pilani Placement & PS intelligence platform — an initiative by Vansh Malik.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(offers.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(outreach.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(experiences.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# Dev convenience: create tables on import (idempotent create_all; no Alembic yet).
init_db()

# Seed the built-in outreach template library on startup if the table is empty.
with SessionLocal() as _db:
    outreach.seed_default_templates(_db)

EXPORT_DIR = Path(__file__).resolve().parent.parent / "uploads" / "exports"
EXPORT_MAX_AGE_SECONDS = 24 * 3600


def cleanup_old_exports(
    export_dir: Path = EXPORT_DIR, max_age_seconds: int = EXPORT_MAX_AGE_SECONDS
) -> None:
    """Delete exported files older than 24h (privacy retention, best-effort)."""
    try:
        cutoff = time.time() - max_age_seconds
        for entry in export_dir.glob("*"):
            try:
                if entry.is_file() and entry.stat().st_mtime < cutoff:
                    entry.unlink()
            except OSError:
                continue
    except OSError:
        pass


# Resumes contain PII — prune stale exports on every startup.
cleanup_old_exports()
