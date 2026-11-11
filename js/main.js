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

  // Lists that appear one item after another once their block is revealed
  document.querySelectorAll('.tags, .facts, .offer-list, .project .chips, .contact-alt, .request-form').forEach(function (list) {
    list.classList.add('stagger');
    Array.prototype.forEach.call(list.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  // Scroll-linked motion: progress line, hero depth, site preview straightening.
  // Writes CSS variables once per frame; CSS does the drawing.
  var root = document.documentElement;
  var hero = document.querySelector('.hero');
  var work = document.querySelector('.mini-browser');
  if (!reduceMotion) {
    var ticking = false;
    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var update = function () {
      ticking = false;
      var vh = window.innerHeight;
      var max = root.scrollHeight - vh;
      root.style.setProperty('--progress', max > 0 ? clamp01(window.scrollY / max).toFixed(4) : 0);
      if (hero) {
        var hp = clamp01(window.scrollY / (hero.offsetHeight || vh));
        hero.style.setProperty('--hero-p', hp.toFixed(4));
      }
      if (work) {
        var r = work.getBoundingClientRect();
        // 0 when the preview's top is at the bottom of the screen, 1 once it is 40% up
        var wp = clamp01((vh - r.top) / (vh * 0.6));
        work.style.setProperty('--work-p', wp.toFixed(4));
      }
    };
    var onMove = function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);
    update();
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

  // Hero greeting: "hello" in the world's most spoken languages
  var word = document.querySelector('.greeting-word');
  if (word && !reduceMotion) {
    var greetings = [
      { text: 'Hello', lang: 'en' },
      { text: 'Hola', lang: 'es' },
      { text: '你好', lang: 'zh' },
      { text: 'नमस्ते', lang: 'hi' },
      { text: 'مرحبا', lang: 'ar' },
      { text: 'Bonjour', lang: 'fr' },
      { text: 'Olá', lang: 'pt' },
      { text: 'হ্যালো', lang: 'bn' },
      { text: 'Привіт', lang: 'uk' },
      { text: 'Привет', lang: 'ru' },
      { text: 'こんにちは', lang: 'ja' },
      { text: 'Hallo', lang: 'de' },
      { text: '안녕하세요', lang: 'ko' },
      { text: 'Merhaba', lang: 'tr' },
      { text: 'Ciao', lang: 'it' },
      { text: 'Xin chào', lang: 'vi' },
      { text: 'Cześć', lang: 'pl' }
    ];
    var gi = 0;
    setInterval(function () {
      if (document.hidden) return;
      gi = (gi + 1) % greetings.length;
      word.classList.add('is-leaving');
      setTimeout(function () {
        word.textContent = greetings[gi].text;
        word.setAttribute('lang', greetings[gi].lang);
        word.setAttribute('dir', greetings[gi].lang === 'ar' ? 'rtl' : 'ltr');
        word.classList.remove('is-leaving');
        word.classList.add('is-entering');
        void word.offsetWidth; // restart transition from the entering state
        word.classList.remove('is-entering');
      }, 350);
    }, 2000);
  }

  // Name badge: tilts gently toward the pointer (fine pointers only)
  var badge = document.querySelector('[data-tilt]');
  var stage = badge && badge.closest('section');
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

  // "Ask about ..." links pre-select the matching service in the form
  document.querySelectorAll('[data-service]').forEach(function (link) {
    link.addEventListener('click', function () {
      var value = link.getAttribute('data-service') === 'website' ? 'A website' : 'Data entry & admin help';
      var radio = document.querySelector('input[name="service"][value="' + value + '"]');
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  });

  // Request form: checks the fields, then opens the visitor's email app
  // with everything filled in (no server needed)
  var form = document.getElementById('request-form');
  if (form) {
    var TO = 'abramitov.danya@gmail.com';
    var statusEl = document.getElementById('form-status');

    var setError = function (id, fieldEl, msg) {
      var err = document.getElementById(id);
      if (err) err.textContent = msg || '';
      var wrap = fieldEl && fieldEl.closest('.field');
      if (wrap) wrap.classList.toggle('has-error', !!msg);
      if (fieldEl && fieldEl.setAttribute) {
        if (msg) { fieldEl.setAttribute('aria-invalid', 'true'); fieldEl.setAttribute('aria-describedby', id); }
        else fieldEl.removeAttribute('aria-invalid');
      }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var phone = form.elements.phone.value.trim();
      var company = form.elements.company.value.trim();
      var details = form.elements.details.value.trim();
      var language = form.elements.language.value;
      var serviceEl = form.querySelector('input[name="service"]:checked');
      var service = serviceEl ? serviceEl.value : '';

      var firstBad = null;
      var check = function (ok, id, el, msg) {
        setError(id, el, ok ? '' : msg);
        if (!ok && !firstBad) firstBad = el;
      };
      check(name.length > 0, 'f-name-error', form.elements.name, 'Please enter your name.');
      check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'f-email-error', form.elements.email,
        email ? 'That email looks incomplete. Please check it.' : 'Please enter your email so I can reply.');
      check(!!service, 'f-service-error', form.querySelector('input[name="service"]'), 'Please choose what you need.');
      check(details.length > 0, 'f-details-error', form.elements.details, 'Please tell me a little about what you need.');

      if (firstBad) {
        if (statusEl) { statusEl.textContent = 'Please fix the highlighted fields.'; statusEl.classList.remove('is-ok'); }
        firstBad.focus();
        return;
      }

      var lines = [
        'Name: ' + name,
        'Email: ' + email,
        phone ? 'Phone: ' + phone : null,
        company ? 'Business: ' + company : null,
        'Service: ' + service,
        'Preferred language: ' + language,
        '',
        'What I need:',
        details
      ].filter(function (l) { return l !== null; });

      var subject = 'New request: ' + service + ' (' + name + ')';
      var href = 'mailto:' + TO +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      window.location.href = href;
      if (statusEl) {
        statusEl.textContent = 'Thanks, ' + name + '! Your email app should open now with your message ready. Just press send there. If nothing opened, copy my email on the left and write to me directly.';
        statusEl.classList.add('is-ok');
      }
    });

    // Clear an error as soon as the visitor fixes the field
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var wrap = t.closest('.field');
      if (wrap && wrap.classList.contains('has-error')) {
        var err = wrap.querySelector('.field-error');
        if (err) err.textContent = '';
        wrap.classList.remove('has-error');
        t.removeAttribute('aria-invalid');
      }
    });
  }

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
