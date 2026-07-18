# Design

Visual system for PlaceIQ. Register: product. Strategy: restrained. See PRODUCT.md for principles.

## Mood

A well-made data instrument: a senior's placement terminal, not a marketing site. Numbers are the hero. Decoration is noise.

## Color

OKLCH custom properties in `app/globals.css`, mapped into Tailwind (`tailwind.config.ts`) as semantic colors. Never use raw `zinc-*`, `indigo-*`, `violet-*`, `fuchsia-*`, `emerald-*`, `amber-*` palette classes in components — use the tokens below.

| Token | Tailwind | Use |
|---|---|---|
| `--bg` | `bg` | Page background. Pure white light / near-black dark. |
| `--surface` | `surface` | Cards, panels, nav pill, table rows on hover. |
| `--ink` | `ink` | Primary text, headings. |
| `--muted` | `muted` | Secondary text, placeholders, icons. |
| `--line` | `line` | All borders and dividers. |
| `--accent` | `accent` | Crimson. Primary actions, active state, key data highlights ONLY. White text on `bg-accent` fills. |
| `--accent-strong` | `accent-strong` | Accent hover/active. |
| `--accent-soft` | `accent-soft` | Accent-tinted badge/badge backgrounds. |
| `--success` / `--warn` / `--danger` (+ `-soft`) | `success` `warn` `danger` | Semantic state only (positive trend, caution, destructive). |

Rules:
- Accent carries ≤10% of any screen. Never decorative.
- No gradients anywhere. No gradient text (`bg-clip-text`), no gradient icon tiles, no gradient border lines.
- No glassmorphism (`backdrop-blur` is allowed only on the sticky navbar), no glow blobs, no noise overlays, no floating animations.
- No colored icon tiles. Icons are `text-muted` inside a `border border-line bg-surface` square, or plain.

## Typography

- UI font: Inter (`font-sans`). Data font: IBM Plex Mono (`font-mono`).
- All numbers (stats, cutoffs, CTC, stipends, counts, scores, table numerals) use the `stat-num` utility class (mono + tabular-nums).
- Headings: `font-semibold tracking-tight text-ink`, fixed rem scale (`text-2xl`/`text-3xl` page titles, `text-lg` card titles). No display font. No fluid clamp headings.
- Body: `text-sm` or `text-base` `text-muted`. Cap prose at 65ch.
- One mono uppercase tracking-widest kicker is allowed on the landing hero only. Not on app pages.

## Layout & components

- Max width `max-w-7xl px-4 sm:px-6`. Page titles with a short muted subtitle.
- Radius: `rounded-md` (controls, badges), `rounded-lg` (cards, panels).
- Cards: `rounded-lg border border-line bg-surface`. No shadows except `shadow-sm` on sticky nav scroll.
- Lists of similar items (companies, offers, links): one bordered container with `divide-y divide-line` rows, NOT a grid of identical cards.
- Tables: dense, `stat-num` numerals, right-align numeric columns, horizontal scroll on mobile.
- Buttons (`components/ui/button.tsx`): `default` (accent fill), `secondary`, `outline`, `ghost`, `danger`. The `glow` variant no longer exists — use `default`.
- Badges: variants `default | secondary | outline | accent | success | warning | danger`. Old `indigo`/`violet` variants are gone — map `indigo`→`accent`, `violet`→`secondary`.
- Loading: skeleton blocks (`animate-pulse bg-line/50 rounded`), not spinners.
- Empty states: short heading + one-line explanation + single action. No illustrations.

## Motion

- 150–250ms, ease-out, state changes only. No orchestrated page-load sequences, no hover lifts (`-translate-y-1`), no `shadow-*-500/*` colored shadows.
- `FadeIn` (whileInView, small y) is allowed on landing sections only, not inside app pages.
- `prefers-reduced-motion` handled globally in globals.css; framer-motion components use `useReducedMotion`.

## Copy

- No em dashes in UI copy (use commas, colons, periods). No marketing buzzwords.
- The cutoff predictor is always labelled an estimate, in context.
