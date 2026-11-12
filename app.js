/*
 * TOBI QUIZ — app logic
 * ---------------------
 * Flow: start → quiz (one question at a time) → result → review / leaderboard
 */

(function () {
  'use strict';

  /* ---------------- state ---------------- */

  const state = {
    name: '',
    index: 0,
    answers: [],      // index chosen per question, or null
    locked: false,
    finished: false,
    savedRow: null    // the row this player just submitted
  };

  const TOTAL = QUESTIONS.length;

  /* ---------------- elements ---------------- */

  const el = {
    views: {
      start: document.getElementById('viewStart'),
      quiz: document.getElementById('viewQuiz'),
      result: document.getElementById('viewResult'),
      review: document.getElementById('viewReview'),
      board: document.getElementById('viewBoard')
    },
    navBoard: document.getElementById('navBoard'),
    nameInput: document.getElementById('nameInput'),
    startBtn: document.getElementById('startBtn'),
    startHint: document.getElementById('startHint'),

    progress: document.getElementById('progress'),
    progressFill: document.getElementById('progressFill'),
    counter: document.getElementById('counter'),
    scoreLive: document.getElementById('scoreLive'),

    questionText: document.getElementById('questionText'),
    options: document.getElementById('options'),

    ringFill: document.getElementById('ringFill'),
    resultScore: document.getElementById('resultScore'),
    resultTotal: document.getElementById('resultTotal'),
    resultTitle: document.getElementById('resultTitle'),
    resultSub: document.getElementById('resultSub'),
    statRank: document.getElementById('statRank'),
    statPercent: document.getElementById('statPercent'),
    statPlayers: document.getElementById('statPlayers'),
    againBtn: document.getElementById('againBtn'),
    reviewBtn: document.getElementById('reviewBtn'),

    reviewList: document.getElementById('reviewList'),
    reviewBack: document.getElementById('reviewBack'),

    boardBody: document.getElementById('boardBody'),
    boardEmpty: document.getElementById('boardEmpty'),
    boardNote: document.getElementById('boardNote'),
    boardBack: document.getElementById('boardBack')
  };

  const RING_LENGTH = 2 * Math.PI * 52; // r = 52 in the SVG

  /* ---------------- helpers ---------------- */

  function showView(name) {
    Object.keys(el.views).forEach(function (key) {
      el.views[key].classList.toggle('is-active', key === name);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function correctCount() {
    return state.answers.reduce(function (sum, choice, i) {
      return sum + (choice === QUESTIONS[i].answer ? 1 : 0);
    }, 0);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* ---------------- quiz ---------------- */

  function startQuiz() {
    const typed = el.nameInput.value.trim();
    if (!typed) {
      el.startHint.textContent = 'Please enter your name first.';
      el.startHint.classList.add('is-error');
      el.nameInput.focus();
      el.nameInput.classList.add('input-shake');
      setTimeout(function () {
        el.nameInput.classList.remove('input-shake');
      }, 450);
      return;
    }

    el.startHint.classList.remove('is-error');
    el.startHint.textContent = 'No time limit. You can retake it as often as you like.';

    state.name = typed.slice(0, 20);
    state.index = 0;
    state.answers = new Array(TOTAL).fill(null);
    state.locked = false;
    state.finished = false;

    showView('quiz');
    renderQuestion();
  }

  function renderQuestion() {
    const question = QUESTIONS[state.index];
    const answered = state.answers[state.index];

    state.locked = false;

    el.counter.textContent = 'Question ' + (state.index + 1) + ' of ' + TOTAL;
    el.scoreLive.textContent = correctCount() + ' correct';

    const pct = Math.round((state.index / TOTAL) * 100);
    el.progressFill.style.width = pct + '%';
    el.progress.setAttribute('aria-valuenow', String(pct));

    el.questionText.textContent = question.q;
    el.questionText.style.animation = 'none';
    void el.questionText.offsetWidth;
    el.questionText.style.animation = '';

    el.options.innerHTML = '';

    question.options.forEach(function (optionText, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.style.animationDelay = 0.05 * i + 's';
      btn.dataset.index = String(i);

      const key = document.createElement('span');
      key.className = 'option-key';
      key.textContent = String.fromCharCode(65 + i);

      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = optionText;

      const mark = document.createElement('span');
      mark.className = 'option-mark';
      mark.textContent = '';

      btn.appendChild(key);
      btn.appendChild(text);
      btn.appendChild(mark);

      btn.addEventListener('click', function () {
        choose(i);
      });

      el.options.appendChild(btn);
    });

    if (answered !== null) {
      revealAnswer(answered);
    }
  }

  function choose(choice) {
    if (state.locked) return;
    state.locked = true;
    state.answers[state.index] = choice;

    el.scoreLive.textContent = correctCount() + ' correct';
    revealAnswer(choice);

    setTimeout(function () {
      if (state.index < TOTAL - 1) {
        state.index += 1;
        renderQuestion();
      } else {
        finish();
      }
    }, 780);
  }

  function revealAnswer(choice) {
    const question = QUESTIONS[state.index];
    const buttons = el.options.querySelectorAll('.option');

    buttons.forEach(function (btn) {
      const i = Number(btn.dataset.index);
      btn.disabled = true;

      const mark = btn.querySelector('.option-mark');

      if (i === question.answer) {
        btn.classList.add('is-correct');
        mark.textContent = '✓';
      } else if (i === choice) {
        btn.classList.add('is-wrong');
        mark.textContent = '✕';
      } else {
        btn.classList.add('is-dimmed');
      }
    });
  }

  /* ---------------- result ---------------- */

  function verdict(score) {
    const pct = score / TOTAL;
    if (pct === 1) return { title: 'Perfect score', sub: 'You know me better than I know myself. That is genuinely impressive.' };
    if (pct >= 0.85) return { title: 'Best friend energy', sub: 'Almost flawless. You have clearly been paying attention.' };
    if (pct >= 0.7) return { title: 'Very close', sub: 'Strong score. A few surprises left in there, though.' };
    if (pct >= 0.5) return { title: 'Not bad at all', sub: 'You know the basics. The details still got you.' };
    if (pct >= 0.3) return { title: 'Room to grow', sub: 'There is a lot about me you still have to discover.' };
    return { title: 'We need to talk', sub: 'Honestly, we should spend more time together.' };
  }

  async function finish() {
    state.finished = true;

    const score = correctCount();
    const pct = Math.round((score / TOTAL) * 100);

    showView('result');

    el.resultScore.textContent = String(score);
    el.resultTotal.textContent = '/ ' + TOTAL;
    el.statPercent.textContent = pct + '%';

    const ringOffset = RING_LENGTH - (pct / 100) * RING_LENGTH;
    el.ringFill.style.strokeDasharray = String(RING_LENGTH);
    el.ringFill.style.strokeDashoffset = String(RING_LENGTH);
    requestAnimationFrame(function () {
      el.ringFill.style.strokeDashoffset = String(ringOffset);
    });

    const ringColor = pct >= 70 ? 'var(--teal)' : pct >= 40 ? 'var(--gold)' : 'var(--rose)';
    el.ringFill.style.stroke = ringColor;

    const v = verdict(score);
    el.resultTitle.textContent = v.title;
    el.resultSub.textContent = v.sub;

    el.statRank.textContent = '—';
    el.statPlayers.textContent = '—';

    const saved = await Store.add({ name: state.name, score: score, total: TOTAL });
    state.savedRow = saved.row;

    const rows = await Store.list();
    const rank = findRank(rows, state.savedRow);

    el.statRank.textContent = rank ? '#' + rank : '—';
    el.statPlayers.textContent = String(rows.length);
  }

  function findRank(rows, row) {
    if (!row) return 0;

    // Exact submission first (same name + same timestamp).
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].created_at === row.created_at && rows[i].name === row.name) {
        return i + 1;
      }
    }

    // Otherwise the best position holding that score.
    for (let i = 0; i < rows.length; i += 1) {
      if (rows[i].score === row.score) return i + 1;
    }

    return 0;
  }

  /* ---------------- review ---------------- */

  function renderReview() {
    el.reviewList.innerHTML = '';

    QUESTIONS.forEach(function (question, i) {
      const chosen = state.answers[i];
      const ok = chosen === question.answer;

      const item = document.createElement('div');
      item.className = 'review-item ' + (ok ? 'ok' : 'no');
      item.style.animationDelay = Math.min(i * 0.03, 0.4) + 's';

      const q = document.createElement('p');
      q.className = 'review-q';
      q.textContent = (i + 1) + '. ' + question.q;

      const yours = document.createElement('div');
      yours.className = 'review-line';
      yours.innerHTML =
        '<span class="review-tag">You</span><span>' +
        escapeHtml(chosen === null ? 'No answer' : question.options[chosen]) +
        '</span>';

      item.appendChild(q);
      item.appendChild(yours);

      if (!ok) {
        const right = document.createElement('div');
        right.className = 'review-line';
        right.innerHTML =
          '<span class="review-tag">Answer</span><span>' +
          escapeHtml(question.options[question.answer]) +
          '</span>';
        item.appendChild(right);
      }

      el.reviewList.appendChild(item);
    });
  }

  /* ---------------- leaderboard ---------------- */

  async function renderBoard() {
    el.boardBody.innerHTML = '';
    el.boardEmpty.classList.remove('is-shown');

    if (!Store.isRemote()) {
      el.boardNote.textContent =
        'Scores are saved on this device. Connect a free Supabase project in store.js to share one board between every player.';
    } else {
      el.boardNote.textContent = 'Live board — every player who finishes the quiz appears here.';
    }

    const rows = await Store.list();

    if (!rows.length) {
      el.boardEmpty.classList.add('is-shown');
      return;
    }

    const myRow = state.finished ? state.savedRow : null;

    rows.forEach(function (row, i) {
      const rank = i + 1;
      const tr = document.createElement('tr');
      tr.style.animationDelay = Math.min(i * 0.035, 0.5) + 's';

      if (rank <= 3) tr.classList.add('rank-' + rank);

      const isYou = Boolean(
        myRow &&
        row.created_at === myRow.created_at &&
        row.name === myRow.name &&
        row.score === myRow.score
      );
      if (isYou) tr.classList.add('is-you');

      const pct = row.total ? Math.round((row.score / row.total) * 100) : 0;

      tr.innerHTML =
        '<td class="col-rank"><span class="rank-badge">' + rank + '</span></td>' +
        '<td><span class="player-name">' + escapeHtml(row.name) + '</span>' +
        (isYou ? '<span class="you-tag">You</span>' : '') +
        '</td>' +
        '<td class="col-score cell-score">' + row.score + '/' + row.total + '</td>' +
        '<td class="col-pct cell-pct">' + pct + '%</td>' +
        '<td class="col-date cell-date">' + formatDate(row.created_at) + '</td>';

      el.boardBody.appendChild(tr);
    });
  }

  /* ---------------- wiring ---------------- */

  el.startBtn.addEventListener('click', startQuiz);

  el.nameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') startQuiz();
  });

  el.navBoard.addEventListener('click', function () {
    showView('board');
    renderBoard();
  });

  el.boardBack.addEventListener('click', function () {
    showView(state.finished ? 'result' : 'start');
  });

  el.reviewBtn.addEventListener('click', function () {
    renderReview();
    showView('review');
  });

  el.reviewBack.addEventListener('click', function () {
    showView('result');
  });

  el.againBtn.addEventListener('click', function () {
    el.nameInput.value = state.name;
    showView('start');
    el.nameInput.focus();
  });

  /* first paint */
  el.resultTotal.textContent = '/ ' + TOTAL;
  el.counter.textContent = 'Question 1 of ' + TOTAL;
  el.nameInput.focus();
})();
