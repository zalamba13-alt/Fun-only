// ---- Questions & answers ----
const QUESTIONS = [
  {
    q: 'What is my favourite Colour?',
    accept: (a) => a === 'blue',
    answer: 'blue',
  },
  {
    q: 'Except Cristiano Ronaldo, which other footballer do I like a lot?',
    accept: (a) => a.includes('bellingham'),
    answer: 'Jude Bellingham',
  },
  {
    q: 'If all the people on earth were in one room, would I consider myself the smartest person in the room?',
    accept: (a) => a === 'yes' || a.includes('yes'),
    answer: 'Yes',
  },
  {
    q: 'What is the source of my knowledge?',
    accept: (a) => a === 'god',
    answer: 'God',
  },
  {
    q: 'Favourite Hobby?',
    accept: (a) => a.includes('football') || a.includes('footie') || a.includes('soccer'),
    answer: 'Football',
  },
  {
    q: 'Favourite person to hug?',
    accept: (a) => a.includes('carittah') || a.includes('caritah'),
    answer: 'Carittah 😂',
  },
  {
    q: 'Which country was I born in (not as easy as it seems)?',
    accept: (a) => a.includes('malawi'),
    answer: 'Malawi',
  },
  {
    q: 'Am I in love?',
    accept: (a) => a.includes('not exactly') || a.includes('not really') || a.includes('not'),
    answer: 'Not exactly 😂',
  },
  {
    q: 'How long do I wanna live for (estimate years)?',
    accept: (a) => a.includes('50') || a.includes('fifty') || a.includes('till 50'),
    answer: 'till 50',
  },
  {
    q: 'Out of all the girls in this world, which one do I love the most?',
    accept: (a) => a.includes('bestie') || a.includes('carittah') || a.includes('caritah'),
    answer: 'my bestie 🤪 / Carittah',
  },
];

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

// ---- State ----
const state = {
  name: '',
  current: 0,
  answers: [], // { q, yours, correct, right }
  score: 0,
};

// ---- DOM refs ----
const $ = (id) => document.getElementById(id);
const views = ['viewStart', 'viewQuiz', 'viewResults', 'viewReview', 'viewBoard'];

function showView(id) {
  views.forEach((v) => $(v).classList.toggle('active', v === id));
}

// ---- Start ----
$('startBtn').addEventListener('click', () => {
  const name = $('nameInput').value.trim();
  state.name = name || 'Anonymous';
  startQuiz();
});

$('nameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('startBtn').click();
});

function startQuiz() {
  state.current = 0;
  state.answers = [];
  state.score = 0;
  renderQuestion();
  showView('viewQuiz');
  $('answerInput').focus();
}

// ---- Quiz ----
function renderQuestion() {
  const i = state.current;
  const q = QUESTIONS[i];
  $('qCounter').textContent = `${i + 1} / ${QUESTIONS.length}`;
  $('progressBar').style.width = `${((i + 1) / QUESTIONS.length) * 100}%`;
  $('qText').textContent = q.q;
  $('answerInput').value = '';
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
}

$('nextBtn').addEventListener('click', () => {
  const i = state.current;
  const q = QUESTIONS[i];
  const raw = $('answerInput').value;
  const answer = norm(raw);
  if (!answer) {
    $('feedback').textContent = 'Please type an answer.';
    $('feedback').className = 'feedback wrong';
    return;
  }
  const correct = q.accept(answer);
  state.answers.push({ q: q.q, yours: raw.trim(), correct, right: q.answer });
  if (correct) state.score++;

  if (i + 1 < QUESTIONS.length) {
    state.current++;
    renderQuestion();
  } else {
    showResults();
  }
});

$('answerInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('nextBtn').click();
});

// ---- Results ----
function showResults() {
  const s = state.score;
  $('scoreNum').textContent = s;
  let emoji, title, msg;
  if (s === 10) { emoji = '🏆'; title = 'Perfect!'; msg = 'You know Tobi better than anyone!'; }
  else if (s >= 8) { emoji = '🔥'; title = 'Amazing!'; msg = 'You really know Tobi well!'; }
  else if (s >= 5) { emoji = '😄'; title = 'Not bad!'; msg = 'You know a good amount about Tobi.'; }
  else if (s >= 3) { emoji = '🤔'; title = 'Hmm…'; msg = 'You have some things to learn about Tobi.'; }
  else { emoji = '😅'; title = 'Ouch!'; msg = 'Time to get to know Tobi better!'; }
  $('resultEmoji').textContent = emoji;
  $('resultTitle').textContent = title;
  $('resultMsg').textContent = msg;
  showView('viewResults');
  submitScore();
}

$('againBtn').addEventListener('click', () => {
  showView('viewStart');
  $('nameInput').focus();
});

$('reviewBtn').addEventListener('click', () => {
  renderReview();
  showView('viewReview');
});

$('reviewBackBtn').addEventListener('click', () => showView('viewResults'));

function renderReview() {
  $('reviewList').innerHTML = state.answers.map((a) => `
    <div class="review-item">
      <span class="icon">${a.correct ? '✅' : '❌'}</span>
      <div>
        <div class="q">${a.q}</div>
        <div class="ans">
          <span class="yours">Your answer: ${escapeHtml(a.yours) || '—'}</span>
          ${a.correct ? '' : `<br><span class="right">Correct: ${escapeHtml(a.right)}</span>`}
        </div>
      </div>
    </div>`).join('');
}

// ---- Leaderboard ----
$('boardBtn').addEventListener('click', () => {
  loadBoard();
  showView('viewBoard');
});
$('boardBackBtn').addEventListener('click', () => showView('viewStart'));

function submitScore() {
  const payload = { name: state.name, score: state.score };
  fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // offline fallback: keep local copy
    const local = JSON.parse(localStorage.getItem('tobi_scores') || '[]');
    local.push({ ...payload, date: new Date().toISOString() });
    localStorage.setItem('tobi_scores', JSON.stringify(local));
  });
}

async function loadBoard() {
  let scores = [];
  try {
    const res = await fetch('/api/scores');
    if (res.ok) scores = await res.json();
  } catch (e) {
    scores = JSON.parse(localStorage.getItem('tobi_scores') || '[]');
  }
  scores.sort((a, b) => b.score - a.score || new Date(a.date) - new Date(b.date));

  $('boardEmpty').classList.toggle('hidden', scores.length > 0);
  $('boardList').innerHTML = scores.slice(0, 50).map((s, i) => `
    <div class="board-item">
      <span class="board-rank">${medal(i)}</span>
      <span class="board-name">${escapeHtml(s.name)}</span>
      <span class="board-score">${s.score}/10</span>
    </div>`).join('');
}

function medal(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `${i + 1}.`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
