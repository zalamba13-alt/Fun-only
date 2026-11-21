# Project notes

- Static quiz site at the repo root (`index.html`, `style.css`, `app.js`, `questions.js`, `store.js`) — no build or server needed. Open `index.html` in a browser to run it.
- IMPORTANT: keep the repo free of `package.json` and `vercel.json`. They were added earlier and made Vercel treat the site as a Node project — the deploy then served HTML but 404'd the CSS/JS. Pure static root = zero-config deploy on Vercel/Netlify/Cloudflare Pages.
- Deploys to GitHub Pages from the `main` branch root. Live URL: https://zalamba13-alt.github.io/Fun-only/
- Questions live in `questions.js` (`QUESTIONS` array) — multiple choice, `answer` is the index of the correct option. Q1-10 are Tobi's real answers; Q11-20 are placeholders that still need real answers.
- Leaderboard logic is in `store.js` — it talks to a Supabase project (URL + publishable key in the `REMOTE` object). The SQL to set up the tables, RLS and RPC functions is in `security.sql` — it MUST be run in the Supabase SQL editor or every network call 404s (`PGRST202`). The app has a health check on load that shows a banner when the backend isn't set up.
- Supabase key rule: the publishable key (`sb_publishable_...`) goes on the `apikey` header ONLY — never as `Authorization: Bearer`. Only a real user access token (JWT) goes in the Authorization header.
- Admin auth is a real Supabase Auth login (email/password). After creating the Auth user, allowlist its UUID in `public.admin_users` (see security.sql). No hardcoded password.
- One-attempt gate is enforced in the database. A player who starts but abandons (never submits) can resume; only a submitted score blocks a retake.
- Board refreshes by polling every 6s while open (realtime was removed — do not re-add the Supabase CDN script).
- Design: no emoji anywhere in the UI; ink/gold palette; animations are transform/opacity only; `prefers-reduced-motion` is respected.
- GitHub remote: `origin` → https://github.com/zalamba13-alt/Fun-only.git (branch `main`).
- No `CNAME` file: a placeholder domain makes GitHub Pages redirect to a domain nobody owns. Add one only after a real domain is purchased.
- Vercel: if the build fails with "Container service must specify an entrypoint", the project's Framework Preset was saved as a container/service type — delete the Vercel project and re-import with Framework Preset "Other", Build Command and Output Directory both empty.
