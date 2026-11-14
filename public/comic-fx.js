/* comic-fx.js — presentation-only enhancements (scroll reveal, Q badges, reading progress).
   Does not touch app logic; safe to remove along with comic-theme.css. */
(function () {
  'use strict';

  var SELECTOR = [
    '.class-card', '.subject-card', '.textbook-card', '.content-type-card', '.entry-card',
    '.dashboard-card', '.qa-block', '.note-topic', '.note-example', '.qa-section-title',
    '.selected-class-bar', '.content-type-header', '.reader-topics', '.reader-paper',
    '.empty-state', '.empty-library', '.search-wrap'
  ].join(',');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = null;

  /* Wrap the leading "Q1." of each question in a badge, keeping textContent identical. */
  function enhanceQuestions(root) {
    root.querySelectorAll('.qa-question:not([data-qa])').forEach(function (h) {
      h.setAttribute('data-qa', '1');
      var first = h.firstChild;
      if (!first || first.nodeType !== 3) return;
      var m = first.nodeValue.match(/^\s*(Q\d+\.)\s*/);
      if (!m) return;
      var badge = document.createElement('span');
      badge.className = 'qa-num';
      badge.textContent = m[0];
      first.nodeValue = first.nodeValue.slice(m[0].length);
      var text = document.createElement('span');
      text.className = 'qa-text';
      while (h.firstChild) text.appendChild(h.firstChild);
      h.appendChild(badge);
      h.appendChild(text);
    });
  }

  function register(root) {
    if (!io) return;
    root.querySelectorAll(SELECTOR).forEach(function (el) {
      if (el.hasAttribute('data-fx')) return;
      el.setAttribute('data-fx', '1');
      var idx = 0, sib = el.previousElementSibling;
      while (sib && idx < 60) { if (sib.matches(SELECTOR)) idx++; sib = sib.previousElementSibling; }
      el.style.setProperty('--fx-delay', ((idx % 6) * 70) + 'ms');
      el.classList.add('fx-reveal');
      io.observe(el);
    });
  }

  /* When a hidden screen is shown again, replay its entrance. */
  function replay(section) {
    var items = section.querySelectorAll('.fx-reveal');
    items.forEach(function (el) {
      el.classList.remove('fx-in');
      io.observe(el);
    });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fx-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
  }

  var queued = false;
  var pendingShown = [];
  function flush() {
    queued = false;
    enhanceQuestions(document);
    register(document);
    if (io) pendingShown.splice(0).forEach(function (s) { if (!s.hidden) replay(s); });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(flush);
  }

  new MutationObserver(function (records) {
    records.forEach(function (r) {
      if (r.type === 'attributes' && r.target.nodeType === 1 && !r.target.hidden) pendingShown.push(r.target);
    });
    schedule();
  }).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['hidden']
  });

  /* Reading progress bar (reader view only) */
  var bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function updateBar() {
    if (!document.body.classList.contains('reader-open')) { bar.style.opacity = '0'; return; }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.opacity = '1';
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
  }
  window.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);

  schedule();
})();
