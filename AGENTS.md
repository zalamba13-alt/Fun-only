# Project notes

- Run with `npm start` (node server.js), binds 127.0.0.1:3000. No dependencies.
- Scores persist in `scores.json` (server API); frontend falls back to localStorage if the server is unavailable.
- Quiz answers live in `public/app.js` (`QUESTIONS` array) — each has an `accept` matcher function, case-insensitive.
- GitHub remote: `origin` → https://github.com/zalamba13-alt/Fun-only.git (branch `main`).
