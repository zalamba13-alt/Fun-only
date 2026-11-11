# Project notes

- Static quiz site in `public/` (HTML/CSS/JS) — no build or server needed to run it.
- Deploys to GitHub Pages via `.github/workflows/pages.yml` (serves the `public/` folder). Live URL: https://zalamba13-alt.github.io/Fun-only/
- Leaderboard uses `localStorage` (key `tobi_scores`) — fully client-side.
- `server.js` is optional and only for local dev (`npm start`, serves `public/` on 127.0.0.1:3000).
- Quiz answers live in `public/app.js` (`QUESTIONS` array) — each has an `accept` matcher function, case-insensitive.
- GitHub remote: `origin` → https://github.com/zalamba13-alt/Fun-only.git (branch `main`).
