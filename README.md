# cyph-appendix

Encrypted, password-gated internal technical appendix to the [Cyph deck](https://github.com/cypher-nyc/cyph-deck).
The detail that's too deep for the investor deck. Deployed like the deck
(static GitHub Pages) but the content is **real-encrypted** — safe on a public
host because the slides ship only as ciphertext.

## How it works

- `content/slides.html` — plaintext slide source. **Gitignored. Never committed.**
- `build/encrypt.mjs` — AES-256-GCM encrypts it under a key derived from your
  password (PBKDF2-SHA256, 250k iterations) → `payload.enc.json`.
- `gate.js` — in-browser: takes the password, derives the key via Web Crypto,
  decrypts `payload.enc.json`, injects the slides. Wrong password → GCM auth
  fails → nothing revealed.
- `deck.js` — minimal slide engine; auto-discovers every `<section class="slide">`.

## Author locally (no password, live edits)

```bash
npm run serve            # http://localhost:4178
```

On localhost the gate is bypassed and `content/slides.html` loads directly —
edit and refresh.

## Build for deploy

```bash
APPENDIX_PASSWORD='the-password' npm run build   # → payload.enc.json
git add payload.enc.json index.html styles.css deck.js gate.js
git commit -m "update appendix"
git push                                          # GitHub Pages redeploys
```

Re-run the build whenever `content/slides.html` changes — `payload.enc.json` is
the only content that ships.

## Security notes

- All files on the host are world-downloadable; the **content** is protected by
  the password, nothing else. Don't put the password in the repo.
- Images/assets are served unencrypted. For a genuinely sensitive diagram,
  embed it as a base64 data-URI **inside** a slide so it's encrypted with the text.
- `noindex` is set, but obscurity isn't the protection — the encryption is.
