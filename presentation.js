/* presentation.js — full-screen presentation mode for the reader.
   Q&A      : one question per slide, ← / → to navigate.
   Summary  : the summary is split into pieces sized for a student to copy down
              in about five minutes; each piece is shown with a countdown timer.
   Presentation-only: reads the rendered reader DOM, never touches app logic. */
(function () {
  'use strict';

  var PIECE_SECONDS = 300;                       // each summary piece is shown for 5 minutes
  var PIECE_MS = PIECE_SECONDS * 1000;
  var SPEED_KEY = 'ncert:presentationSpeed:v1';
  /* Estimated copying speed for a school student (words per minute).
     ~20 wpm is a typical ballpark for neat handwriting copied from a board;
     science text with formulas is slower, so the user can pick another speed. */
  var SPEEDS = [
    { key: 'slow',   label: 'Slow · 15 wpm',   wpm: 15 },
    { key: 'normal', label: 'Normal · 20 wpm', wpm: 20 },
    { key: 'fast',   label: 'Fast · 30 wpm',   wpm: 30 }
  ];

  var readerContent = document.getElementById('readerContent');
  var presentBtn = document.getElementById('presentBtn');
  var readerTitle = document.getElementById('readerTitle');
  if (!readerContent || !presentBtn) return;

  var state = {
    open: false, mode: null, slides: [], index: 0, dir: 1,
    wpm: 20, scale: 1, hadFS: false, keepOpen: false,
    t: { remaining: PIECE_MS, endAt: 0, running: false, userPaused: false, auto: true },
    interval: 0, wakeLock: null, lastFocus: null, stampTimer: 0
  };
  var el = {};

  /* ---------------- helpers ---------------- */
  function readSpeed() {
    try {
      var k = window.localStorage.getItem(SPEED_KEY);
      var s = SPEEDS.filter(function (x) { return x.key === k; })[0];
      return s ? s.wpm : 20;
    } catch (e) { return 20; }
  }
  function saveSpeed(wpm) {
    try {
      var s = SPEEDS.filter(function (x) { return x.wpm === wpm; })[0];
      if (s) window.localStorage.setItem(SPEED_KEY, s.key);
    } catch (e) { /* ignore */ }
  }
  function countWords(str) {
    var t = String(str || '').trim();
    return t ? t.split(/\s+/).length : 0;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  }
  function detectMode() {
    var sec = readerContent.querySelector('[data-reader-section]');
    if (!sec) return null;
    var m = sec.getAttribute('data-reader-section');
    if (m === 'qa' && readerContent.querySelector('.qa-block')) return 'qa';
    if (m === 'summary' && sec.querySelector('p, li')) return 'summary';
    return null;
  }

  /* ---------------- Q&A collection ---------------- */
  function collectQA() {
    var blocks = [].slice.call(readerContent.querySelectorAll('.qa-block'));
    return blocks.map(function (b, i) {
      var h = b.querySelector('.qa-question');
      var ans = b.querySelector('.qa-answer');
      var textEl = h && h.querySelector('.qa-text');
      var qHtml = textEl ? textEl.innerHTML : (h ? h.innerHTML.replace(/^\s*Q\d+\.\s*/, '') : '');
      var label = h ? h.textContent : '';
      var m = label.match(/Q(\d+)/);
      var section = '';
      var prev = b.previousElementSibling;
      while (prev) {
        if (prev.classList.contains('qa-section-title')) { section = prev.textContent.trim(); break; }
        prev = prev.previousElementSibling;
      }
      return { n: m ? m[1] : String(i + 1), section: section, qHtml: qHtml, aHtml: ans ? ans.innerHTML : '', block: b };
    });
  }
  function firstVisibleIndex(slides) {
    for (var i = 0; i < slides.length; i++) {
      var r = slides[i].block.getBoundingClientRect();
      if (r.bottom > 140) return i;
    }
    return 0;
  }

  /* ---------------- Summary segmentation ---------------- */
  var ABBR = /(?:\b(?:e\.g|i\.e|etc|vs|fig|no|mr|mrs|ms|dr|st|approx|eq|sec|ch|viz|cf)|\b[A-Z])\.$/i;
  function splitSentences(text) {
    var out = [], start = 0, re = /[.!?]+["'”’)\]]*\s+/g, m;
    while ((m = re.exec(text))) {
      var end = m.index + m[0].length;
      var termMatch = m[0].match(/^[.!?]+/)[0];
      var upto = text.slice(start, m.index + termMatch.length);
      var next = text.charAt(end);
      var abbr = termMatch === '.' && ABBR.test(upto);
      var lower = /[a-z]/.test(next);
      if (abbr || lower) continue;
      out.push({ text: text.slice(start, end), end: true });
      start = end;
    }
    if (start < text.length) out.push({ text: text.slice(start), end: false });
    return out;
  }
  function elementWords(node) {
    if (node.nodeType === 3) return countWords(node.nodeValue);
    if (node.nodeType !== 1) return 0;
    var math = node.matches('.katex') ? 1 : node.querySelectorAll('.katex').length;
    if (node.matches('.katex')) return 3;           // a formula takes longer to copy than a word
    var clone = node.cloneNode(true);
    [].forEach.call(clone.querySelectorAll('.katex'), function (k) { k.remove(); });
    return countWords(clone.textContent) + math * 3;
  }
  function collectUnits(sec) {
    var units = [], blockId = 0;
    [].forEach.call(sec.children, function (child) {
      var tag = child.tagName;
      if (tag === 'P') {
        blockId++;
        var cur = { nodes: [], words: 0, block: blockId, kind: 'p' };
        var flush = function () {
          if (cur.nodes.length) units.push(cur);
          cur = { nodes: [], words: 0, block: blockId, kind: 'p' };
        };
        [].forEach.call(child.childNodes, function (node) {
          if (node.nodeType === 3) {
            splitSentences(node.nodeValue).forEach(function (part) {
              cur.nodes.push(document.createTextNode(part.text));
              cur.words += countWords(part.text);
              if (part.end) flush();
            });
          } else {
            cur.nodes.push(node.cloneNode(true));
            cur.words += elementWords(node);
          }
        });
        flush();
      } else if (tag === 'UL' || tag === 'OL') {
        blockId++;
        [].forEach.call(child.children, function (li) {
          var u = { nodes: [], words: 0, block: blockId, kind: 'li', list: tag.toLowerCase() };
          [].forEach.call(li.childNodes, function (n) { u.nodes.push(n.cloneNode(true)); u.words += elementWords(n); });
          units.push(u);
        });
      }
    });
    return units;
  }
  function buildPieces(wpm) {
    var sec = readerContent.querySelector('[data-reader-section="summary"]');
    if (!sec) return [];
    var units = collectUnits(sec);
    if (!units.length) return [];
    var total = units.reduce(function (s, u) { return s + u.words; }, 0);
    var perPiece = wpm * (PIECE_SECONDS / 60);
    var n = Math.max(1, Math.min(units.length, Math.ceil(total / perPiece)));

    var prefix = [], acc = 0;
    units.forEach(function (u) { acc += u.words; prefix.push(acc); });
    var cuts = [], last = -1;
    for (var k = 1; k < n; k++) {
      var target = total * k / n, best = -1, bestD = Infinity;
      for (var i = last + 1; i <= units.length - (n - k) - 1; i++) {
        var d = Math.abs(prefix[i] - target);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best < 0) break;
      cuts.push(best); last = best;
    }
    var pieces = [], start = 0;
    cuts.concat([units.length - 1]).forEach(function (end) {
      var group = units.slice(start, end + 1);
      start = end + 1;
      var box = document.createElement('div'), curBlock = -1, holder = null, words = 0;
      group.forEach(function (u) {
        words += u.words;
        if (u.block !== curBlock) {
          curBlock = u.block;
          holder = document.createElement(u.kind === 'li' ? u.list : 'p');
          box.appendChild(holder);
        }
        var target = holder;
        if (u.kind === 'li') { target = document.createElement('li'); holder.appendChild(target); }
        u.nodes.forEach(function (nd) { target.appendChild(nd); });
      });
      [].forEach.call(box.querySelectorAll('p'), function (p) {
        var f = p.firstChild; if (f && f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^\s+/, '');
        var l = p.lastChild; if (l && l.nodeType === 3) l.nodeValue = l.nodeValue.replace(/\s+$/, '');
      });
      pieces.push({ html: box.innerHTML, words: words });
    });
    return pieces;
  }

  /* ---------------- overlay ---------------- */
  function build() {
    if (el.root) return;
    var root = document.createElement('div');
    root.className = 'pm';
    root.id = 'pm';
    root.hidden = true;
    root.tabIndex = -1;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Presentation mode');
    root.innerHTML =
      '<div class="pm-bg" aria-hidden="true"><span class="pm-rays"></span>' +
      '<i class="pm-star s1"></i><i class="pm-star s2"></i><i class="pm-star s3"></i><i class="pm-star s4"></i></div>' +
      '<header class="pm-top">' +
        '<div class="pm-brand"><span class="pm-chip" id="pmChip">Presenting</span><span class="pm-chapter" id="pmChapter"></span></div>' +
        '<div class="pm-counter" id="pmCounter" aria-live="polite"></div>' +
        '<div class="pm-tools">' +
          '<button type="button" class="pm-btn pm-tool" data-pm="smaller" aria-label="Smaller text">A−</button>' +
          '<button type="button" class="pm-btn pm-tool" data-pm="bigger" aria-label="Larger text">A+</button>' +
          '<button type="button" class="pm-btn pm-tool" data-pm="fullscreen" id="pmFsBtn">⛶ Full screen</button>' +
          '<button type="button" class="pm-btn pm-tool pm-exit" data-pm="exit">✕ Exit</button>' +
        '</div>' +
      '</header>' +
      '<div class="pm-progress" aria-hidden="true"><i id="pmFill"></i></div>' +
      '<div class="pm-body">' +
        '<button type="button" class="pm-btn pm-nav pm-prev" data-pm="prev" aria-label="Previous"><span>◀</span><kbd>←</kbd></button>' +
        '<div class="pm-main" id="pmMain">' +
          '<aside class="pm-timer" id="pmTimer" hidden>' +
            '<div class="pm-timer-tag">⏱ Write-along timer</div>' +
            '<div class="pm-ring">' +
              '<svg viewBox="0 0 200 200" aria-hidden="true">' +
                '<circle class="pm-ring-out" cx="100" cy="100" r="98"/>' +
                '<circle class="pm-ring-bg" cx="100" cy="100" r="82"/>' +
                '<circle class="pm-ring-fg" id="pmRing" cx="100" cy="100" r="82" transform="rotate(-90 100 100)"/>' +
              '</svg>' +
              '<div class="pm-time" role="timer"><b id="pmTime">05:00</b><small id="pmTimeLabel">left</small></div>' +
            '</div>' +
            '<div class="pm-timer-info">' +
              '<p class="pm-piece" id="pmPiece"></p>' +
              '<p class="pm-meta" id="pmMeta"></p>' +
              '<div class="pm-timer-btns">' +
                '<button type="button" class="pm-btn" data-pm="toggle" id="pmToggle">⏸ Pause</button>' +
                '<button type="button" class="pm-btn" data-pm="restart">↺ Reset</button>' +
              '</div>' +
              '<label class="pm-check"><input type="checkbox" id="pmAuto" checked><span>Auto-advance when time is up</span></label>' +
              '<label class="pm-speed"><span>Writing speed</span><select id="pmSpeed"></select></label>' +
              '<p class="pm-note" id="pmNote"></p>' +
            '</div>' +
          '</aside>' +
          '<div class="pm-stage"><article class="pm-slide" id="pmSlide"></article>' +
            '<div class="pm-stamp" id="pmStamp" hidden></div></div>' +
        '</div>' +
        '<button type="button" class="pm-btn pm-nav pm-next" data-pm="next" aria-label="Next"><span>▶</span><kbd>→</kbd></button>' +
      '</div>' +
      '<footer class="pm-foot"><nav class="pm-dots" id="pmDots" aria-label="Slides"></nav><p class="pm-hints" id="pmHints"></p></footer>';
    document.body.appendChild(root);

    el.root = root;
    ['pmChip', 'pmChapter', 'pmCounter', 'pmFill', 'pmMain', 'pmTimer', 'pmRing', 'pmTime', 'pmTimeLabel', 'pmPiece',
     'pmMeta', 'pmToggle', 'pmAuto', 'pmSpeed', 'pmNote', 'pmSlide', 'pmStamp', 'pmDots', 'pmHints', 'pmFsBtn']
      .forEach(function (id) { el[id] = document.getElementById(id); });
    el.prev = root.querySelector('.pm-prev');
    el.next = root.querySelector('.pm-next');
    el.pmSpeed.innerHTML = SPEEDS.map(function (s) {
      return '<option value="' + s.wpm + '">' + s.label + '</option>';
    }).join('');

    root.addEventListener('click', onClick);
    el.pmAuto.addEventListener('change', function () { state.t.auto = el.pmAuto.checked; });
    el.pmSpeed.addEventListener('change', function () {
      state.wpm = parseInt(el.pmSpeed.value, 10) || 20;
      saveSpeed(state.wpm);
      state.slides = buildPieces(state.wpm);
      state.index = 0; state.dir = 1;
      renderSlide();
      resetTimer(true);
    });
    var sx = 0, sy = 0;
    el.pmMain.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.pmMain.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 60) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------------- rendering ---------------- */
  /* Shrink the slide text just enough that the whole slide fits without scrolling. */
  function fitSlide() {
    var body = el.pmSlide && el.pmSlide.querySelector('.pm-qbody');
    if (!body) return;
    var f = 1, guard = 0;
    el.pmSlide.style.setProperty('--pm-fit', '1');
    while (body.scrollHeight > body.clientHeight + 2 && f > 0.42 && guard++ < 22) {
      f = Math.round((f - 0.04) * 100) / 100;
      el.pmSlide.style.setProperty('--pm-fit', String(f));
    }
  }
  function renderSlide() {
    var s = state.slides[state.index];
    var n = state.slides.length;
    var slide = el.pmSlide;
    var accent = state.index % 3;
    var html;
    if (state.mode === 'qa') {
      var num = String(s.n);
      html =
        '<div class="pm-qhead">' +
          '<span class="pm-burst' + (num.length > 1 ? ' pm-long' : '') + '"><b>Q' + num + '</b></span>' +
          '<div class="pm-q"></div>' +
        '</div>' +
        '<div class="pm-qbody"><span class="pm-ans-tag">Answer!</span><div class="pm-a"></div></div>';
    } else {
      html =
        '<div class="pm-qhead">' +
          '<span class="pm-burst pm-piecebadge"><b>' + (state.index + 1) + '<em>/' + n + '</em></b></span>' +
          '<div class="pm-q">Summary — piece ' + (state.index + 1) + ' of ' + n + '</div>' +
        '</div>' +
        '<div class="pm-qbody pm-paper"><div class="pm-a pm-copy"></div></div>';
    }
    slide.innerHTML = html;
    if (state.mode === 'qa') {
      slide.querySelector('.pm-q').innerHTML = s.qHtml;
      slide.querySelector('.pm-a').innerHTML = s.aHtml;
      if (s.section) {
        var chip = document.createElement('span');
        chip.className = 'pm-section';
        chip.textContent = s.section;
        slide.insertBefore(chip, slide.firstChild);
      }
    } else {
      slide.querySelector('.pm-a').innerHTML = s.html;
    }
    slide.className = 'pm-slide pm-' + state.mode + ' pm-c' + accent + ' pm-in-' + (state.dir > 0 ? 'next' : 'prev');
    el.root.setAttribute('data-accent', String(accent));
    void slide.offsetWidth;

    el.pmCounter.innerHTML = (state.mode === 'qa' ? 'Question ' : 'Piece ') + '<b>' + (state.index + 1) + '</b> / ' + n;
    el.prev.disabled = state.index === 0;
    el.next.disabled = state.index === n - 1;
    [].forEach.call(el.pmDots.children, function (d, i) { d.classList.toggle('is-active', i === state.index); d.setAttribute('aria-current', i === state.index ? 'true' : 'false'); });
    var body = slide.querySelector('.pm-qbody');
    if (body) body.scrollTop = 0;
    fitSlide();
    paintProgress();
    if (state.mode === 'summary') {
      el.pmPiece.textContent = 'Piece ' + (state.index + 1) + ' of ' + n;
      var w = s.words, mins = Math.max(1, Math.round(w / state.wpm));
      el.pmMeta.textContent = '≈ ' + w + ' words · ~' + mins + ' min to write';
    }
  }
  function buildDots() {
    el.pmDots.innerHTML = '';
    if (state.slides.length > 40) return;
    state.slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pm-dot';
      b.setAttribute('data-pm', 'goto');
      b.setAttribute('data-i', String(i));
      b.setAttribute('aria-label', (state.mode === 'qa' ? 'Question ' : 'Piece ') + (i + 1));
      el.pmDots.appendChild(b);
    });
  }
  function paintProgress() {
    var n = state.slides.length, frac;
    if (state.mode === 'summary') {
      var elapsed = 1 - state.t.remaining / PIECE_MS;
      frac = (state.index + elapsed) / n;
    } else {
      frac = (state.index + 1) / n;
    }
    el.pmFill.style.width = Math.min(100, Math.max(0, frac * 100)).toFixed(2) + '%';
  }
  var CIRC = 2 * Math.PI * 82;
  function paintTimer() {
    var t = state.t;
    el.pmTime.textContent = fmt(t.remaining);
    el.pmRing.style.strokeDasharray = CIRC.toFixed(1);
    el.pmRing.style.strokeDashoffset = (CIRC * (1 - t.remaining / PIECE_MS)).toFixed(1);
    var low = t.remaining > 0 && t.remaining <= 60000, done = t.remaining <= 0;
    el.pmTimer.classList.toggle('is-low', low);
    el.pmTimer.classList.toggle('is-done', done);
    el.pmTimer.classList.toggle('is-paused', !t.running && !done);
    el.pmTimeLabel.textContent = done ? "time's up" : (t.running ? 'left' : 'paused');
    el.pmToggle.textContent = t.running ? '⏸ Pause' : (done ? '↺ Again' : '▶ Resume');
    paintProgress();
  }

  /* ---------------- timer ---------------- */
  function resetTimer(forceRun) {
    var t = state.t;
    t.remaining = PIECE_MS;
    if (forceRun) t.userPaused = false;
    t.running = !t.userPaused;
    t.endAt = Date.now() + t.remaining;
    paintTimer();
  }
  function togglePause() {
    var t = state.t;
    if (t.remaining <= 0) { resetTimer(true); return; }
    if (t.running) {
      t.remaining = Math.max(0, t.endAt - Date.now());
      t.running = false; t.userPaused = true;
    } else {
      t.endAt = Date.now() + t.remaining;
      t.running = true; t.userPaused = false;
    }
    paintTimer();
  }
  function tick() {
    if (!state.open || state.mode !== 'summary') return;
    var t = state.t;
    if (t.running) {
      t.remaining = Math.max(0, t.endAt - Date.now());
      if (t.remaining <= 0) {
        t.running = false;
        paintTimer();
        onTimeUp();
        return;
      }
    }
    paintTimer();
  }
  function onTimeUp() {
    var last = state.index >= state.slides.length - 1;
    if (last) { stamp("ALL DONE!", true); return; }
    if (state.t.auto) {
      state.dir = 1; state.index++;
      renderSlide();
      resetTimer(false);
      stamp('NEXT PIECE!', false);
    } else {
      stamp("TIME'S UP!", false);
    }
  }
  function stamp(text, sticky) {
    var s = el.pmStamp;
    s.textContent = text;
    s.hidden = false;
    s.classList.remove('is-on'); void s.offsetWidth; s.classList.add('is-on');
    window.clearTimeout(state.stampTimer);
    if (!sticky) state.stampTimer = window.setTimeout(function () { s.hidden = true; }, 1600);
  }

  /* ---------------- navigation ---------------- */
  function bump(cls) {
    el.pmSlide.classList.remove('pm-bump-start', 'pm-bump-end'); void el.pmSlide.offsetWidth;
    el.pmSlide.classList.add(cls);
  }
  function goTo(i) {
    var n = state.slides.length;
    if (i < 0) { bump('pm-bump-start'); return; }
    if (i >= n) { bump('pm-bump-end'); return; }
    if (i === state.index) return;
    state.dir = i > state.index ? 1 : -1;
    state.index = i;
    el.pmStamp.hidden = true;
    renderSlide();
    if (state.mode === 'summary') resetTimer(false);
  }
  function go(delta) { goTo(state.index + delta); }

  function setScale(delta) {
    state.scale = Math.min(1.8, Math.max(0.7, Math.round((state.scale + delta) * 100) / 100));
    el.root.style.setProperty('--pm-scale', String(state.scale));
    fitSlide();
  }

  /* ---------------- fullscreen / wake lock ---------------- */
  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function enterFS() {
    var r = el.root, req = r.requestFullscreen || r.webkitRequestFullscreen;
    if (!req) return;
    try { var p = req.call(r); if (p && p.catch) p.catch(function () {}); } catch (e) { /* ignore */ }
  }
  function exitFS() {
    var ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (!ex || !fsElement()) return;
    try { var p = ex.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) { /* ignore */ }
  }
  function toggleFS() {
    state.keepOpen = true;
    if (fsElement()) exitFS(); else { state.keepOpen = false; enterFS(); }
  }
  function onFSChange() {
    var fs = fsElement();
    if (el.pmFsBtn) el.pmFsBtn.textContent = fs ? '⛶ Exit full screen' : '⛶ Full screen';
    if (!fs && state.open && state.hadFS) {
      if (state.keepOpen) state.keepOpen = false; else close();
    }
    state.hadFS = !!fs;
  }
  function acquireWakeLock() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then(function (l) { state.wakeLock = l; }).catch(function () {});
      }
    } catch (e) { /* ignore */ }
  }
  function releaseWakeLock() {
    try { if (state.wakeLock) { state.wakeLock.release(); state.wakeLock = null; } } catch (e) { /* ignore */ }
  }

  /* ---------------- open / close ---------------- */
  function open() {
    var mode = detectMode();
    if (!mode) return;
    build();
    state.mode = mode;
    state.wpm = readSpeed();
    state.scale = 1;
    el.root.style.setProperty('--pm-scale', '1');
    el.pmChapter.textContent = (readerTitle && readerTitle.textContent || '').replace(/\s+—\s+(Notes|Summary|Q&A)$/i, '');
    state.dir = 1;
    if (mode === 'qa') {
      state.slides = collectQA();
      state.index = firstVisibleIndex(state.slides);
      el.pmChip.textContent = 'Quiz time';
      el.pmTimer.hidden = true;
      el.pmMain.classList.remove('has-timer');
      el.pmHints.innerHTML = '<kbd>←</kbd><kbd>→</kbd> Navigate <kbd>Space</kbd> Next <kbd>+</kbd><kbd>−</kbd> Text size <kbd>F</kbd> Full screen <kbd>Esc</kbd> Exit';
    } else {
      state.slides = buildPieces(state.wpm);
      state.index = 0;
      el.pmChip.textContent = 'Summary • timed';
      el.pmTimer.hidden = false;
      el.pmMain.classList.add('has-timer');
      el.pmSpeed.value = String(state.wpm);
      el.pmAuto.checked = state.t.auto;
      el.pmNote.textContent = 'Pieces are sized to what a student can copy down in about 5 minutes (est. ' +
        state.wpm + ' words/min ≈ ' + Math.round(state.wpm * PIECE_SECONDS / 60) + ' words). Change the speed if your class is faster or slower.';
      el.pmHints.innerHTML = '<kbd>←</kbd><kbd>→</kbd> Navigate <kbd>Space</kbd> Pause <kbd>R</kbd> Reset timer <kbd>+</kbd><kbd>−</kbd> Text size <kbd>F</kbd> Full screen <kbd>Esc</kbd> Exit';
    }
    if (!state.slides.length) return;
    state.lastFocus = document.activeElement;
    buildDots();
    el.pmStamp.hidden = true;
    state.open = true;
    el.root.hidden = false;
    document.documentElement.classList.add('pm-lock');
    renderSlide();
    if (mode === 'summary') { state.t.userPaused = false; resetTimer(true); }
    window.clearInterval(state.interval);
    state.interval = window.setInterval(tick, 200);
    enterFS();
    acquireWakeLock();
    try { el.root.focus({ preventScroll: true }); } catch (e) { el.root.focus(); }
  }
  function close() {
    if (!state.open) return;
    state.open = false;
    window.clearInterval(state.interval);
    window.clearTimeout(state.stampTimer);
    releaseWakeLock();
    el.root.hidden = true;
    document.documentElement.classList.remove('pm-lock');
    if (fsElement()) exitFS();
    state.hadFS = false;
    state.slides = [];
    el.pmSlide.innerHTML = '';
    var f = state.lastFocus && document.contains(state.lastFocus) ? state.lastFocus : presentBtn;
    try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  /* ---------------- events ---------------- */
  function onClick(e) {
    var btn = e.target.closest('[data-pm]');
    if (!btn || !el.root.contains(btn)) return;
    var a = btn.getAttribute('data-pm');
    if (a === 'prev') go(-1);
    else if (a === 'next') go(1);
    else if (a === 'exit') close();
    else if (a === 'bigger') setScale(0.1);
    else if (a === 'smaller') setScale(-0.1);
    else if (a === 'fullscreen') toggleFS();
    else if (a === 'toggle') togglePause();
    else if (a === 'restart') resetTimer(true);
    else if (a === 'goto') goTo(parseInt(btn.getAttribute('data-i'), 10) || 0);
    if (btn.tagName === 'BUTTON') btn.blur();
    try { el.root.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
  }

  document.addEventListener('keydown', function (e) {
    if (!state.open) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, onSelect = e.target && e.target.tagName === 'SELECT';
    var handled = true;
    if (k === 'ArrowRight' || k === 'PageDown') { if (onSelect) return; go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { if (onSelect) return; go(-1); }
    else if (k === 'Home') goTo(0);
    else if (k === 'End') goTo(state.slides.length - 1);
    else if (k === ' ' || k === 'Spacebar') {
      if (onSelect || (e.target && e.target.type === 'checkbox')) return;
      if (state.mode === 'summary') togglePause(); else go(e.shiftKey ? -1 : 1);
    }
    else if (k === 'Escape') close();
    else if (k === '+' || k === '=') setScale(0.1);
    else if (k === '-' || k === '_') setScale(-0.1);
    else if (k === 'f' || k === 'F') toggleFS();
    else if ((k === 'r' || k === 'R') && state.mode === 'summary') resetTimer(true);
    else if (k === 'Tab') {
      var items = [].filter.call(el.root.querySelectorAll('button, input, select'), function (n) { return !n.disabled && n.offsetParent !== null; });
      if (items.length) {
        var i = items.indexOf(document.activeElement);
        var nx = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
        items[nx].focus();
        e.preventDefault();
      }
      e.stopImmediatePropagation();
      return;
    }
    else handled = false;
    if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('keyup', function (e) {
    if (state.open && (e.key === ' ' || e.key === 'Spacebar') && !(e.target && (e.target.tagName === 'SELECT' || e.target.type === 'checkbox'))) e.preventDefault();
  }, true);
  document.addEventListener('fullscreenchange', onFSChange);
  document.addEventListener('webkitfullscreenchange', onFSChange);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && state.open && !state.wakeLock) acquireWakeLock();
  });

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    if (!state.open) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(fitSlide, 120);
  });

  presentBtn.addEventListener('click', open);

  /* show the button only on Q&A / Summary screens */
  function refreshButton() {
    var m = detectMode();
    presentBtn.hidden = !m;
    if (m) presentBtn.textContent = m === 'summary' ? '▶ Present · timed' : '▶ Present';
  }
  new MutationObserver(refreshButton).observe(readerContent, { childList: true });
  refreshButton();
})();
