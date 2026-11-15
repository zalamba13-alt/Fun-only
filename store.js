/*
 * LEADERBOARD STORE  (secure shared mode)
 * ---------------------------------------
 * The browser never writes to the database directly. It can only:
 *   - read the public scores table
 *   - call a few narrow Supabase RPC functions
 *
 * Scores are calculated inside Postgres from the submitted answers, so a
 * forged score cannot be inserted. The one-attempt rule is enforced
 * atomically in the database. Admin actions need a real Supabase Auth
 * login whose user id is allowlisted in public.admin_users.
 *
 * Setup: run security.sql in Supabase, then create an admin Auth user.
 * Never put a service-role / secret key in this file — it is public.
 */

const Store = (function () {
  'use strict';

  const REMOTE = {
    url: 'https://elwysrmcuysgvpqsvryu.supabase.co',
    anonKey: 'sb_publishable_8vmqAkbzqj4XgSHtkoW7Eg_-WooCPf9'
  };

  const KEY_SESSION = 'tobi_admin_session';
  const LIMIT = 100;

  let session = null;      // { access_token, refresh_token, expires_at, email }
  let adminVerified = false;

  function isRemote() {
    return Boolean(REMOTE.url && REMOTE.anonKey);
  }

  function base() {
    return REMOTE.url.replace(/\/+$/, '');
  }

  function cleanName(name) {
    return String(name || 'Anonymous').trim().slice(0, 20) || 'Anonymous';
  }

  function authHeaders(token) {
    const t = token || REMOTE.anonKey;
    return {
      apikey: REMOTE.anonKey,
      Authorization: 'Bearer ' + t,
      'Content-Type': 'application/json'
    };
  }

  /* ---------------- session helpers ---------------- */

  function loadSession() {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.access_token) return null;
      return s;
    } catch (err) {
      return null;
    }
  }

  function saveSession(s) {
    session = s;
    try {
      if (s) localStorage.setItem(KEY_SESSION, JSON.stringify(s));
      else localStorage.removeItem(KEY_SESSION);
    } catch (err) {
      /* ignore */
    }
  }

  function sessionToken() {
    return session && session.access_token ? session.access_token : null;
  }

  /* ---------------- rpc ---------------- */

  async function rpc(fn, args, token) {
    const res = await fetch(base() + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(args || {})
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      data = null;
    }
    if (!res.ok) {
      const err = new Error('RPC ' + fn + ' failed (' + res.status + ')');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  /* ---------------- scores ---------------- */

  function sortRows(rows) {
    return rows.slice().sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  function normaliseScores(rows) {
    return sortRows(rows).slice(0, LIMIT).map(function (r) {
      return {
        name: cleanName(r.name),
        score: Number(r.score) || 0,
        total: Number(r.total) || 0,
        created_at: r.created_at || new Date().toISOString()
      };
    });
  }

  async function listScores() {
    if (!isRemote()) return [];

    try {
      const res = await fetch(
        base() + '/rest/v1/scores?select=name,score,total,created_at' +
          '&order=score.desc,created_at.asc&limit=' + LIMIT,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error('Unexpected response');
      return normaliseScores(rows);
    } catch (err) {
      console.warn('[leaderboard] board unavailable.', err);
      return [];
    }
  }

  /* ---------------- attempts ---------------- */

  /**
   * Reserve this player's single attempt.
   * Returns { ok, token } or { ok:false, error:'already_played' }.
   */
  async function startAttempt(name) {
    if (!isRemote()) {
      return { ok: true, token: null, local: true };
    }
    try {
      const out = await rpc('start_quiz_attempt', { p_name: cleanName(name) });
      if (!out || !out.ok) {
        return { ok: false, error: (out && out.error) || 'could_not_start' };
      }
      return { ok: true, token: out.attempt_token };
    } catch (err) {
      console.warn('[leaderboard] could not start the attempt.', err);
      return { ok: false, error: 'network' };
    }
  }

  /**
   * Send the answers for server-side scoring.
   * `answers` is an array indexed by question position (0-based), values are
   * the chosen option indexes. Returns { ok, score, total, created_at }.
   */
  async function submitAttempt(name, token, answers) {
    if (!isRemote()) {
      return { ok: false, error: 'offline' };
    }
    const map = {};
    answers.forEach(function (choice, i) {
      if (choice !== null && choice !== undefined) map[String(i + 1)] = choice;
    });

    try {
      const out = await rpc('submit_quiz_attempt', {
        p_name: cleanName(name),
        p_attempt_token: token,
        p_answers: map
      });
      if (!out || !out.ok) return out || { ok: false, error: 'empty' };

      // The server returns the key only after a valid submission, for the review screen.
      const key = [];
      if (out.key && typeof out.key === 'object') {
        Object.keys(out.key).forEach(function (k) {
          key[Number(k) - 1] = Number(out.key[k]);
        });
      }
      return {
        ok: true,
        score: Number(out.score) || 0,
        total: Number(out.total) || 0,
        created_at: out.created_at,
        key: key
      };
    } catch (err) {
      console.warn('[leaderboard] could not submit the answers.', err);
      return { ok: false, error: 'network' };
    }
  }

  /* ---------------- admin auth ---------------- */

  async function restoreAdmin() {
    session = loadSession();
    if (!session) {
      adminVerified = false;
      return false;
    }
    // Confirm the session is still valid and the user is allowlisted.
    try {
      const res = await fetch(base() + '/auth/v1/user', { headers: authHeaders(sessionToken()) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const user = await res.json();
      if (!user || !user.id) throw new Error('no user');
      // The database is the source of truth for who is an admin.
      const check = await rpc('is_quiz_admin', {}, sessionToken());
      adminVerified = check === true;
      if (!adminVerified) saveSession(null);
      return adminVerified;
    } catch (err) {
      saveSession(null);
      adminVerified = false;
      return false;
    }
  }

  async function signInAdmin(email, password) {
    if (!isRemote()) return { ok: false, error: 'offline' };
    try {
      const res = await fetch(base() + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: REMOTE.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      const data = await res.json().catch(function () { return null; });
      if (!res.ok || !data || !data.access_token) {
        return { ok: false, error: (data && data.error_description) || 'bad_login' };
      }
      saveSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (Number(data.expires_in) || 3600) * 1000,
        email: email
      });
      adminVerified = true;
      return { ok: true };
    } catch (err) {
      console.warn('[leaderboard] admin sign-in failed.', err);
      return { ok: false, error: 'network' };
    }
  }

  async function signOutAdmin() {
    const token = sessionToken();
    saveSession(null);
    adminVerified = false;
    if (!isRemote() || !token) return;
    try {
      await fetch(base() + '/auth/v1/logout', {
        method: 'POST',
        headers: authHeaders(token)
      });
    } catch (err) {
      /* local session is already cleared */
    }
  }

  function isUnlocked() {
    return adminVerified && Boolean(sessionToken());
  }

  /* ---------------- admin actions ---------------- */

  async function adminCall(fn, args) {
    const token = sessionToken();
    if (!token || !adminVerified) return { ok: false, error: 'not_signed_in' };
    try {
      const out = await rpc(fn, args, token);
      return { ok: true, data: out };
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        saveSession(null);
        adminVerified = false;
        return { ok: false, error: 'not_authorized' };
      }
      return { ok: false, error: 'network' };
    }
  }

  async function grantRetake(name) {
    return adminCall('admin_grant_quiz_retake', { p_name: cleanName(name) });
  }

  async function removePlayer(name) {
    return adminCall('admin_remove_quiz_player', { p_name: cleanName(name) });
  }

  async function clearAll() {
    return adminCall('admin_clear_quiz_board', {});
  }

  return {
    listScores: listScores,
    startAttempt: startAttempt,
    submitAttempt: submitAttempt,
    restoreAdmin: restoreAdmin,
    signInAdmin: signInAdmin,
    signOutAdmin: signOutAdmin,
    grantRetake: grantRetake,
    removePlayer: removePlayer,
    clearAll: clearAll,
    isRemote: isRemote,
    isUnlocked: isUnlocked,
    adminEmail: function () { return session ? session.email : ''; },
    LIMIT: LIMIT
  };
})();
