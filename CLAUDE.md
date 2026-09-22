# cyph-appendix

> Read `README.md` first - it is the canonical map of this repo (purpose, layout, who it talks to, run/test). This file holds only Claude-specific rules and incident history.

> **Scope rule (Cash, 2026-09-14): no frontend changes and no copy you were not asked for.** A backend task is backend only. Do not add a surface, a row, a pill, a section, a playground entry, a fixture, a DS component, a type field, or a `include=` param in any frontend (`*-fe`, the design systems, `cyph-internal`, `cyph-appendix`, the decks) to "show" backend work. Do not write, add, or reword user-facing copy (labels, section titles, hover text, empty states, error text) unless Cash dictated the words. If a frontend change looks necessary to make the work useful, say so in one line and stop; Cash decides. This applies to sibling repos too: working in `underground-be` gives no licence to touch `underground-fe` or the DS.

## Scope Discipline
Implement ONLY what was explicitly requested. Do not add unrequested UI sections, intro summaries, visualizations, fonts, or styling. If you believe an addition would help, list it as a suggestion at the end of your response instead of building it.

## Domain Vocabulary & Design Tokens
- Always use design-system tokens for color, spacing, and typography. Never hardcode hex values or font families.

## What this is

The **internal** technical appendix to the Cyph pitch deck (`cyph-deck`) — the
detail too deep/technical for investors but useful for a technical audience.
Deployed like the deck (static GitHub Pages) but content is **real-encrypted**,
so it's safe on a public host.

## Security model (important)

This is NOT the deck's soft email gate. Content ships only as AES-256-GCM
ciphertext in `payload.enc.json`. The password derives the key in-browser
(PBKDF2-SHA256, 250k iters, random salt) — a wrong password fails the GCM auth
tag and reveals nothing.

- **`content/slides.html` is the plaintext source and is gitignored. NEVER
  commit it.** Only `payload.enc.json` ships.
- The password is never stored in the repo. It's passed to the build via
  `APPENDIX_PASSWORD` env or `--password`.
- Crypto params live in two places that MUST stay in sync: `build/encrypt.mjs`
  and `gate.js` (iterations, hash). Bump `V` in the payload if you change them.

## Workflow

- **Author**: `npm run serve` → http://localhost:4178. Localhost bypasses the
  gate and loads `content/slides.html` live. Edit + refresh.
- **Deploy**: `APPENDIX_PASSWORD='…' npm run build` regenerates
  `payload.enc.json`; commit it + the static files; push → Pages redeploys.

## Files

The file map lives in `README.md` (Layout).

## Look & feel (matches cyph-deck)

Same skin as the deck — paprika `#ec4e20` HUD bars top/bottom, `cyph.` Helvetica
700 logo, lowercase underlined tabs, dark `#0e0e10` station-sign gate, brand
palette, "content on black / no grey boxes / newspaper" rule — but NOT the
deck's 16:9 `#game-shell`. Each drilldown is a **whitepaper**: a centered
~900px column (`--paper`) that flows to its natural height and scrolls, so
content is never compacted into a slide. Arrow keys / tabs / prev-next switch
drilldowns; ↑↓ / space / wheel scroll the current document.

## Authoring drilldowns

A drilldown is `<section class="drilldown" data-chapter="label">…</section>`
(`data-chapter` = its HUD tab + footer title). Components (see `styles.css`):
`.kicker`, `.lede`, `.spec-grid`/`.spec-card[.paprika|.cornflower|.amber|
.amaranth]`, `.callout`, `.pill`, `<pre><code>`, `<table>`, `<hr>`. Palette =
the deck's five brand colors.

## Copy rules

- NO em dashes in copy. User-facing copy is Cash-authored; only make dictated wording changes.

## Deploy target

GitHub Pages, repo root, branch `main` — same as `cyph-deck`
(`cypher-nyc/cyph-deck` → `cypher-nyc.github.io/cyph-deck`).

## Local Dev Ports
Before starting any server, check the port is free and record every background process you start. At the end of the session, kill ONLY the processes you started — never blanket-kill by port or name, since the user has pre-existing dev servers running. Ports in active use: 8000 (backend), 8002, 8200 (API), 5373 (portal).

## Verification
After a UI fix, hard-reload with cache disabled before claiming success. If the user reports still seeing the bug, assume it is real and reproduce it rather than attributing it to a stale module cache.
