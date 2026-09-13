# cyph-appendix

The password-gated internal technical appendix to the Cyph pitch deck: whitepaper-style drilldowns shipped only as AES-256-GCM ciphertext (`payload.enc.json`) and decrypted in the browser. Layer: Subsidiary/site.

## Talks to

Standalone: yes. No platform service, no logger, no shared gate: `gate.js` is this repo's own password gate, not the cyph-deck email gate. Shared things: the cyph-deck look (paprika HUD bars, dark register, station-sign, brand palette) and the one OG card at `https://cyph.city/logo/og-image.png`.

| Service | Direction | Protocol | For what |
|---|---|---|---|
| Google Fonts | out | stylesheet link | type |
| cyph.city (`/logo/og-image.png`) | out | hardcoded `og:image` | link preview |
| GitHub Pages (`cypher-nyc.github.io/cyph-appendix`) | in | static hosting | serves the repo root from `main` |

Events published/subscribed: none.

## Stack

- Static HTML, CSS, vanilla JS; Node ESM for the build (`build/encrypt.mjs`, Web Crypto); Python `http.server` for local authoring.
- Port 4178 for `npm run serve`. No database, no store.
- Crypto: PBKDF2-SHA256, 250000 iterations, random salt, AES-256-GCM; password from `APPENDIX_PASSWORD` or `--password`.
- Deploy target: GitHub Pages, repo root, branch `main`.

## Layout

```
index.html           shell: chrome + gate UI + empty #deck-root
gate.js              password gate, Web Crypto decrypt, localhost plaintext bypass (KDF params mirror build/encrypt.mjs)
deck.js              drilldown engine; auto-discovers every <section class="drilldown">, no hardcoded total
styles.css           deck skin over whitepaper documents (~900px --paper column, code/tables/spec cards)
build/encrypt.mjs    content/slides.html -> payload.enc.json
build/pdf.mjs        extracts four drilldowns into a print-ready standalone HTML (node build/pdf.mjs <out.html>)
content/             gitignored: slides.html (plaintext source) + cyph-appendix-technical.pdf
payload.enc.json     the only content that ships
favicon.png
```

## Run / test / lint

```
npm run serve                                      # http://localhost:4178, gate bypassed, content/slides.html loads live
APPENDIX_PASSWORD='...' npm run build              # regenerates payload.enc.json
node build/pdf.mjs /path/to/out.html               # print-ready HTML of the four named drilldowns
```

No tests, no lint.

## Rules for changing this repo

- `content/slides.html` is the plaintext source and is gitignored. NEVER commit it. Only `payload.enc.json` ships.
- The password is never stored in the repo; pass it via `APPENDIX_PASSWORD` or `--password`.
- Crypto params live in two places that MUST stay in sync: `build/encrypt.mjs` and `gate.js` (iterations, hash). Bump `V` in the payload if you change them.
- Re-run the build whenever `content/slides.html` changes; commit `payload.enc.json` with the static files.
- All files on the host are world-downloadable; images are served unencrypted. A genuinely sensitive diagram goes inline as a base64 data URI inside a slide. `noindex` is not the protection; the encryption is.
- NO em dashes in copy. User-facing copy is Cash-authored; only make dictated wording changes.
- A drilldown is `<section class="drilldown" data-chapter="label">`; components are `.kicker`, `.lede`, `.spec-grid` / `.spec-card[.paprika|.cornflower|.amber|.amaranth]`, `.callout`, `.pill`, `<pre><code>`, `<table>`, `<hr>`. Palette is the deck's five brand colors; content on black, no grey boxes.
- Not the deck's 16:9 `#game-shell`: each drilldown flows to its natural height and scrolls.

## Deploy

- GitHub Pages serves the repo root from `main`; a push redeploys. No workflow file, no bucket.
- Ship = `APPENDIX_PASSWORD='...' npm run build`, commit `payload.enc.json` + `index.html` + `styles.css` + `deck.js` + `gate.js`, push.
