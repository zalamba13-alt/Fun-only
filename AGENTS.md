# Project notes

- Static quiz site at the repo root (`index.html`, `style.css`, `app.js`, `questions.js`, `store.js`) — no build or server needed. Open `index.html` in a browser to run it.
- IMPORTANT: keep the repo free of `package.json` and `vercel.json`. They were added earlier and made Vercel treat the site as a Node project — the deploy then served HTML but 404'd the CSS/JS. Pure static root = zero-config deploy on Vercel/Netlify/Cloudflare Pages.
- Deploys to GitHub Pages from the `main` branch root. Live URL: https://zalamba13-alt.github.io/Fun-only/
- Questions live in `questions.js` (`QUESTIONS` array) — multiple choice, `answer` is the index of the correct option. Q1-10 are Tobi's real answers; Q11-20 are placeholders that still need real answers.
- Leaderboard logic is in `store.js`. Default: `localStorage` key `tobi_scores_v2` (per device). Paste a Supabase URL + anon key into the `REMOTE` object there to get one shared board for all players; the SQL to run is in the file header.
- Design: no emoji anywhere in the UI; ink/gold palette; animations are transform/opacity only; `prefers-reduced-motion` is respected.
- GitHub remote: `origin` → https://github.com/zalamba13-alt/Fun-only.git (branch `main`).
- No `CNAME` file: a placeholder domain makes GitHub Pages redirect to a domain nobody owns. Add one only after a real domain is purchased.
- Vercel: if the build fails with "Container service must specify an entrypoint", the project's Framework Preset was saved as a container/service type — delete the Vercel project and re-import with Framework Preset "Other", Build Command and Output Directory both empty.
