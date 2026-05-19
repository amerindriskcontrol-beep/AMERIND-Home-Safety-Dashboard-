# Home Ready — AMERIND (PWA)

A lightweight, offline-ready web game to teach first-time residents home safety and maintenance.

**Voice:** Tribes Protecting Tribes. Protect our people. Strengthen our communities.

## Features
- Four short modules: Fire, Electrical, Life Safety, Maintenance
- Learn → Do → Check loop per module
- Badges + downloadable certificate (PNG)
- Offline-ready (PWA), runs locally; no server required
- Accessible (keyboard, ARIA labels) + high-contrast toggle
- Progress saved to localStorage

## Quick Start
1. Download and unzip the project.
2. Open `index.html` directly in a modern browser (Chrome, Edge, Safari, Firefox).
3. (Optional) Serve via a simple local server for best PWA behavior:
   - Python: `python3 -m http.server 8080`
   - Node: `npx http-server -p 8080`
4. Visit `http://localhost:8080`, play modules, and earn badges.
5. Download the certificate after earning all four badges.

## Files
- `index.html` — Single-page app shell
- `app.js` — Game logic and UI
- `content.json` — Copy and quiz content (edit here to localize or adjust text)
- `service-worker.js` — Cache-first offline support
- `manifest.webmanifest` — PWA metadata
- `assets/icon-192.png`, `assets/icon-512.png` — App icons

## Notes
- All data stays in the browser via `localStorage` and the cache.
- To reset progress, clear browser site data for this app.
- You can customize the content (e.g., add language variants) by editing `content.json`.
- This build intentionally uses vanilla JS + CSS to keep deployment simple for housing authorities.
- For production hosting, serve over HTTPS so the PWA can be installed.

© 2025 AMERIND Risk Control / Mr. Austin
