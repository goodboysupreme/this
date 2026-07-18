# data/processed/

Clean, normalized output of the ingestion scripts (`scripts/ingest/`) lands here as JSON/CSV in the canonical schemas:

- offers: `company, type, year, role, role_category, branch, cgpa_cutoff, stipend_ctc, slots`
- companies: `name, slug, sector, description`

Regenerate at any time from `data/raw/` — treat everything here as disposable build output.
