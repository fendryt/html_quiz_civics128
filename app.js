/* Civics 128 daily quiz.
   Runs entirely in the browser (works on GitHub Pages). Results are written to a folder you pick on your
   own computer: civics128-progress.json (the record) and three CSV reports.
   A copy is also kept in this browser's localStorage as a safety net. On a public or shared computer the
   visitor ticks the shared-computer box on the agreement screen: then nothing is read from or written to
   browser storage or a folder, and progress lives in memory only. */
(function () {
  "use strict";

  var Q = window.CIVICS_128 || [];
  var BYN = {};
  Q.forEach(function (x) { BYN[x.n] = x; });

  var LS_KEY = "civics128-progress-v2";
  var FILE_JSON = "civics128-progress.json";
  var FILE_ATTEMPTS = "civics128-attempts.csv";
  var FILE_QUESTIONS = "civics128-questions.csv";
  var FILE_DAILY = "civics128-daily.csv";
  var PRESETS = [10, 12, 20, 30];
  var HAS_FS = typeof window.showDirectoryPicker === "function";

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function dateStr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { return dateStr(new Date()); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function niceDate(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function clampN(v) { v = Math.round(+v); if (!isFinite(v)) return 12; return Math.max(1, Math.min(Q.length, v)); }

  /* ---------- state ---------- */
  /* P.days[date] = { set: [question numbers], results: { "12": "got" | "miss" } }
     P.log = [{ t: ISO time, d: date, n: question, r: "got" | "miss" }]  (every attempt ever made) */
  function fresh() { return { version: 1, perDay: 12, updated: null, days: {}, log: [] }; }
  function valid(p) {
    return p && typeof p === "object" && p.days && typeof p.days === "object" && Array.isArray(p.log);
  }
  var P = fresh();
  var SHARED = false; /* set once the agreement screen reports the visitor's choice */
  function loadLocal() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { var parsed = JSON.parse(raw); if (valid(parsed)) P = parsed; }
    } catch (e) { /* storage blocked: the folder copy still works */ }
    P.perDay = clampN(P.perDay || 12);
  }

  var S = { date: today(), pos: 0, shown: false, ready: false, view: "quiz" };

  /* ---------- per-question history, from the log ---------- */
  function stats() {
    var st = {};
    P.log.forEach(function (e) {
      var s = st[e.n] || (st[e.n] = { asked: 0, got: 0, miss: 0, last: null, lastT: "", lastD: "" });
      s.asked++;
      if (e.r === "got") s.got++; else s.miss++;
      if (e.t >= s.lastT) { s.last = e.r; s.lastT = e.t; s.lastD = e.d; }
    });
    return st;
  }

  /* ---------- picking a random set ---------- */
  /* Order of preference: some missed questions (up to a third), then unseen, then the rest of the missed,
     then correct answers asked longest ago. The chosen set is shuffled so the order is random. */
  function pick(n, exclude) {
    var st = stats(), ex = {}, missed = [], unseen = [], good = [];
    exclude.forEach(function (k) { ex[k] = 1; });
    Q.forEach(function (q) {
      if (ex[q.n]) return;
      var s = st[q.n];
      if (!s) unseen.push(q.n);
      else if (s.last === "miss") missed.push(q.n);
      else good.push(q.n);
    });
    shuffle(missed); shuffle(unseen); shuffle(good);
    good.sort(function (a, b) { return st[a].lastT < st[b].lastT ? -1 : st[a].lastT > st[b].lastT ? 1 : 0; });
    var firstMissed = missed.splice(0, Math.ceil(n / 3));
    return shuffle(firstMissed.concat(unseen, missed, good).slice(0, n));
  }

  function ensureDay(d) {
    if (!P.days[d]) {
      P.days[d] = { set: pick(P.perDay, []), results: {} };
      touch();
    }
    return P.days[d];
  }

  function setPerDay(n) {
    n = clampN(n);
    P.perDay = n;
    var day = P.days[today()];
    if (day) {
      if (day.set.length < n) {
        day.set = day.set.concat(pick(n - day.set.length, day.set));
      } else if (day.set.length > n) {
        /* Drop unanswered questions from the end first; answered ones stay. */
        for (var i = day.set.length - 1; i >= 0 && day.set.length > n; i--) {
          if (!day.results[day.set[i]]) day.set.splice(i, 1);
        }
      }
    }
    touch();
    if (S.date === today()) { S.pos = Math.min(S.pos, Math.max(0, deckNums().length)); S.shown = false; }
    render();
  }

  function deckNums() { var d = P.days[S.date]; return d ? d.set : []; }
  function deck() { return deckNums().map(function (n) { return BYN[n]; }).filter(Boolean); }
  function firstOpen() {
    var d = P.days[S.date]; if (!d) return 0;
    for (var i = 0; i < d.set.length; i++) if (!d.results[d.set[i]]) return i;
    return d.set.length;
  }

  function mark(v) {
    var d = P.days[S.date], x = deck()[S.pos]; if (!d || !x) return;
    var had = d.results[x.n];
    d.results[x.n] = v;
    var now = new Date().toISOString();
    if (had) {
      /* Changed their mind within the same set: correct the last log entry instead of counting twice. */
      for (var i = P.log.length - 1; i >= 0; i--) {
        if (P.log[i].d === S.date && P.log[i].n === x.n) { P.log[i].r = v; P.log[i].t = now; break; }
      }
    } else {
      P.log.push({ t: now, d: S.date, n: x.n, r: v });
    }
    touch();
    S.shown = false; S.pos++;
    render();
  }

  function redoSet() {
    var d = P.days[S.date]; if (!d) return;
    d.results = {};
    touch();
    S.pos = 0; S.shown = false; render();
  }

  /* ---------- rendering ---------- */
  var daysEl = $("days"), panel = $("panel");

  function dayScore(d) {
    var day = P.days[d], got = 0, miss = 0;
    day.set.forEach(function (n) { var r = day.results[n]; if (r === "got") got++; else if (r === "miss") miss++; });
    return { got: got, miss: miss, total: day.set.length };
  }

  function renderDays() {
    var keys = Object.keys(P.days).sort(), t = today(), h = "";
    keys.forEach(function (k) {
      var sc = dayScore(k);
      var cls = "day" + (k === t ? " today" : "") + (sc.got + sc.miss === sc.total && sc.total ? " done" : "");
      h += '<button type="button" class="' + cls + '" data-day="' + k + '" aria-pressed="' + (k === S.date) + '">' +
        '<span class="d">' + niceDate(k) + '</span><span class="dt">' + k.slice(0, 4) + '</span>' +
        '<span class="sc">' + sc.got + "/" + sc.total + " ✓</span></button>";
    });
    daysEl.innerHTML = h;
    daysEl.classList.toggle("hidden", keys.length === 0);
  }

  function renderSettings() {
    var h = "";
    PRESETS.forEach(function (n) {
      h += '<button type="button" class="chip" data-n="' + n + '" aria-pressed="' + (P.perDay === n) + '">' + n + "</button>";
    });
    $("nchips").innerHTML = h;
    var inp = $("ncustom");
    if (document.activeElement !== inp) inp.value = PRESETS.indexOf(P.perDay) >= 0 ? "" : P.perDay;
  }

  function render() {
    renderSettings();
    if (!S.ready) { panel.innerHTML = '<p class="status">Loading…</p>'; return; }
    ensureDay(today());
    renderDays();
    renderViews();
    var showPerf = S.view === "perf";
    perfEl.classList.toggle("hidden", !showPerf);
    $("settings").classList.toggle("hidden", showPerf);
    panel.classList.toggle("hidden", showPerf);
    if (showPerf) { daysEl.classList.add("hidden"); renderPerf(); return; }
    var d = deck(), day = P.days[S.date];
    if (!day) { panel.innerHTML = ""; return; }
    var isToday = S.date === today();
    var title = (isToday ? "Today" : niceDate(S.date)) + " · " + d.length + " questions";
    var top = '<div class="top"><h2>' + esc(title) + '</h2><div class="pips" role="group" aria-label="Questions in this set">';
    d.forEach(function (x, i) {
      top += '<button type="button" class="pip ' + (day.results[x.n] || "") + (i === S.pos ? " cur" : "") +
        '" data-pos="' + i + '" aria-label="Question ' + x.n + '"></button>';
    });
    top += "</div></div>";

    var body = "";
    if (S.pos >= d.length) {
      var sc = dayScore(S.date), misses = d.filter(function (x) { return day.results[x.n] === "miss"; });
      var answered = sc.got + sc.miss;
      body = '<div class="summary summary-col">' +
        "<h3>" + sc.got + " of " + d.length + " right</h3>" +
        "<p>" + (answered < d.length ? (d.length - answered) + " not marked yet. Tap a circle above to jump to it." :
          (isToday ? "Done for today. Results are in your progress file. To practice more, raise the questions per day above." : "Set finished.")) + "</p>";
      if (misses.length) {
        body += '<div class="label">Missed</div><div class="misslist">' +
          misses.map(function (x) { return "<span>#" + x.n + "</span>"; }).join("") + "</div>";
      }
      body += '<div class="row"><button class="btn" type="button" data-act="redo">Redo this set</button></div></div>';
    } else {
      var x = d[S.pos];
      body = '<div class="meta"><span class="qnum">#' + x.n + "</span>" +
        (x.s ? '<span class="star" title="65/20 starred question">★ 65/20</span>' : "") +
        (x.verify ? '<span class="verify">verify</span>' : "") +
        (x.vary ? '<span class="verify">varies by location</span>' : "") +
        '<span class="cnt">' + (S.pos + 1) + " / " + d.length + "</span></div>" +
        '<p class="q">' + esc(x.q) + "</p>";
      if (!S.shown) {
        body += '<div class="row"><button class="btn primary grow" type="button" data-act="reveal">Show answer</button>' +
          (S.pos > 0 ? '<button class="btn quiet" type="button" data-act="back">Back</button>' : "") + "</div>";
      } else {
        body += '<div class="answer"><div class="label">' +
          (x.need > 1 ? "Give " + x.need + " of these" : x.a.length > 1 ? "Any of these" : "Answer") + "</div>";
        body += x.a.length > 1 ? "<ul>" + x.a.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>"
          : "<div>" + esc(x.a[0]) + "</div>";
        if (x.note) body += '<p class="note">' + esc(x.note) + "</p>";
        body += "</div>" +
          '<div class="row"><button class="btn got grow" type="button" data-act="got">I said it right (1)</button>' +
          '<button class="btn missbtn grow" type="button" data-act="miss">Missed it (2)</button></div>';
      }
    }
    panel.innerHTML = top + body;
  }

  /* ---------- events ---------- */
  daysEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-day]"); if (!b) return;
    S.date = b.getAttribute("data-day"); S.shown = false; S.pos = firstOpen(); render();
  });
  panel.addEventListener("click", function (e) {
    var p = e.target.closest("[data-pos]");
    if (p) { S.pos = +p.getAttribute("data-pos"); S.shown = false; render(); return; }
    var b = e.target.closest("[data-act]"); if (!b) return;
    var a = b.getAttribute("data-act");
    if (a === "reveal") { S.shown = true; render(); }
    else if (a === "back") { S.pos = Math.max(0, S.pos - 1); S.shown = false; render(); }
    else if (a === "got") mark("got");
    else if (a === "miss") mark("miss");
    else if (a === "redo") redoSet();
  });
  document.addEventListener("keydown", function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!S.ready || S.view !== "quiz" || S.pos >= deck().length) return;
    if (e.key === " " && !S.shown && (e.target === document.body)) { e.preventDefault(); S.shown = true; render(); }
    else if (S.shown && e.key === "1") mark("got");
    else if (S.shown && e.key === "2") mark("miss");
  });
  $("nchips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-n]"); if (b) setPerDay(+b.getAttribute("data-n"));
  });
  $("ncustom").addEventListener("change", function () {
    if (this.value === "") return;
    setPerDay(this.value);
  });

  var resetBtn = $("reset"), resetMsg = $("resetmsg"), armed = false;
  resetBtn.addEventListener("click", function () {
    if (!armed) { armed = true; resetBtn.textContent = "Tap again to erase all progress"; resetMsg.textContent = ""; return; }
    var n = P.perDay;
    P = fresh(); P.perDay = n;
    armed = false; resetBtn.textContent = "Reset all progress"; resetMsg.textContent = "Progress cleared.";
    S.date = today(); S.pos = 0; S.shown = false;
    touch(); render();
  });

  /* ---------- saving: localStorage + chosen folder ---------- */
  var dirHandle = null, chain = Promise.resolve(), csvTimer = null;
  var store = { text: "", cls: "" };

  function setStore(text, cls) {
    store.text = text; store.cls = cls || "";
    var el = $("store"); el.textContent = text; el.className = "status " + (cls || "");
  }

  function touch() {
    P.updated = new Date().toISOString();
    if (SHARED) return; /* shared computer: keep everything in memory */
    try { localStorage.setItem(LS_KEY, JSON.stringify(P)); } catch (e) { /* ignore */ }
    queueWrite();
  }

  function hhmm() { var d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  async function writeFile(name, data) {
    var fh = await dirHandle.getFileHandle(name, { create: true });
    var w = await fh.createWritable();
    await w.write(data);
    await w.close();
  }

  function queueWrite() {
    if (!dirHandle) return;
    chain = chain.then(async function () {
      try {
        await writeFile(FILE_JSON, JSON.stringify(P, null, 1));
        setStore("Saved to folder “" + dirHandle.name + "” at " + hhmm(), "ok");
      } catch (e) {
        setStore("Could not write to the folder (" + (e && e.name || "error") + "). Click Reconnect folder.", "warn");
        showFolderButtons(true);
      }
    });
    clearTimeout(csvTimer);
    csvTimer = setTimeout(flushCsv, 1200);
  }

  function flushCsv() {
    clearTimeout(csvTimer);
    if (!dirHandle) return;
    chain = chain.then(async function () {
      try {
        await writeFile(FILE_ATTEMPTS, attemptsCsv());
        await writeFile(FILE_QUESTIONS, questionsCsv());
        await writeFile(FILE_DAILY, dailyCsv());
        setStore("Saved to folder “" + dirHandle.name + "” at " + hhmm() + " (progress and CSV reports)", "ok");
      } catch (e) {
        setStore("Progress saved, but a CSV report could not be written. If it is open in another program, close it. The next answer retries.", "warn");
      }
    });
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flushCsv(); });

  /* IndexedDB keeps the folder permission between visits. */
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open("civics128", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("kv"); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbGet(k) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction("kv").objectStore("kv").get(k);
        t.onsuccess = function () { res(t.result); }; t.onerror = function () { rej(t.error); };
      });
    });
  }
  function idbSet(k, v) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k);
        t.oncomplete = function () { res(); }; t.onerror = function () { rej(t.error); };
      });
    });
  }

  async function perm(h, ask) {
    if (!h.queryPermission) return true;
    var o = { mode: "readwrite" };
    if ((await h.queryPermission(o)) === "granted") return true;
    return ask ? (await h.requestPermission(o)) === "granted" : false;
  }

  async function readFolderProgress() {
    try {
      var fh = await dirHandle.getFileHandle(FILE_JSON);
      var txt = await (await fh.getFile()).text();
      var p = JSON.parse(txt);
      return valid(p) ? p : null;
    } catch (e) { return null; }
  }

  /* Combine the browser copy and the folder file so neither side's history is lost:
     days are unioned (the copy with more marked answers wins a clash), attempts are unioned. */
  function merge(a, b) {
    var out = fresh(), newer = (b.updated || "") > (a.updated || "") ? b : a;
    out.perDay = clampN(newer.perDay || 12);
    out.updated = newer.updated || a.updated || b.updated || null;
    var dates = {};
    Object.keys(a.days).concat(Object.keys(b.days)).forEach(function (k) { dates[k] = 1; });
    Object.keys(dates).forEach(function (k) {
      var x = a.days[k], y = b.days[k];
      if (x && y) out.days[k] = Object.keys(y.results || {}).length > Object.keys(x.results || {}).length ? y : x;
      else out.days[k] = x || y;
      out.days[k].results = out.days[k].results || {};
    });
    var seen = {};
    a.log.concat(b.log).forEach(function (e) {
      var key = e.t + "|" + e.d + "|" + e.n;
      if (!seen[key]) { seen[key] = 1; out.log.push(e); }
    });
    out.log.sort(function (p, q) { return p.t < q.t ? -1 : p.t > q.t ? 1 : 0; });
    return out;
  }

  async function syncWithFolder() {
    var f = await readFolderProgress();
    if (f) P = merge(P, f);
    P.perDay = clampN(P.perDay || 12);
    if (!P.updated) P.updated = new Date().toISOString();
    try { localStorage.setItem(LS_KEY, JSON.stringify(P)); } catch (e) { /* ignore */ }
    queueWrite(); flushCsv();
  }

  function showFolderButtons(needReconnect) {
    $("pick").classList.toggle("hidden", !HAS_FS || SHARED);
    $("pick").textContent = dirHandle ? "Change results folder" : "Choose results folder";
    $("reconnect").classList.toggle("hidden", !needReconnect || SHARED);
  }

  $("pick").addEventListener("click", async function () {
    try {
      var h = await window.showDirectoryPicker({ id: "civics128", mode: "readwrite" });
      dirHandle = h;
      try { await idbSet("dir", h); } catch (e) { /* remembered only for this visit */ }
      await syncWithFolder();
      S.pos = firstOpen(); S.shown = false; render(); showFolderButtons();
    } catch (e) {
      if (!e || e.name !== "AbortError") setStore("Could not open that folder: " + (e && e.message || e), "warn");
    }
  });
  $("reconnect").addEventListener("click", async function () {
    try {
      var h = dirHandle || await idbGet("dir");
      if (h && await perm(h, true)) {
        dirHandle = h; await syncWithFolder(); S.pos = firstOpen(); render(); showFolderButtons(); $("reconnect").classList.add("hidden");
      }
    } catch (e) { setStore("Could not reconnect: " + (e && e.message || e), "warn"); }
  });

  function download(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  $("dlcsv").addEventListener("click", function () {
    var files = [[FILE_DAILY, dailyCsv()], [FILE_QUESTIONS, questionsCsv()], [FILE_ATTEMPTS, attemptsCsv()]];
    files.forEach(function (f, i) {
      setTimeout(function () { download(f[0], new Blob([f[1]], { type: "text/csv;charset=utf-8" })); }, i * 400);
    });
  });
  $("dljson").addEventListener("click", function () {
    download(FILE_JSON, new Blob([JSON.stringify(P, null, 1)], { type: "application/json" }));
  });
  $("imp").addEventListener("click", function () { $("impfile").click(); });
  $("impfile").addEventListener("change", function () {
    var f = this.files && this.files[0]; if (!f) return;
    f.text().then(function (t) {
      var p = JSON.parse(t);
      if (!valid(p)) throw new Error("not a progress file");
      P = p; P.perDay = clampN(P.perDay || 12); touch();
      S.date = today(); S.pos = firstOpen(); render();
    }).catch(function () { setStore("That file is not a Civics 128 backup.", "warn"); });
    this.value = "";
  });

  /* ---------- CSV reports ---------- */
  var LABEL = { got: "Correct", miss: "Incorrect" };
  function ansText(x) { return x.a.join(" | ") + (x.need > 1 ? "  (give " + x.need + ")" : ""); }
  function csvCell(v) {
    v = String(v == null ? "" : v);
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  /* UTF-8 with a byte-order mark so Excel shows curly quotes and bullets correctly. */
  function csv(rows) { return "﻿" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n") + "\r\n"; }
  function localTime(iso) { var d = new Date(iso); return dateStr(d) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }
  function byTime(a, b) { return a.t < b.t ? -1 : a.t > b.t ? 1 : 0; }

  function attemptsCsv() {
    var rows = [["Time", "Date", "Question #", "Question", "Answer(s)", "Result"]];
    P.log.slice().sort(byTime).forEach(function (e) {
      var q = BYN[e.n];
      rows.push([localTime(e.t), e.d, e.n, q ? q.q : "", q ? ansText(q) : "", LABEL[e.r] || e.r]);
    });
    return csv(rows);
  }
  function questionsCsv() {
    var st = stats();
    var rows = [["Question #", "Question", "Answer(s)", "Last result", "Times asked", "Times correct", "Times incorrect", "Last asked", "Starred 65/20"]];
    Q.forEach(function (q) {
      var s = st[q.n];
      rows.push([q.n, q.q, ansText(q), s ? LABEL[s.last] : "Not yet asked", s ? s.asked : 0, s ? s.got : 0, s ? s.miss : 0, s ? s.lastD : "", q.s ? "yes" : ""]);
    });
    return csv(rows);
  }

  /* One row per day with answers: counts, accuracy, and how many questions were right the last time
     they were asked, as of the end of that day. */
  function dailyRows() {
    var by = {}, dates = Object.keys(P.days);
    P.log.forEach(function (e) { if (!by[e.d]) { by[e.d] = []; if (dates.indexOf(e.d) < 0) dates.push(e.d); } by[e.d].push(e); });
    dates.sort();
    var last = {}, rows = [];
    dates.forEach(function (d) {
      var ev = (by[d] || []).slice().sort(byTime), got = 0, miss = 0;
      ev.forEach(function (e) { last[e.n] = e.r; if (e.r === "got") got++; else miss++; });
      var right = 0; Object.keys(last).forEach(function (n) { if (last[n] === "got") right++; });
      var marked = got + miss;
      rows.push({ d: d, set: P.days[d] ? P.days[d].set.length : marked, marked: marked, got: got, miss: miss, pct: marked ? got / marked : null, right: right });
    });
    return rows;
  }
  function dailyCsv() {
    var rows = [["Date", "Questions in set", "Answered", "Correct", "Incorrect", "Percent correct", "Questions currently right (of " + Q.length + ")"]];
    dailyRows().forEach(function (r) {
      rows.push([r.d, r.set, r.marked, r.got, r.miss, r.pct == null ? "" : Math.round(r.pct * 1000) / 10, r.right]);
    });
    return csv(rows);
  }

  /* ---------- performance view ---------- */
  var perfEl = $("perf"), tipTimer = null;

  function svgEl(tag, attrs, inner) {
    var s = "<" + tag;
    for (var k in attrs) s += " " + k + '="' + attrs[k] + '"';
    return s + (inner == null ? "/>" : ">" + inner + "</" + tag + ">");
  }

  /* pts: [{ x: label, y: number, tip: text }]. o: { max, ticks, fmt, ref: { v, label }, title, desc } */
  function lineChart(host, pts, o) {
    var W = Math.max(280, host.clientWidth || 600), H = 230, m = { l: 42, r: 40, t: 16, b: 30 };
    var iw = W - m.l - m.r, ih = H - m.t - m.b, n = pts.length;
    function X(i) { return n === 1 ? m.l + iw / 2 : m.l + iw * i / (n - 1); }
    function Y(v) { return m.t + ih * (1 - v / o.max); }
    var g = "";
    o.ticks.forEach(function (t) {
      g += svgEl("line", { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), class: "grid" });
      g += svgEl("text", { x: m.l - 8, y: Y(t) + 4, class: "tick", "text-anchor": "end" }, o.fmt(t));
    });
    if (o.ref) {
      g += svgEl("line", { x1: m.l, x2: W - m.r, y1: Y(o.ref.v), y2: Y(o.ref.v), class: "ref" });
      g += svgEl("text", { x: W - m.r, y: Y(o.ref.v) - 5, class: "reflabel", "text-anchor": "end" }, o.ref.label);
    }
    var step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 56))));
    pts.forEach(function (p, i) {
      if (i % step === 0 || i === n - 1) g += svgEl("text", { x: X(i), y: H - 8, class: "tick", "text-anchor": i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle" }, esc(p.x));
    });
    if (n > 1) {
      g += svgEl("path", { d: pts.map(function (p, i) { return (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(p.y).toFixed(1); }).join(" "), class: "line" });
    }
    pts.forEach(function (p, i) { g += svgEl("circle", { cx: X(i), cy: Y(p.y), r: 4.5, class: "dot", "data-i": i }); });
    var lp = pts[n - 1];
    g += svgEl("text", { x: Math.min(X(n - 1) + 9, W - 4), y: Y(lp.y) + 4, class: "endlabel" }, o.fmt(lp.y));
    g += svgEl("line", { x1: 0, x2: 0, y1: m.t, y2: m.t + ih, class: "cross hidden", id: "cx-" + o.id });
    host.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(o.desc) + '">' + g + "</svg>" +
      '<div class="tip hidden" role="status"></div>';
    var svg = host.querySelector("svg"), tip = host.querySelector(".tip"), cross = svg.querySelector(".cross");
    function show(clientX) {
      var r = svg.getBoundingClientRect(), x = (clientX - r.left) * (W / r.width), best = 0, bd = 1e9;
      pts.forEach(function (p, i) { var d = Math.abs(X(i) - x); if (d < bd) { bd = d; best = i; } });
      var px = X(best), py = Y(pts[best].y);
      cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.classList.remove("hidden");
      tip.textContent = pts[best].tip; tip.classList.remove("hidden");
      var left = px * (r.width / W);
      tip.style.left = Math.max(4, Math.min(r.width - tip.offsetWidth - 4, left - tip.offsetWidth / 2)) + "px";
      tip.style.top = Math.max(0, py * (r.height / H) - tip.offsetHeight - 12) + "px";
    }
    function hide() { cross.classList.add("hidden"); tip.classList.add("hidden"); }
    svg.addEventListener("pointermove", function (e) { show(e.clientX); });
    svg.addEventListener("pointerdown", function (e) { show(e.clientX); });
    svg.addEventListener("pointerleave", hide);
  }

  function renderPerf() {
    var rows = dailyRows().filter(function (r) { return r.marked > 0; });
    var st = stats(), seen = 0, right = 0, wrong = 0, att = P.log.length, attGot = 0;
    Q.forEach(function (q) { var s = st[q.n]; if (s) { seen++; if (s.last === "got") right++; else wrong++; } });
    P.log.forEach(function (e) { if (e.r === "got") attGot++; });
    if (!rows.length) {
      perfEl.innerHTML = '<div class="top"><h2>Performance</h2></div><p class="status">No answers yet. Mark a few questions and your results show up here.</p>';
      return;
    }
    function tile(label, value, sub) {
      return '<div class="tile"><div class="label">' + label + '</div><div class="val">' + value + "</div>" + (sub ? '<div class="sub">' + sub + "</div>" : "") + "</div>";
    }
    var h = '<div class="top"><h2>Performance</h2></div><div class="tiles">' +
      tile("Accuracy", Math.round(attGot / att * 100) + "%", attGot + " of " + att + " answers") +
      tile("Practice days", rows.length, att + " answers in all") +
      tile("Right now", right, "of " + Q.length + " questions") +
      tile("To work on", wrong, "last answer wrong") +
      tile("Not yet asked", Q.length - seen, "of " + Q.length) + "</div>";

    h += '<div class="chartbox"><div class="ctitle">Accuracy by day</div><div class="csub">Share of each day’s answers marked correct. The test needs 12 of 20 right (60%).</div><div class="chart" id="chart1"></div></div>';
    h += '<div class="chartbox"><div class="ctitle">Questions you currently have right</div><div class="csub">Questions whose most recent answer was correct, at the end of each day.</div><div class="chart" id="chart2"></div></div>';
    if (rows.length < 2) h += '<p class="status">A trend line appears after your second practice day.</p>';

    var weak = Q.filter(function (q) { return st[q.n] && st[q.n].miss > 0; }).sort(function (a, b) {
      var x = st[a.n], y = st[b.n];
      return (y.last === "miss") - (x.last === "miss") || y.miss - x.miss || a.n - b.n;
    }).slice(0, 8);
    if (weak.length) {
      h += '<div class="ctitle">Questions to work on</div><ul class="weak">' + weak.map(function (q) {
        var s = st[q.n];
        return "<li><span class=\"qnum\">#" + q.n + "</span> " + esc(q.q) + ' <span class="status">missed ' + s.miss + " of " + s.asked + (s.last === "got" ? ", right last time" : "") + "</span></li>";
      }).join("") + "</ul>";
    }
    h += '<div class="ctitle">By day</div><div class="tablewrap"><table class="days-table"><thead><tr><th>Day</th><th>Answered</th><th>Correct</th><th>Incorrect</th><th>Accuracy</th><th>Right now</th></tr></thead><tbody>' +
      rows.slice().reverse().map(function (r) {
        return "<tr><td>" + r.d + "</td><td>" + r.marked + "</td><td>" + r.got + "</td><td>" + r.miss + "</td><td>" + Math.round(r.pct * 100) + "%</td><td>" + r.right + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<p class="status">The same numbers are saved as CSV files in your results folder.</p>';
    perfEl.innerHTML = h;

    lineChart($("chart1"), rows.map(function (r) { return { x: niceDate(r.d), y: Math.round(r.pct * 100), tip: niceDate(r.d) + ": " + Math.round(r.pct * 100) + "% (" + r.got + " of " + r.marked + ")" }; }),
      { id: 1, max: 100, ticks: [0, 25, 50, 75, 100], fmt: function (v) { return v + "%"; }, ref: { v: 60, label: "60% pass line" }, desc: "Line chart of daily accuracy, latest " + Math.round(rows[rows.length - 1].pct * 100) + " percent" });
    lineChart($("chart2"), rows.map(function (r) { return { x: niceDate(r.d), y: r.right, tip: niceDate(r.d) + ": " + r.right + " of " + Q.length + " questions right" }; }),
      { id: 2, max: Q.length, ticks: [0, 32, 64, 96, 128].map(function (t) { return Math.round(t * Q.length / 128); }), fmt: function (v) { return "" + v; }, desc: "Line chart of questions currently right, latest " + rows[rows.length - 1].right + " of " + Q.length });
  }

  function renderViews() {
    var h = "";
    [["quiz", "Quiz"], ["perf", "View performance"]].forEach(function (v) {
      h += '<button type="button" class="chip wide" data-view="' + v[0] + '" aria-pressed="' + (S.view === v[0]) + '">' + v[1] + "</button>";
    });
    $("views").innerHTML = h;
  }
  $("views").addEventListener("click", function (e) {
    var b = e.target.closest("[data-view]"); if (!b) return;
    S.view = b.getAttribute("data-view"); render();
  });
  var rz = null;
  window.addEventListener("resize", function () {
    clearTimeout(rz); rz = setTimeout(function () { if (S.view === "perf") renderPerf(); }, 150);
  });

  /* ---------- start ---------- */
  async function init(ev) {
    if (!Q.length) { panel.innerHTML = "<p>Question file data/questions.js did not load.</p>"; return; }
    SHARED = !!(ev && ev.detail && ev.detail.shared);
    var needReconnect = false;
    if (SHARED) {
      /* Shared computer: do not read or write browser storage or any folder. Start empty, in memory. */
      $("pick").classList.add("hidden"); $("reconnect").classList.add("hidden");
      setStore("Shared-computer mode: nothing is saved to this browser or this computer. Your results disappear when you close or reload this page. Anything you download is saved to this computer, so delete it when you finish.", "");
      $("safety").open = false;
      S.ready = true; S.date = today(); ensureDay(S.date); S.pos = firstOpen(); render();
      return;
    }
    loadLocal();
    $("pick").classList.toggle("hidden", !HAS_FS);
    if (!HAS_FS) {
      setStore("This browser can’t write to a folder. Progress stays in this browser; use Download CSVs or Download backup (Chrome, Edge or Opera can save to a folder automatically).", "warn");
    } else {
      setStore("No results folder chosen yet. Choose one so every answer is saved to your computer.", "warn");
      try {
        var h = await idbGet("dir");
        if (h) {
          dirHandle = h;
          if (await perm(h, false)) { await syncWithFolder(); }
          else { needReconnect = true; setStore("Folder “" + h.name + "” needs your OK again. Click Reconnect folder.", "warn"); }
        }
      } catch (e) { /* no remembered folder */ }
      showFolderButtons(needReconnect);
    }
    S.ready = true;
    S.date = today();
    ensureDay(S.date);
    S.pos = firstOpen();
    render();
  }
  /* The app starts only after the agreement gate (gate.js) reports acceptance. */
  document.addEventListener("civics:agreed", init, { once: true });
})();
