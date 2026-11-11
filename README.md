# 🏆 Tobi Quiz

A quiz about Tobi — answer all 10 questions, see your score, and make the leaderboard.

This is a **fully static website** — no server, no build step, no `npm` needed. Open `public/index.html` in any browser and it just works.

## Live site (GitHub Pages)

The repo includes a GitHub Actions workflow (`.github/workflows/pages.yml`) that auto-deploys the `public/` folder to GitHub Pages on every push to `main`. Your live quiz URL will be:

**https://zalamba13-alt.github.io/Fun-only/**

To enable it once:
1. On GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push (or re-run the workflow) — the site goes live automatically.

## Run locally (optional)

No server needed — just open `public/index.html` in a browser. Or, if you want a quick local server:

```bash
cd public
python3 -m http.server 8000
# open http://127.0.0.1:8000
```

## How scores are stored

Scores are saved in the browser's **localStorage** (key `tobi_scores`), so the leaderboard works on any static host with no backend. Note: scores are per-browser — each visitor sees the attempts made on that same device/browser.

## Answers

All answers are checked case-insensitively, with a few accepting multiple spellings (e.g. Q10 accepts "my bestie" or "Carittah").
