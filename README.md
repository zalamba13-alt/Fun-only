# Tobi Quiz

A 20-question multiple-choice quiz about Tobi. Answer everything, get your score,
accuracy and rank, then compare yourself on the leaderboard.

## Live site

**<https://zalamba13-alt.github.io/Fun-only/>**

## Run locally

Open `index.html` in a browser — that's it. No build, no server, no npm.

## Files

| File | Role |
| --- | --- |
| `index.html` | Markup for all five screens (start, quiz, result, review, leaderboard) |
| `style.css` | Design system: ink/gold palette, animations, responsive layout |
| `questions.js` | The question bank — edit questions and correct answers here |
| `store.js` | Leaderboard storage (local by default, Supabase for a shared board) |
| `app.js` | Quiz flow, scoring, rank calculation, table rendering |

## Editing the questions

Open `questions.js`. Each entry looks like:

```js
{ q: "What is my favourite colour?", options: ["Red", "Blue", "Green", "Black"], answer: 1 }
```

`answer` is the **index** of the correct option — `1` means the second option ("Blue").
Add or remove entries freely; the quiz, progress bar and totals adapt automatically.

## Shared leaderboard (live)

Out of the box, scores are stored in the visitor's own browser, so each person only
sees their own attempts. To get **one live board shared by every player**, create a free
Supabase project and paste the project URL plus the anon public key into the `REMOTE`
object at the top of `store.js`. The SQL to create the table is in that file's header
comment. The app falls back to local storage automatically if the network fails.

Once Supabase is configured, the leaderboard subscribes to the `scores` table and updates
when another player submits a result, so people see new entries without reloading the page.
