"""Shared helpers for ingestion normalizers.

Raw datasets arrive as arbitrary CSV/XLSX exports with inconsistent column
headers. Each normalizer maps whatever columns it finds (via the alias
table below) onto the canonical offer schema:

    company, type, year, role, role_category, branch,
    cgpa_cutoff, stipend_ctc, slots

``type`` is one of placement|ps1|ps2|si and is fixed per source file.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

CANONICAL_COLUMNS = [
    "company",
    "type",
    "year",
    "role",
    "role_category",
    "branch",
    "cgpa_cutoff",
    "stipend_ctc",
    "slots",
]

# Canonical column -> accepted raw header spellings (compared lowercased
# and stripped). Extend freely as real datasets arrive.
COLUMN_ALIASES: dict[str, list[str]] = {
    "company": ["company", "company name", "organization", "organisation", "org", "employer", "station", "ps station", "name"],
    "year": ["year", "batch", "academic year", "ay", "acad year", "session", "grad year", "graduation year"],
    "role": ["role", "position", "job title", "profile", "designation", "title", "job profile"],
    "role_category": ["role category", "category", "domain", "sector", "vertical", "function"],
    "branch": ["branch", "discipline", "department", "degree", "stream", "program", "programme"],
    "cgpa_cutoff": ["cgpa", "cg", "cg cutoff", "cgpa cutoff", "cgpa cut-off", "cg cut-off", "cutoff", "cut-off", "cut off", "min cgpa", "minimum cgpa", "cgpa criteria", "cgpa requirement", "eligibility cgpa"],
    "stipend_ctc": ["stipend", "ctc", "package", "salary", "compensation", "stipend (per month)", "ctc (lpa)", "ctc in lpa", "monthly stipend", "pay"],
    "slots": ["slots", "openings", "vacancies", "hires", "no. of hires", "offers", "no of offers", "intake", "seats"],
}


def read_table(input_path: str | Path) -> pd.DataFrame:
    """Read a CSV or XLSX into a DataFrame based on file extension."""
    path = Path(input_path)
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path)
    if suffix in (".xlsx", ".xls"):
        return pd.read_excel(path)
    raise ValueError(f"unsupported file type '{suffix}' (expected .csv/.xlsx/.xls)")


def _resolve_columns(df: pd.DataFrame) -> dict[str, str]:
    """Map raw DataFrame column names -> canonical names via aliases."""
    lookup: dict[str, str] = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            lookup[alias] = canonical
    resolved: dict[str, str] = {}
    for raw in df.columns:
        canonical = lookup.get(str(raw).strip().lower())
        if canonical and canonical not in resolved.values():
            resolved[raw] = canonical
    return resolved


def _to_float(value: Any) -> float | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, str):
        cleaned = value.strip().replace(",", "")
        if not cleaned or cleaned.lower() in ("na", "n/a", "-", "--"):
            return None
        value = cleaned
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: Any) -> int | None:
    as_float = _to_float(value)
    return int(as_float) if as_float is not None else None


def normalize_frame(df: pd.DataFrame, default_type: str) -> list[dict]:
    """Normalize a raw DataFrame into canonical offer dicts.

    Rows without a company name or year are dropped. ``type`` is forced to
    ``default_type`` for the whole file (each source file is one dataset).
    """
    df = df.rename(columns=_resolve_columns(df))
    records: list[dict] = []
    for _, row in df.iterrows():
        company = row.get("company")
        year = _to_int(row.get("year"))
        if company is None or pd.isna(company) or year is None:
            continue
        records.append(
            {
                "company": str(company).strip(),
                "type": default_type,
                "year": year,
                "role": _clean_str(row.get("role")),
                "role_category": _clean_str(row.get("role_category")),
                "branch": _clean_str(row.get("branch")),
                "cgpa_cutoff": _to_float(row.get("cgpa_cutoff")),
                "stipend_ctc": _to_float(row.get("stipend_ctc")),
                "slots": _to_int(row.get("slots")),
            }
        )
    return records


def _clean_str(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    return text or None
