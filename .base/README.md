# 🏆 Tobi Quiz

A quiz about Tobi — answer all 10 questions, see your score, and make the leaderboard.

## Run

```bash
npm start
```

Then open http://127.0.0.1:3000

## How it works

- **Frontend** (`public/`): plain HTML/CSS/JS, mobile-first.
- **Backend** (`server.js`): zero-dependency Node.js server. Serves the site and exposes a small API:
  - `GET /api/scores` — leaderboard (top 100)
  - `POST /api/scores` — submit a score `{ name, score }`
- **Storage**: scores are kept in `scores.json`. If the server is unavailable (e.g. opened as a static file), the app falls back to `localStorage`.

## Answers

All answers are checked case-insensitively, with a few accepting multiple spellings (e.g. Q10 accepts "my bestie" or "Carittah").
