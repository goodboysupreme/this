#!/usr/bin/env python
"""Normalize raw PS-1 station data (CSV/XLSX) into the canonical offer schema.

Usage:
    python scripts/ingest/ingest_ps1.py <input.csv|xlsx> [-o output.csv]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from .common import normalize_frame, read_table
except ImportError:  # running as a plain script
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from common import normalize_frame, read_table

DEFAULT_TYPE = "ps1"


def normalize(input_path: str | Path) -> list[dict]:
    """Map arbitrary PS-1 CSV/XLSX columns to the offer schema."""
    return normalize_frame(read_table(input_path), default_type=DEFAULT_TYPE)


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
