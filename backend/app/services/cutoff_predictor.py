"""Expected CGPA cutoff predictor (v1).

Per company+type: weighted median of recent years, where each year is
weighted ``0.5 ** (current_year - year)`` so recent cycles count more.
The confidence band comes from the historical spread (weighted std-dev of
yearly medians, blended with the historical p25/p75 band when present).
Cold-start (no company history) falls back to sector-level averages.

Everything here is a statistical ESTIMATE — always surfaced with a
disclaimer, never presented as official data.

Pure Python and DB-free except for ``predict_for_company`` at the bottom,
so the core math is fully unit-testable.
"""

from __future__ import annotations

from statistics import median
from typing import Any, Iterable

CURRENT_YEAR = 2025

# Fallback half-width of the band when there is a single data point
# (no variance information available).
DEFAULT_SPREAD = 0.3

# How much of the historical p25/p75 band to blend into the variance band.
PCTL_BLEND = 0.5


def _weighted_median(values: list[float], weights: list[float]) -> float:
    """Weighted median: smallest value whose cumulative weight >= half total."""
    if not values:
        raise ValueError("weighted median of empty sequence")
    pairs = sorted(zip(values, weights), key=lambda p: p[0])
    total = sum(weights)
    cumulative = 0.0
    for value, weight in pairs:
        cumulative += weight
        if cumulative >= total / 2:
            return value
    return pairs[-1][0]


def _weighted_mean(values: list[float], weights: list[float]) -> float:
    total = sum(weights)
    if total == 0:
        raise ValueError("weighted mean with zero total weight")
    return sum(v * w for v, w in zip(values, weights)) / total


def _weighted_std(values: list[float], weights: list[float]) -> float:
    if len(values) < 2:
        return DEFAULT_SPREAD
    mean = _weighted_mean(values, weights)
    total = sum(weights)
    variance = sum(w * (v - mean) ** 2 for v, w in zip(values, weights)) / total
    return variance**0.5


def _clamp_cg(value: float) -> float:
    return round(max(0.0, min(10.0, value)), 2)


def predict_cutoff(
    records: Iterable[dict[str, Any]],
    current_year: int = CURRENT_YEAR,
    company: str = "",
    offer_type: str = "",
    sector_fallback: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Predict the expected CGPA cutoff for one company+type.

    ``records``: iterable of dicts with keys ``year``, ``median_cg`` and
    optionally ``p25``/``p75`` (typically rows from ``cutoff_stats``).
    ``sector_fallback``: optional dict with ``median_cg``/``p25``/``p75``/
    ``sample_size`` computed across companies in the same sector.
    """
    rows = [
        r
        for r in records
        if r.get("year") is not None and r.get("median_cg") is not None
    ]

    if not rows:
        if sector_fallback and sector_fallback.get("median_cg") is not None:
            expected = _clamp_cg(sector_fallback["median_cg"])
            low = sector_fallback.get("p25")
            high = sector_fallback.get("p75")
            if low is None or high is None:
                low, high = expected - DEFAULT_SPREAD, expected + DEFAULT_SPREAD
            return {
                "company": company,
                "type": offer_type,
                "expected_cutoff": expected,
                "band": [_clamp_cg(low), _clamp_cg(high)],
                "sample_size": int(sector_fallback.get("sample_size", 0)),
                "basis": "sector_average",
            }
        return {
            "company": company,
            "type": offer_type,
            "expected_cutoff": None,
            "band": None,
            "sample_size": 0,
            "basis": "insufficient_data",
        }

    years = [int(r["year"]) for r in rows]
    medians = [float(r["median_cg"]) for r in rows]
    weights = [0.5 ** max(0, current_year - y) for y in years]

    expected = _weighted_median(medians, weights)
    spread = _weighted_std(medians, weights)
    low, high = expected - spread, expected + spread

    # Blend with the historical p25/p75 band when available.
    p25s = [float(r["p25"]) for r in rows if r.get("p25") is not None]
    p75s = [float(r["p75"]) for r in rows if r.get("p75") is not None]
    if p25s and p75s:
        hist_low = sum(p25s) / len(p25s)
        hist_high = sum(p75s) / len(p75s)
        low = PCTL_BLEND * low + (1 - PCTL_BLEND) * hist_low
        high = PCTL_BLEND * high + (1 - PCTL_BLEND) * hist_high

    low = min(low, expected)
    high = max(high, expected)

    return {
        "company": company,
        "type": offer_type,
        "expected_cutoff": _clamp_cg(expected),
        "band": [_clamp_cg(low), _clamp_cg(high)],
        "sample_size": len(rows),
        "basis": "company_history",
    }


def sector_average(records: Iterable[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate cutoff rows across a sector into a fallback summary."""
    rows = [r for r in records if r.get("median_cg") is not None]
    if not rows:
        return {"median_cg": None, "p25": None, "p75": None, "sample_size": 0}
    medians = [float(r["median_cg"]) for r in rows]
    p25s = [float(r["p25"]) for r in rows if r.get("p25") is not None]
    p75s = [float(r["p75"]) for r in rows if r.get("p75") is not None]
    return {
        "median_cg": median(medians),
        "p25": sum(p25s) / len(p25s) if p25s else None,
        "p75": sum(p75s) / len(p75s) if p75s else None,
        "sample_size": len(rows),
    }


def predict_for_company(db, company, offer_type: str, current_year: int = CURRENT_YEAR):
    """DB-backed wrapper: build records + sector fallback, then predict."""
    from ..models import CutoffStat, Company

    own = (
        db.query(CutoffStat)
        .filter(CutoffStat.company_id == company.id, CutoffStat.type == offer_type)
        .all()
    )
    records = [
        {"year": s.year, "median_cg": s.median_cg, "p25": s.p25, "p75": s.p75}
        for s in own
    ]

    fallback = None
    if not records and company.sector:
        peers = (
            db.query(CutoffStat)
            .join(Company, Company.id == CutoffStat.company_id)
            .filter(Company.sector == company.sector, CutoffStat.type == offer_type)
            .all()
        )
        fallback = sector_average(
            {"median_cg": s.median_cg, "p25": s.p25, "p75": s.p75} for s in peers
        )

    return predict_cutoff(
        records,
        current_year=current_year,
        company=company.name,
        offer_type=offer_type,
        sector_fallback=fallback,
    )
