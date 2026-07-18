#!/usr/bin/env python
"""Normalize a raw companies list (CSV/XLSX) into the company schema.

Output dicts have: name, slug, sector, description.

Usage:
    python scripts/ingest/ingest_companies.py <input.csv|xlsx> [-o output.json]
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import pandas as pd

try:
    from .common import read_table
except ImportError:  # running as a plain script
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from common import read_table

COMPANY_ALIASES = {
    "name": ["company", "company name", "organization", "organisation", "name", "station", "ps station"],
    "sector": ["sector", "industry", "domain", "vertical"],
    "description": ["description", "about", "details", "notes"],
}


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _resolve(df: pd.DataFrame) -> dict[str, str]:
    lookup = {alias: canon for canon, aliases in COMPANY_ALIASES.items() for alias in aliases}
    resolved: dict[str, str] = {}
    for raw in df.columns:
        canon = lookup.get(str(raw).strip().lower())
        if canon and canon not in resolved.values():
            resolved[raw] = canon
    return resolved


def _clean(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    return text or None


def normalize(input_path: str | Path) -> list[dict]:
    """Map arbitrary companies CSV/XLSX columns to the company schema."""
    df = read_table(input_path)
    df = df.rename(columns=_resolve(df))
    records: list[dict] = []
    for _, row in df.iterrows():
        name = _clean(row.get("name"))
        if not name:
            continue
        records.append(
            {
                "name": name,
                "slug": slugify(name),
                "sector": _clean(row.get("sector")),
                "description": _clean(row.get("description")),
            }
        )
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="raw CSV/XLSX file from data/raw/")
    parser.add_argument("-o", "--output", help="write normalized records as JSON here")
    args = parser.parse_args()
    records = normalize(args.input)
    if args.output:
        Path(args.output).write_text(json.dumps(records, indent=2), encoding="utf-8")
        print(f"wrote {len(records)} records -> {args.output}")
    else:
        print(json.dumps(records, indent=2))


if __name__ == "__main__":
    main()
