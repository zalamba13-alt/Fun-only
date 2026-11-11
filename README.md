# 🏆 Tobi Quiz

A quiz about Tobi — answer all 10 questions, see your score, and make the leaderboard.

## Live site

The quiz is a **static website** (no server, no build). It's hosted on GitHub Pages at:

**https://zalamba13-alt.github.io/Fun-only/**

## Run locally

Just open `index.html` in a browser — that's it. (Or, if you want the optional local server: `npm start` then visit http://127.0.0.1:3000)

## How it works

- **Frontend** (`index.html`, `style.css`, `app.js`): plain HTML/CSS/JS, mobile-first.
- **Leaderboard**: stored in the browser's `localStorage` (key `tobi_scores`) — no backend needed.

## Answers

All answers are checked case-insensitively, with a few accepting multiple spellings (e.g. Q10 accepts "my bestie" or "Carittah").
