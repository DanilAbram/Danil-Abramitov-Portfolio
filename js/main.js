(function () {
  'use strict';

  // Let CSS know JS is available (hides .reveal until animated in)
  document.documentElement.classList.add('js');

  var body = document.body;
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header shadow/background once the page is scrolled
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  function setMenu(open) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.classList.toggle('nav-open', open);
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) {
      setMenu(false);
      if (toggle) toggle.focus();
    }
  });

  if (window.matchMedia) {
    var desktop = window.matchMedia('(min-width: 900px)');
    var onChange = function (e) { if (e.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  // Active nav link based on the section in view
  var sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var hash = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          var active = link.getAttribute('href') === hash;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  reveals.forEach(function (el) {
    var delay = el.getAttribute('data-delay');
    if (delay) el.style.transitionDelay = delay + 'ms';
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { revealer.observe(el); });
  }

  // Copy email to clipboard (falls back to mailto:)
  var status = document.getElementById('copy-status');
  document.querySelectorAll('button[data-copy]').forEach(function (btn) {
    var timer;
    btn.addEventListener('click', function () {
      var value = btn.dataset.copy;
      var label = btn.querySelector('.copy-label');
      var fallback = function () { window.location.href = 'mailto:' + value; };

      if (!navigator.clipboard || !navigator.clipboard.writeText) return fallback();

      navigator.clipboard.writeText(value).then(function () {
        var original = label ? (label.dataset.original || label.textContent) : '';
        if (label) {
          label.dataset.original = original;
          label.textContent = 'Copied!';
        }
        btn.classList.add('is-copied');
        if (status) status.textContent = 'Email copied to clipboard';
        clearTimeout(timer);
        timer = setTimeout(function () {
          if (label) label.textContent = original;
          btn.classList.remove('is-copied');
        }, 2000);
      }, fallback);
    });
  });

  // Hero greeting: cycles through the three languages Danil speaks
  var word = document.querySelector('.greeting-word');
  if (word && !reduceMotion) {
    var greetings = [
      { text: 'Hello', lang: 'en' },
      { text: 'Привіт', lang: 'uk' },
      { text: 'Привет', lang: 'ru' }
    ];
    var gi = 0;
    setInterval(function () {
      if (document.hidden) return;
      gi = (gi + 1) % greetings.length;
      word.classList.add('is-leaving');
      setTimeout(function () {
        word.textContent = greetings[gi].text;
        word.setAttribute('lang', greetings[gi].lang);
        word.classList.remove('is-leaving');
        word.classList.add('is-entering');
        void word.offsetWidth; // restart transition from the entering state
        word.classList.remove('is-entering');
      }, 350);
    }, 2600);
  }

  // Name badge: tilts gently toward the pointer (fine pointers only)
  var badge = document.querySelector('[data-tilt]');
  var stage = badge && badge.closest('.hero');
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (badge && stage && finePointer && !reduceMotion) {
    var frame = null;
    stage.addEventListener('pointermove', function (e) {
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = null;
        var r = badge.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        var dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        badge.classList.add('is-tilting');
        badge.style.transform =
          'rotate(' + (-4 + dx * 6).toFixed(2) + 'deg) ' +
          'rotateY(' + (dx * 14).toFixed(2) + 'deg) ' +
          'rotateX(' + (-dy * 10).toFixed(2) + 'deg)';
      });
    });
    stage.addEventListener('pointerleave', function () {
      badge.style.transition = 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
      badge.style.transform = 'rotate(-4deg)';
      setTimeout(function () { badge.style.transition = ''; }, 900);
    });
  }

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
