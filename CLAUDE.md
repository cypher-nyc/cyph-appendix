# cyph-appendix

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

- `index.html` — shell: chrome + gate UI + empty `#deck-root`.
- `gate.js` — password gate, Web Crypto decrypt, localhost plaintext bypass.
- `deck.js` — drilldown engine; auto-discovers `<section class="drilldown">`.
  No hardcoded total to keep in sync (unlike the deck).
- `styles.css` — deck look (paprika HUD bars, dark register, station-sign) over
  whitepaper documents; tuned for code/tables/spec cards.
- `build/encrypt.mjs` — the encryptor.
- `content/slides.html` — plaintext drilldowns (gitignored).
- `payload.enc.json` — encrypted content (the only content that ships).

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

## Deploy target

GitHub Pages, repo root, branch `main` — same as `cyph-deck`
(`cypher-nyc/cyph-deck` → `cypher-nyc.github.io/cyph-deck`).
