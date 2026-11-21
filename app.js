/*
 * TOBI QUIZ — app logic
 * ---------------------
 * Flow: start → quiz (one question at a time) → result → review / leaderboard
 * Admin: unlock with a password to grant retakes or clear the board.
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
    savedRow: null,   // the row this player just submitted
    started: false,   // true once this attempt has been recorded
    boardSubscription: null
  };

  const TOTAL = QUESTIONS.length;

  /* ---------------- elements ---------------- */

  const el = {
    views: {
      start: document.getElementById('viewStart'),
      quiz: document.getElementById('viewQuiz'),
      result: document.getElementById('viewResult'),
      review: document.getElementById('viewReview'),
      board: document.getElementById('viewBoard'),
      admin: document.getElementById('viewAdmin')
    },
    navBoard: document.getElementById('navBoard'),
    navAdmin: document.getElementById('navAdmin'),
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
    boardBtn: document.getElementById('boardBtn'),
    reviewBtn: document.getElementById('reviewBtn'),

    reviewList: document.getElementById('reviewList'),
    reviewBack: document.getElementById('reviewBack'),

    boardBody: document.getElementById('boardBody'),
    boardEmpty: document.getElementById('boardEmpty'),
    boardNote: document.getElementById('boardNote'),
    boardBack: document.getElementById('boardBack'),

    adminBack: document.getElementById('adminBack'),
    adminLocked: document.getElementById('adminLocked'),
    adminPanel: document.getElementById('adminPanel'),
    adminEmail: document.getElementById('adminEmail'),
    adminPass: document.getElementById('adminPass'),
    adminLoginBtn: document.getElementById('adminLoginBtn'),
    adminHint: document.getElementById('adminHint'),
    grantName: document.getElementById('grantName'),
    grantBtn: document.getElementById('grantBtn'),
    removeBtn: document.getElementById('removeBtn'),
    grantHint: document.getElementById('grantHint'),
    clearBtn: document.getElementById('clearBtn'),
    adminLockBtn: document.getElementById('adminLockBtn'),
    adminWho: document.getElementById('adminWho'),
    adminPlayers: document.getElementById('adminPlayers'),
    adminPlayersEmpty: document.getElementById('adminPlayersEmpty'),
    adminRefreshBtn: document.getElementById('adminRefreshBtn'),
    setupNotice: document.getElementById('setupNotice'),
    setupNoticeText: document.getElementById('setupNoticeText')
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
    var answered = 0;
    for (var i = 0; i < TOTAL; i++) if (state.answers[i] !== null) answered++;
    return answered;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function shake(node) {
    node.classList.add('input-shake');
    setTimeout(function () {
      node.classList.remove('input-shake');
    }, 450);
  }

  /* ---------------- start ---------------- */

  /* Turn a store error code into a truthful, human-readable message. */
  function backendMessage(code, fallback) {
    switch (code) {
      case 'offline':
        return 'The leaderboard is not configured, so the quiz cannot start.';
      case 'network':
        return 'Could not reach the server. Check your connection and try again.';
      case 'not_installed':
        return 'The database is not set up yet: run security.sql in the Supabase SQL editor.';
      case 'bad_key':
        return 'Supabase rejected the API key in store.js. Copy the publishable key again.';
      case 'server_down':
        return 'Supabase is not responding right now. Try again in a moment.';
      case 'bad_request':
        return 'The database rejected the request. Re-run security.sql to update its functions.';
      case 'not_authorized':
        return 'The database rejected this device. Check the Supabase setup in security.sql.';
      default:
        return fallback || 'Something went wrong (' + (code || 'unknown') + ').';
    }
  }

  async function startQuiz() {
    const typed = el.nameInput.value.trim();

    if (!typed) {
      el.startHint.textContent = 'Please enter your name first.';
      el.startHint.classList.add('is-error');
      el.nameInput.focus();
      shake(el.nameInput);
      return;
    }

    el.startHint.classList.remove('is-error');
    el.startBtn.disabled = true;

    const start = await Store.startAttempt(typed);
    el.startBtn.disabled = false;

    if (!start.ok) {
      el.startHint.textContent = backendMessage(start.error, 'Could not reserve an attempt.');
      el.startHint.classList.add('is-error');
      shake(el.nameInput);
      return;
    }

    state.name = typed.slice(0, 20);
    state.index = 0;
    state.answers = new Array(TOTAL).fill(null);
    state.locked = false;
    state.finished = false;
    state.savedRow = null;
    state.started = true;
    state.attemptToken = start.token;

    showView('quiz');
    renderQuestion();
  }

  /* ---------------- quiz ---------------- */

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
      btn.disabled = true;

      const mark = btn.querySelector('.option-mark');
      mark.textContent = '';

      if (Number(btn.dataset.index) === choice) {
        btn.classList.add('is-selected');
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

    const answers = state.answers;
    const attemptToken = state.attemptToken;

    // Submit answers to the server for authoritative scoring.
    const submitted = await Store.submitAttempt(state.name, attemptToken, answers);
    if (!submitted.ok) {
      el.resultScore.textContent = '0';
      el.resultTotal.textContent = '/ ' + TOTAL;
      el.statPercent.textContent = '0%';
      el.resultSub.textContent = backendMessage(submitted.error, 'Could not submit answers.');
      el.statRank.textContent = '—';
      el.statPlayers.textContent = '—';
      return;
    }

    // Authoritative score from the server.
    var score = Number(submitted.score) || 0;
    var total = Number(submitted.total) || TOTAL;
    var pct = Math.round((score / total) * 100);

    showView('result');

    el.resultScore.textContent = String(score);
    el.resultTotal.textContent = '/ ' + total;
    el.statPercent.textContent = pct + '%';

    const ringOffset = RING_LENGTH - (pct / 100) * RING_LENGTH;
    el.ringFill.style.strokeDasharray = String(RING_LENGTH);
    el.ringFill.style.strokeDashoffset = String(RING_LENGTH);

    const ringColor = pct >= 70 ? 'var(--teal)' : pct >= 40 ? 'var(--gold)' : 'var(--rose)';
    el.ringFill.style.stroke = ringColor;

    const v = verdict(score);
    el.resultTitle.textContent = v.title;
    el.resultSub.textContent = v.sub;

    // Store the server's answer key for the review screen.
    state.reviewKey = submitted.key || null;
    state.savedRow = {
      name: state.name,
      score: score,
      total: total,
      created_at: submitted.created_at
    };

    // Fill in rank and total players from the live board.
    const rows = await Store.listScores();
    if (Array.isArray(rows)) {
      const rank = findRank(rows, state.savedRow);
      el.statRank.textContent = rank ? String(rank) : '—';
      el.statPlayers.textContent = String(rows.length);
    }
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

    // Use the key that was returned from submit_quiz_attempt, if available.
    // The store returns a 0-based array (index = question position).
    var key = null;
    if (state.reviewKey) {
      key = [];
      for (var i = 0; i < TOTAL; i++) {
        var v = state.reviewKey[i];
        if (v !== undefined) key[i] = v;
      }
    }

    QUESTIONS.forEach(function (question, i) {
      var chosen = state.answers[i];
      var correct = false;
      if (key && key[i] !== undefined) correct = chosen === key[i];

      var item = document.createElement('div');
      item.className = 'review-item ' + (correct ? 'ok' : 'no');
      item.style.animationDelay = Math.min(i * 0.03, 0.4) + 's';

      var q = document.createElement('p');
      q.className = 'review-q';
      q.textContent = (i + 1) + '. ' + question.q;

      var yours = document.createElement('div');
      yours.className = 'review-line';
      yours.innerHTML =
        '<span class="review-tag">You</span><span>' +
        escapeHtml(chosen === null ? 'No answer' : question.options[chosen]) +
        '</span>';

      item.appendChild(q);
      item.appendChild(yours);

      if (!correct) {
        var right = document.createElement('div');
        right.className = 'review-line';
        right.innerHTML =
          '<span class="review-tag">Answer</span><span>' +
          escapeHtml(question.options[key && key[i] !== undefined ? key[i] : question.answer]) +
          '</span>';
        item.appendChild(right);
      }
    });
  }

  /* ---------------- leaderboard ---------------- */

  async function renderBoard() {
    el.boardBody.innerHTML = '';
    el.boardEmpty.classList.remove('is-shown');

    if (!Store.isRemote()) {
      el.boardNote.textContent =
        'This board only shows scores from this device. Connect a free Supabase project in store.js to share one board between every player.';
    } else {
      el.boardNote.textContent = 'Live board — every player who finishes the quiz appears here.';
    }

    const rows = await Store.listScores();

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

  /* ---------------- admin ---------------- */

  function paintAdmin() {
    const unlocked = Store.isUnlocked();
    el.adminLocked.hidden = unlocked;
    el.adminPanel.hidden = !unlocked;
    el.adminHint.textContent = '';
    el.adminHint.classList.remove('is-error');
    el.grantHint.textContent = '';
    el.grantHint.classList.remove('is-error');
    if (unlocked) {
      el.adminWho.textContent = Store.adminEmail() || 'admin';
      renderAdminPlayers();
    }
  }

  function adminActionMessage(code) {
    switch (code) {
      case 'not_authorized':
        return 'Your session expired or this account lost admin rights. Sign in again.';
      case 'not_signed_in':
        return 'Sign in again to continue.';
      case 'network':
        return 'Could not reach the server. Try again.';
      case 'not_installed':
        return 'The admin functions are missing: run security.sql in the Supabase SQL editor.';
      case 'bad_key':
        return 'Supabase rejected the API key in store.js.';
      case 'server_down':
        return 'Supabase is not responding right now. Try again.';
      default:
        return 'Could not save that (' + (code || 'unknown') + ').';
    }
  }

  async function renderAdminPlayers() {
    const res = await Store.listPlayers();
    if (!res.ok) {
      el.adminPlayers.innerHTML = '';
      el.adminPlayersEmpty.hidden = false;
      el.adminPlayersEmpty.textContent = adminActionMessage(res.error);
      return;
    }
    const rows = res.rows || [];
    el.adminPlayersEmpty.hidden = rows.length > 0;
    el.adminPlayersEmpty.textContent = 'No players yet.';

    el.adminPlayers.innerHTML = rows
      .map(function (p) {
        var badge = p.submitted
          ? '<span class="admin-player-badge is-done">done</span>'
          : p.retake_allowed
            ? '<span class="admin-player-badge is-retake">retake</span>'
            : '<span class="admin-player-badge">in progress</span>';
        var meta = p.submitted
          ? p.attempts + ' attempt' + (p.attempts === 1 ? '' : 's')
          : p.retake_allowed
            ? 'retake allowed'
            : 'started, not submitted';
        return (
          '<div class="admin-player-row">' +
          '<span class="admin-player-name">' + escapeHtml(p.name) + '</span>' +
          '<span class="admin-player-meta">' + meta + '</span>' +
          badge +
          '</div>'
        );
      })
      .join('');
  }

  async function signInAdmin() {
    const email = el.adminEmail.value.trim();
    const password = el.adminPass.value;
    if (!email || !password) {
      el.adminHint.textContent = 'Enter both email and password.';
      el.adminHint.classList.add('is-error');
      return;
    }
    const result = await Store.signInAdmin(email, password);
    if (!result.ok) {
      el.adminHint.textContent =
        result.error === 'bad_login'
          ? 'That email and password do not match an account.'
          : backendMessage(result.error, 'Sign-in failed.');
      el.adminHint.classList.add('is-error');
      return;
    }
    paintAdmin();
    el.adminPass.value = '';
    el.adminEmail.value = '';
  }

  async function grantRetake() {
    const name = el.grantName.value.trim();
    if (!name) {
      el.grantHint.textContent = 'Type the player’s name first.';
      el.grantHint.classList.add('is-error');
      shake(el.grantName);
      return;
    }

    el.grantBtn.disabled = true;
    const res = await Store.grantRetake(name);
    el.grantBtn.disabled = false;

    if (res.ok) {
      el.grantHint.classList.remove('is-error');
      el.grantHint.textContent = name + ' can take the quiz again.';
      el.grantName.value = '';
      renderAdminPlayers();
    } else {
      el.grantHint.classList.add('is-error');
      el.grantHint.textContent = adminActionMessage(res.error);
    }
  }

  async function removePlayer() {
    const name = el.grantName.value.trim();
    if (!name) {
      el.grantHint.textContent = 'Type the player’s name first.';
      el.grantHint.classList.add('is-error');
      shake(el.grantName);
      return;
    }

    el.removeBtn.disabled = true;
    const res = await Store.removePlayer(name);
    el.removeBtn.disabled = false;

    if (res.ok) {
      el.grantHint.classList.remove('is-error');
      el.grantHint.textContent = name + ' and their scores were removed.';
      el.grantName.value = '';
      renderAdminPlayers();
    } else {
      el.grantHint.classList.add('is-error');
      el.grantHint.textContent = adminActionMessage(res.error);
    }
  }

  async function clearBoard() {
    el.clearBtn.disabled = true;
    const res = await Store.clearAll();
    el.clearBtn.disabled = false;

    el.grantHint.classList.add('is-error');
    el.grantHint.textContent = res.ok
      ? 'The board is empty again.'
      : adminActionMessage(res.error);
    if (res.ok) {
      el.grantHint.classList.remove('is-error');
      renderAdminPlayers();
    }
  }

  /* ---------------- live refresh (polling) ---------------- */

  function startBoardPolling() {
    if (state.boardSubscription) return;
    // Refresh the board every 6s while it is open. Cheap and reliable.
    state.boardSubscription = setInterval(function () {
      if (el.views.board.classList.contains('is-active')) {
        renderBoard();
      }
    }, 6000);
  }

  function stopBoardPolling() {
    if (!state.boardSubscription) return;
    clearInterval(state.boardSubscription);
    state.boardSubscription = null;
  }

  /* ---------------- wiring ---------------- */

  el.startBtn.addEventListener('click', startQuiz);

  el.nameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') startQuiz();
  });

  el.navBoard.addEventListener('click', function () {
    showView('board');
    renderBoard();
    startBoardPolling();
  });

  el.boardBtn.addEventListener('click', function () {
    showView('board');
    renderBoard();
    startBoardPolling();
  });

  el.boardBack.addEventListener('click', function () {
    stopBoardPolling();
    showView(state.finished ? 'result' : 'start');
  });

  el.reviewBtn.addEventListener('click', function () {
    renderReview();
    showView('review');
  });

  el.reviewBack.addEventListener('click', function () {
    showView('result');
  });

  el.navAdmin.addEventListener('click', function () {
    paintAdmin();
    showView('admin');
  });

  el.adminBack.addEventListener('click', function () {
    showView(state.finished ? 'result' : 'start');
  });

el.adminLoginBtn.addEventListener('click', signInAdmin);

  el.adminPass.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') signInAdmin();
  });

  el.adminLockBtn.addEventListener('click', function () {
    Store.signOutAdmin();
    paintAdmin();
  });

  el.adminRefreshBtn.addEventListener('click', function () {
    el.adminRefreshBtn.disabled = true;
    renderAdminPlayers().finally(function () {
      el.adminRefreshBtn.disabled = false;
    });
  });

  /* Restore a previously signed-in admin session (e.g. after a refresh). */
  Store.restoreAdmin().then(function () {
    paintAdmin();
  });

  /* Diagnose the backend once on load so a missing migration is reported
   * up front instead of surfacing later as a vague "network" error. */
  Store.healthCheck().then(function (h) {
    if (!el.setupNotice || !el.setupNoticeText) return;
    if (h.configured && h.reachable && h.table && h.functions) {
      el.setupNotice.hidden = true;
      return;
    }
    var msg;
    if (!h.configured) {
      msg = 'The leaderboard is not configured (store.js).';
    } else if (!h.reachable) {
      msg = 'Cannot reach Supabase. Check your connection.';
    } else if (!h.table) {
      msg = 'Supabase is reachable but the scores table is missing. Run security.sql.';
    } else {
      msg = 'The database functions are missing: run security.sql in the Supabase SQL editor.';
    }
    el.setupNoticeText.textContent = msg;
    el.setupNotice.classList.toggle('is-error', h.reachable && !h.table);
    el.setupNotice.hidden = false;
  });

  /* first paint */
  el.resultTotal.textContent = '/ ' + TOTAL;
  el.counter.textContent = 'Question 1 of ' + TOTAL;
  el.nameInput.focus();
})();
