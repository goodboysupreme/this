# data/raw/

Original datasets, exactly as provided (CSV / XLSX / PDF).

- Nothing in this directory is committed to git (see root `.gitignore`); this README is the only exception.
- Do not edit files in place — loaders/normalizers read from here.

## Current files

| File | Origin | Contents |
| --- | --- | --- |
| `ps2_24-25_stats.csv` | ps2.pilani.online export (PS-2 allotment stats, session 2024-25) | 2,347 rows: BITS branch code, CGPA, allotted station, monthly stipend (INR), semester-1/2 flags |
| `SI_Tracker_Official.xlsx` | Official Placement Unit SI tracker | Sheets `25-26`, `24-25`, `23-24`: company, branch, monthly CTC/stipend, role, notes, "CG & branch cutoff" text |
| `22-23_Both_Sems.pdf` | Placement Unit "Internship Chronicles" 22-23 | Per-company interview experiences, categorized TOC (Analytics, Core, IT, Electronics, Product, ...) |
| `23-24_Sem1_SI_Chronicles.pdf` | Placement Unit Chronicles, Sem 1 2023-24 | Same format (summer internships) |
| `23-24_Sem2_Placements_SI_Chronicles.pdf` | Placement Unit Chronicles, Sem 2 2023-24 | Same format (on-campus placements) |
| `24-25.pdf` | Placement Unit "Internship Chronicles" 2024-25 | Same format (summer internships) |

## Privacy

These sources contain real student names. **Names are never stored in the database**: `scripts/load_real_data.py` drops name columns on read, strips name-like lines and BITS IDs from experience text (best-effort), and uses non-identifying author hints. Keep this guarantee if you add new sources.

Load with: `cd backend && python ../scripts/load_real_data.py` (idempotent).
