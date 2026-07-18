# PlaceIQ

**BITS Pilani Placement & PS (Practice School) intelligence platform — an initiative by Vansh Malik, BITS Pilani.**

One stop for Placements, PS-1, PS-2, and SI (Summer Internship) intelligence: historical CGPA cutoffs, stipend/CTC stats, branch-wise eligibility, a statistical cutoff predictor, past interview experiences, an AI resume screener (DeepSeek + offline fallback), JD match with ATS .docx export, and a cold-email centre.

> The cutoff predictor output is always a **statistical estimate**, never official data.

## Features

- **Placement / PS-1 / PS-2 / SI hub** — company explorer with search & sector filters, per-company detail pages, offer tables with branch/year/CGPA filters, and a company comparison view (`/compare`).
- **Cutoff predictor** — statistical CGPA-cutoff estimate per company (`GET /api/companies/{slug}/cutoff`).
- **Stats dashboard** — aggregate stats: offers by type, top recruiters, CG-cutoff distribution, branch stats (`/dashboard`, `GET /api/stats/summary`).
- **Resume screener** — upload a `.docx` resume, get an overall score, section feedback and ATS checks. Uses DeepSeek when `DEEPSEEK_API_KEY` is set, otherwise a deterministic offline fallback engine.
- **JD match** — paste a job description, get a match score, matched/missing keywords, tailored bullets, suggested projects, and a downloadable ATS-friendly tailored resume (`.docx`).
- **Cold email centre** — import contacts from CSV, 3 seeded outreach templates, campaigns with `dry_run` mode and per-contact logs (`/outreach`).
- **Auth & favorites** — email+password auth (JWT), user profiles, favorite companies, `is_favorited` on company pages.
- **Experience bank** — submit and browse interview/PS experiences with admin moderation.
- **Admin** — moderation queue, dataset upload, page-view analytics (guarded by `X-Admin-Key`, default dev value `dev-admin-key`).

## Layout

```
placeiq/
├── backend/          FastAPI app (Python 3.11+), SQLite dev DB
│   ├── app/          package: config, db, models, schemas, routers/, services/
│   └── tests/        pytest suite (53 tests)
├── frontend/         Next.js 14 app (App Router, Tailwind, framer-motion)
├── data/
│   ├── raw/          original datasets (gitignored)
│   └── processed/    normalized ingestion output
├── scripts/
│   ├── seed_mock.py  deterministic mock-data seeder (idempotent; used by tests)
│   ├── load_real_data.py  real-data loader (wipes+rebuilds owned tables; dev DB)
│   └── ingest/       per-source CSV/XLSX normalizers
└── docker-compose.yml  optional; local dev does not need Docker
```

## Run the backend (no Docker needed)

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate        # Git Bash on Windows
# (PowerShell: .venv\Scripts\Activate.ps1 ; macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
cp ../.env.example .env              # or: copy ..\.env.example .env

# seed the dev database with deterministic mock data (idempotent — safe to re-run)
python ../scripts/seed_mock.py

# run the API on http://localhost:8000
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs — all routes are under `/api` (`/api/health`, `/api/companies`, `/api/offers`, `/api/stats/summary`, `/api/compare`, `/api/companies/{slug}/cutoff`).

## Run the frontend

```bash
cd frontend
npm install
cp .env.example .env.local           # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                          # http://localhost:3000
```

Production: `npm run build` then `npm start`.

The frontend talks to the backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). If the backend is unreachable, pages render a graceful "backend offline" empty state instead of crashing.

## Deploy to Vercel

The frontend deploys to Vercel as-is (Next.js 14 is auto-detected — no `vercel.json` needed):

1. Push the repo to GitHub/GitLab and **Import Project** in Vercel.
2. Set **Root Directory** to `frontend` (the repo is a monorepo; Vercel must build from `frontend/`).
3. Add the environment variable **`NEXT_PUBLIC_API_URL`** pointing at your **hosted backend URL** (e.g. `https://placeiq-api.up.railway.app`) — see `frontend/.env.production.example`. This value is baked into the browser bundle at build time, so it cannot be localhost.
4. Deploy. `npm run build` is the build command and works out of the box.

**The FastAPI backend must be hosted separately** (Railway, Render, Fly.io, etc. — Vercel serverless is not a good fit for this app):

- Run it with `uvicorn app.main:app --host 0.0.0.0 --port $PORT` and provision a database (SQLite works for a demo; Postgres via `DATABASE_URL` for anything serious).
- Set the backend's **`CORS_ORIGINS`** env var to include your Vercel domain (e.g. `https://your-app.vercel.app`), or browser API calls will be blocked by CORS.
- Set `JWT_SECRET` and `ADMIN_KEY` to real secrets (the dev defaults must not ship to production).
- Seed data with `python scripts/seed_mock.py` (mock data) or the `scripts/ingest` normalizers (real datasets).

If the backend URL is wrong or the backend is down, the site still renders — data pages show the graceful "backend offline" state.


### Resume screener & JD match

- `POST /api/resume/analyze` — multipart `file` (`.docx`); returns `engine` (`deepseek` or `fallback`), `overall_score`, `sections`, `ats_checks`, `skills_detected`.
- `POST /api/resume/jd-match` — multipart `file` + form field `jd_text`; returns `match_score`, `matched_keywords`, `missing_keywords`, `tailored_bullets`, `suggested_projects`, and a `download_id`.
- `GET /api/resume/export/{download_id}` — downloads the tailored ATS resume as `.docx`.

Set `DEEPSEEK_API_KEY` (and optionally `DEEPSEEK_BASE_URL`) in `backend/.env` for the LLM engine; without a key everything works via the offline fallback engine.

### Cold email centre

- `POST /api/outreach/contacts` — multipart CSV import (`name,email,company,role` header row); returns imported/skipped counts. `GET /api/outreach/contacts`, `DELETE /api/outreach/contacts/{id}`.
- `GET /api/outreach/templates` — 3 seeded templates (Referral ask, HR outreach, Alumni connect); `POST /api/outreach/templates` to add more.
- `POST /api/outreach/campaigns` — `{name, template_id, contact_ids, dry_run}`; with `dry_run: true` nothing is emailed and logs are recorded as `dryrun`. `GET /api/outreach/campaigns`, `GET /api/outreach/campaigns/{id}` for per-contact logs.

### Auth, favorites & experience bank

- `POST /api/auth/register` (201) / `POST /api/auth/login` — email+password auth; login returns a JWT (HS256, 7-day expiry). Send it as `Authorization: Bearer <token>`.
- `GET/PATCH /api/auth/me` — profile (branch, degree, grad year, CGPA; all optional).
- `POST /api/companies/{slug}/favorite` — toggle a favorite (auth); `GET /api/me/favorites` — list saved companies; `GET /api/companies/{slug}` includes `is_favorited` (false for anonymous callers).
- `POST /api/experiences` (201) — submit an interview/PS experience (`company_slug`, `type`, `year`, `author_hint`, `content` 20–5000 chars; goes to moderation, `approved=false`); `GET /api/experiences` — approved experiences, filterable by `type`/`company_slug`.
- `POST /api/analytics/event` (201) — unauthenticated page-view ping (`{path}`, max 200 chars).

### Admin (guarded by `X-Admin-Key` header, default dev value `dev-admin-key` — see `ADMIN_KEY` in `.env`)

- `GET /api/admin/experiences/pending`, `POST /api/admin/experiences/{id}/approve`, `POST /api/admin/experiences/{id}/reject` — experience moderation.
- `POST /api/admin/dataset/upload` — multipart `file` (CSV/XLSX) + `kind` (`placement|ps1|ps2|si|companies`); rows are normalized with the `scripts/ingest` normalizers, unparseable rows are skipped.
- `GET /api/admin/analytics` — page-event counts and totals (events, users, pending experiences).

Env vars (see `backend/.env.example`): `JWT_SECRET` (JWT signing secret), `ADMIN_KEY` (admin header value, `dev-admin-key` by default), `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` (resume LLM engine).

### Upload retention

Resumes contain PII: files written to `backend/uploads/exports/` (tailored-resume downloads) are deleted automatically on app startup once they are older than 24 hours (best-effort).

## Run the tests

```bash
cd backend
source .venv/Scripts/activate
pytest                  # 53 tests
```

Frontend checks: `cd frontend && npm run build && npm run lint`.

## Ingesting real datasets

**Real BITS Pilani data is loaded.** The dev DB (`backend/placeiq.db`) is populated from the real sources in `data/raw/`:

- `ps2_24-25_stats.csv` — PS-2 allotments 2024-25 (2,347 rows; ps2.pilani.online export).
- `SI_Tracker_Official.xlsx` — official SI tracker, sheets 25-26 / 24-25 / 23-24.
- `22-23_Both_Sems.pdf`, `23-24_Sem1_SI_Chronicles.pdf`, `23-24_Sem2_Placements_SI_Chronicles.pdf`, `24-25.pdf` — Placement Unit "Chronicles" (per-company interview experiences).

To reload (idempotent — wipes and rebuilds the companies/offers/cutoff_stats/experiences tables; users, favorites, contacts, templates, campaigns and page_events are preserved):

```bash
cd backend
python ../scripts/load_real_data.py
```

**Privacy:** the raw sources contain real student names. Names are never stored in the database — the loader drops the tracker `Name` column on read, strips name-like lines and BITS IDs from experience content (best-effort), and uses non-identifying `author_hint` labels like "Placement Unit Chronicles 24-25".

Generic per-source normalizers for future datasets:

1. Drop files into `data/raw/` (gitignored).
2. Normalize: `python scripts/ingest/ingest_placements.py data/raw/placements.xlsx -o data/processed/placements.json` (same pattern for `ingest_ps1.py`, `ingest_ps2.py`, `ingest_si.py`, `ingest_companies.py`). Column names are auto-mapped via alias tables (e.g. "CGPA", "cg", "CG Cutoff" → `cgpa_cutoff`).
3. The admin dataset-upload endpoint (`POST /api/admin/dataset/upload`) uses the same normalizers.

## Docker (optional)

A `docker-compose.yml` exists for running the stack in containers (Postgres + backend; frontend service is a commented placeholder), but **Docker is not required** — the normal local run is just the FastAPI backend on SQLite plus the Next.js dev server, as described above.
