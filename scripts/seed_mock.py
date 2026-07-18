#!/usr/bin/env python
"""Seed the PlaceIQ database with deterministic mock data.

Stands in for real placement/PS/SI datasets until they are provided.
Deterministic: uses a seeded ``random.Random`` so every run produces the
identical dataset.

Usage (from repo root or anywhere):
    python scripts/seed_mock.py [DATABASE_URL]

Default DATABASE_URL: sqlite at ``backend/placeiq.db`` (matches the backend
default when uvicorn runs from ``backend/``).
"""

from __future__ import annotations

import random
import re
import sys
from pathlib import Path
from statistics import median

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import create_engine, select  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

from app.db import Base  # noqa: E402
from app.models import Company, CutoffStat, Experience, Offer  # noqa: E402

SEED = 42
YEARS = [2021, 2022, 2023, 2024, 2025]

# (name, sector, base_cgpa, ctc/stipend profile, branches, role_category)
# base_cgpa anchors the company's typical cutoff; profiles drive pay ranges.
COMPANIES: list[tuple[str, str, float, str, list[str], str]] = [
    ("Microsoft", "Tech", 8.4, "top_tech", ["CS", "ECE", "EEE"], "sde"),
    ("Google", "Tech", 8.8, "top_tech", ["CS", "ECE"], "sde"),
    ("Amazon", "Tech", 7.8, "top_tech", ["CS", "ECE", "EEE", "E&I"], "sde"),
    ("Adobe", "Tech", 8.2, "top_tech", ["CS", "ECE"], "sde"),
    ("Oracle", "Tech", 7.5, "big_tech", ["CS", "ECE", "EEE"], "sde"),
    ("Nvidia", "Semiconductors", 8.3, "top_tech", ["ECE", "EEE", "CS"], "core"),
    ("Qualcomm", "Semiconductors", 8.0, "big_tech", ["ECE", "EEE", "E&I"], "core"),
    ("Texas Instruments", "Semiconductors", 7.8, "big_tech", ["ECE", "EEE", "E&I"], "core"),
    ("Samsung R&D", "Semiconductors", 7.6, "big_tech", ["ECE", "EEE", "CS"], "core"),
    ("Cisco", "Tech", 7.4, "big_tech", ["CS", "ECE", "EEE"], "sde"),
    ("Salesforce", "Tech", 7.9, "top_tech", ["CS", "ECE"], "sde"),
    ("Atlassian", "Tech", 8.1, "top_tech", ["CS", "ECE"], "sde"),
    ("Intuit", "Tech", 7.7, "big_tech", ["CS", "ECE"], "sde"),
    ("Uber", "Tech", 8.0, "top_tech", ["CS", "ECE", "Math"], "sde"),
    ("Flipkart", "E-commerce", 7.6, "big_tech", ["CS", "ECE", "EEE"], "sde"),
    ("Walmart Global Tech", "E-commerce", 7.5, "big_tech", ["CS", "ECE", "EEE"], "sde"),
    ("Goldman Sachs", "Finance", 8.2, "finance", ["CS", "ECE", "Economics", "Math"], "finance"),
    ("JPMorgan Chase", "Finance", 7.8, "finance", ["CS", "ECE", "Economics", "Math"], "finance"),
    ("D.E. Shaw", "Finance", 8.6, "quant", ["CS", "Math", "Economics"], "finance"),
    ("Wells Fargo", "Finance", 7.2, "finance", ["CS", "ECE", "Economics"], "finance"),
    ("McKinsey & Company", "Consulting", 8.5, "consulting", ["Economics", "CS", "Mechanical"], "consulting"),
    ("Deloitte", "Consulting", 6.8, "consulting_mass", ["Economics", "CS", "Mechanical", "Civil"], "consulting"),
    ("KPMG", "Consulting", 6.6, "consulting_mass", ["Economics", "CS", "Chemical"], "analytics"),
    ("TCS", "IT Services", 6.2, "mass", ["CS", "ECE", "EEE", "E&I", "Mechanical", "Civil"], "sde"),
    ("Shell", "Energy", 7.4, "core_sector", ["Chemical", "Mechanical", "Civil"], "core"),
    ("Tata Steel", "Core", 6.9, "core_sector", ["Mechanical", "Civil", "Chemical"], "core"),
]

# Pay ranges per profile. placement -> CTC in LPA; ps1/ps2/si -> monthly
# stipend in thousands INR.
PAY_PROFILES = {
    "top_tech": {"placement": (35, 60), "ps2": (80, 150), "si": (60, 120), "ps1": (25, 40)},
    "big_tech": {"placement": (20, 40), "ps2": (40, 90), "si": (30, 70), "ps1": (20, 35)},
    "finance": {"placement": (25, 50), "ps2": (60, 120), "si": (50, 100), "ps1": (25, 40)},
    "quant": {"placement": (45, 60), "ps2": (100, 150), "si": (90, 150), "ps1": (30, 45)},
    "consulting": {"placement": (20, 35), "ps2": (50, 90), "si": (40, 80), "ps1": (20, 35)},
    "consulting_mass": {"placement": (8, 15), "ps2": (25, 50), "si": (20, 40), "ps1": (15, 30)},
    "mass": {"placement": (8, 12), "ps2": (20, 35), "si": (15, 30), "ps1": (10, 25)},
    "core_sector": {"placement": (10, 18), "ps2": (25, 50), "si": (20, 40), "ps1": (15, 30)},
}

ROLES_BY_CATEGORY = {
    "sde": ["Software Engineer", "SDE", "Backend Engineer", "Platform Engineer"],
    "core": ["Design Engineer", "Hardware Engineer", "Process Engineer", "Graduate Engineer Trainee"],
    "analytics": ["Data Analyst", "Business Analyst", "Data Scientist"],
    "finance": ["Analyst", "Quantitative Analyst", "Risk Analyst", "Investment Banking Analyst"],
    "consulting": ["Business Analyst", "Associate Consultant", "Consultant"],
    "other": ["Management Trainee", "Associate"],
}


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug


def _company_types(rng: random.Random, profile: str) -> list[str]:
    """Which offer types a company participates in."""
    types = ["placement"]
    if profile in ("mass", "consulting_mass"):
        if rng.random() < 0.5:
            types.append("ps2")
        return types
    if rng.random() < 0.9:
        types.append("ps2")
    if rng.random() < 0.5:
        types.append("si")
    if rng.random() < 0.4:
        types.append("ps1")
    return types


def build_mock_data() -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    """Build (companies, offers, cutoff_stats, experiences) as plain dicts.

    Pure and deterministic — reused by the test-suite fixtures.
    """
    rng = random.Random(SEED)
    companies: list[dict] = []
    offers: list[dict] = []

    for name, sector, base_cg, profile, branches, role_cat in COMPANIES:
        companies.append(
            {
                "name": name,
                "slug": slugify(name),
                "sector": sector,
                "description": f"{name} — {sector} recruiter at BITS Pilani (mock data).",
            }
        )
        company_slug = slugify(name)
        for offer_type in _company_types(rng, profile):
            low_pay, high_pay = PAY_PROFILES[profile][offer_type]
            for year in YEARS:
                # Mild downward trend in cutoffs in recent years for some
                # companies, flat for others.
                trend = rng.uniform(-0.05, 0.02)
                n_offers = rng.randint(2, 4)
                for _ in range(n_offers):
                    cg = base_cg + trend * (year - YEARS[0]) + rng.uniform(-0.4, 0.4)
                    cg = round(max(6.0, min(9.5, cg)), 2)
                    pay_low = low_pay + (year - YEARS[0]) * (high_pay - low_pay) * 0.04
                    pay = round(rng.uniform(pay_low, high_pay), 1)
                    if offer_type != "placement":
                        pay = round(pay)  # monthly stipend in thousands
                    offers.append(
                        {
                            "company_slug": company_slug,
                            "type": offer_type,
                            "year": year,
                            "role": rng.choice(ROLES_BY_CATEGORY.get(role_cat, ROLES_BY_CATEGORY["other"])),
                            "role_category": role_cat,
                            "branch": rng.choice(branches),
                            "cgpa_cutoff": cg,
                            "stipend_ctc": pay,
                            "slots": rng.randint(1, 12),
                        }
                    )

    # Derive cutoff_stats from offers (min / median / p25 / p75 per group).
    groups: dict[tuple[str, str, int], list[float]] = {}
    for offer in offers:
        key = (offer["company_slug"], offer["type"], offer["year"])
        groups.setdefault(key, []).append(offer["cgpa_cutoff"])

    cutoff_stats: list[dict] = []
    for (company_slug, offer_type, year), cgs in sorted(groups.items()):
        cgs = sorted(cgs)
        cutoff_stats.append(
            {
                "company_slug": company_slug,
                "type": offer_type,
                "year": year,
                "min_cg": round(cgs[0], 2),
                "median_cg": round(median(cgs), 2),
                "p25": round(cgs[0] + (cgs[-1] - cgs[0]) * 0.25, 2),
                "p75": round(cgs[0] + (cgs[-1] - cgs[0]) * 0.75, 2),
            }
        )

    experiences: list[dict] = [
        {
            "company_slug": "microsoft",
            "type": "placement",
            "year": 2024,
            "author_hint": "CS '25",
            "content": "4 rounds: online coding test, 2 DSA rounds (graphs, DP), 1 system-design-lite + HR. Questions were LeetCode medium-hard.",
            "approved": True,
        },
        {
            "company_slug": "goldman-sachs",
            "type": "placement",
            "year": 2023,
            "author_hint": "Math '24",
            "content": "Aptitude + probability-heavy first round, then technical on stats and basic coding, final HR. Brush up Bayes and expectation problems.",
            "approved": True,
        },
        {
            "company_slug": "texas-instruments",
            "type": "ps2",
            "year": 2024,
            "author_hint": "ECE '26",
            "content": "PS-2 station at Bangalore, analog design team. Work involved SPICE simulations and a tape-out support project. Great mentorship.",
            "approved": True,
        },
        {
            "company_slug": "amazon",
            "type": "si",
            "year": 2024,
            "author_hint": "CS '26",
            "content": "Summer intern, SDE. One OA (2 coding + LP questions) then 1 interview round. LP answers matter more than you'd think.",
            "approved": True,
        },
        {
            "company_slug": "mckinsey-company",
            "type": "placement",
            "year": 2023,
            "author_hint": "Eco '24",
            "content": "Case interviews: market sizing in round 1, full case + PEI in rounds 2-3. Practice structuring out loud.",
            "approved": True,
        },
        {
            "company_slug": "qualcomm",
            "type": "ps2",
            "year": 2022,
            "author_hint": "EEE '24",
            "content": "Modem firmware team. Mostly C programming and debugging on target hardware. PS report expectations were strict but fair.",
            "approved": True,
        },
        {
            "company_slug": "tcs",
            "type": "placement",
            "year": 2025,
            "author_hint": "Mech '25",
            "content": "NQT-based shortlist, single interview mixing basics of C and branch fundamentals. Very process-driven.",
            "approved": True,
        },
        {
            "company_slug": "d-e-shaw",
            "type": "si",
            "year": 2025,
            "author_hint": "CS '27",
            "content": "Pending moderation: intern interview experience write-up.",
            "approved": False,
        },
        {
            "company_slug": "flipkart",
            "type": "placement",
            "year": 2025,
            "author_hint": "ECE '25",
            "content": "Pending moderation: SDE-1 loop notes.",
            "approved": False,
        },
    ]
    return companies, offers, cutoff_stats, experiences


def seed(session: Session) -> dict[str, int]:
    """Insert mock data; idempotent (skips if companies already exist)."""
    if session.execute(select(Company.id)).first() is not None:
        return {"companies": 0, "offers": 0, "cutoff_stats": 0, "experiences": 0}

    companies, offers, cutoff_stats, experiences = build_mock_data()

    id_by_slug: dict[str, int] = {}
    for data in companies:
        company = Company(**data)
        session.add(company)
        session.flush()
        id_by_slug[company.slug] = company.id

    for data in offers:
        row = dict(data)
        row["company_id"] = id_by_slug[row.pop("company_slug")]
        session.add(Offer(**row))

    for data in cutoff_stats:
        row = dict(data)
        row["company_id"] = id_by_slug[row.pop("company_slug")]
        session.add(CutoffStat(**row))

    for data in experiences:
        row = dict(data)
        row["company_id"] = id_by_slug[row.pop("company_slug")]
        session.add(Experience(**row))

    session.commit()
    return {
        "companies": len(companies),
        "offers": len(offers),
        "cutoff_stats": len(cutoff_stats),
        "experiences": len(experiences),
    }


def main() -> None:
    db_url = (
        sys.argv[1]
        if len(sys.argv) > 1
        else f"sqlite:///{BACKEND_DIR.as_posix()}/placeiq.db"
    )
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        counts = seed(session)
    finally:
        session.close()
    if counts["companies"] == 0:
        print(f"Database already seeded ({db_url}); nothing to do.")
    else:
        print(f"Seeded {db_url}:")
        for key, value in counts.items():
            print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
