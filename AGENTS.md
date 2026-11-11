# Project notes

- Static quiz site at the repo root (`index.html`, `style.css`, `app.js`) — no build or server needed.
- Deploys to GitHub Pages from the `main` branch root. Live URL: https://zalamba13-alt.github.io/Fun-only/
- Leaderboard uses `localStorage` (key `tobi_scores`) — fully client-side.
- `server.js` is optional and only for local dev (`npm start`, serves the root on 127.0.0.1:3000).
- Quiz answers live in `app.js` (`QUESTIONS` array) — each has an `accept` matcher function, case-insensitive.
- GitHub remote: `origin` → https://github.com/zalamba13-alt/Fun-only.git (branch `main`).
