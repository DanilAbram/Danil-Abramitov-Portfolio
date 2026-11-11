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

  // Lists that appear one item after another once their block is revealed
  document.querySelectorAll('.tags, .facts, .offer-list, .project .chips, .contact-alt, .request-form').forEach(function (list) {
    list.classList.add('stagger');
    Array.prototype.forEach.call(list.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  // ---------- Scroll-linked effects ----------
  // Header background, nav highlight, progress line, hero depth, page stack
  // and the site preview all run from one per-frame update.
  // Layout is only READ in measure() (on load, resize and font changes),
  // all reads first, then writes. Scrolling itself does plain math with the
  // cached numbers, so it never forces the browser to recalculate layout.
  var root = document.documentElement;
  var main = document.querySelector('main');
  var hero = document.querySelector('.hero');
  var work = document.querySelector('.mini-browser');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  // Page stack: every screen except the last sticks and is covered by the next
  var stack = reduceMotion ? [] : sections.slice(0, -1);
  stack.forEach(function (s) { s.classList.add('stack'); });
  if (stack.length) root.classList.add('stack-on');

  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var m = { vh: window.innerHeight, docH: 0, tops: [], heroH: 0, workTop: 0 };
  var currentHash;
  var scrolledState;

  // Offset of an element from the top of its section, ignoring sticky/transforms
  function offsetWithin(el, section) {
    var y = 0;
    while (el && el !== section) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  function measure() {
    // ---- reads ----
    var vh = window.innerHeight;
    var heights = sections.map(function (s) { return s.offsetHeight; });
    var start = main.offsetTop + (parseFloat(getComputedStyle(sections[0]).marginTop) || 0);
    var tops = [];
    heights.reduce(function (y, h, i) { tops[i] = y; return y + h; }, start);
    var workSection = work ? work.closest('section') : null;
    var workTop = work && workSection ? tops[sections.indexOf(workSection)] + offsetWithin(work, workSection) : 0;
    m = { vh: vh, docH: root.scrollHeight, tops: tops, heroH: heights[0] || vh, workTop: workTop };
    // ---- writes ----
    stack.forEach(function (s, i) {
      // Tall pages stick only once their bottom reaches the screen bottom,
      // so every part of them can still be read
      s.style.setProperty('--stick', Math.min(0, vh - heights[i]) + 'px');
    });
    scrollFrame();
  }

  function scrollFrame() {
    ticking = false;
    var y = window.scrollY;
    var vh = m.vh;

    // Header turns solid once the page is scrolled
    var scrolled = y > 8;
    if (scrolled !== scrolledState && header) {
      scrolledState = scrolled;
      header.classList.toggle('is-scrolled', scrolled);
    }

    // Nav highlight: last section whose normal-flow top passed 45% of the screen
    var line = y + vh * 0.45;
    var hash = null;
    for (var i = 0; i < sections.length; i++) {
      if (m.tops[i] <= line) hash = '#' + sections[i].id;
    }
    if (hash !== currentHash) {
      currentHash = hash;
      navLinks.forEach(function (link) {
        var active = link.getAttribute('href') === hash;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    if (reduceMotion) return;

    // Page stack: how far the next page has slid over this one (0..1)
    stack.forEach(function (s, i) {
      var nextTop = m.tops[i + 1] - y;
      s.style.setProperty('--cover', clamp01((vh - nextTop) / vh).toFixed(4));
    });
    var max = m.docH - vh;
    root.style.setProperty('--progress', max > 0 ? clamp01(y / max).toFixed(4) : 0);
    if (hero) hero.style.setProperty('--hero-p', clamp01(y / m.heroH).toFixed(4));
    if (work) {
      // 0 when the preview's top is at the bottom of the screen, 1 once it is 40% up
      work.style.setProperty('--work-p', clamp01((vh - (m.workTop - y)) / (vh * 0.6)).toFixed(4));
    }
  }

  var ticking = false;
  function schedule() {
    if (!ticking) { ticking = true; requestAnimationFrame(scrollFrame); }
  }
  var measureQueued = false;
  function scheduleMeasure() {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(function () { measureQueued = false; measure(); });
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', scheduleMeasure);
  window.addEventListener('load', scheduleMeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(scheduleMeasure);
    sections.forEach(function (s) { ro.observe(s); });
  }
  scheduleMeasure();

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

  // Request form: checks the fields, then sends the request to Danil's
  // inbox through FormSubmit (no server of our own). Falls back to a
  // ready-made email if the service can't be reached.
  var form = document.getElementById('request-form');
  if (form) {
    var TO = 'abramitov.danya@gmail.com';
    var ENDPOINT = 'https://formsubmit.co/ajax/' + TO;
    var statusEl = document.getElementById('form-status');
    var doneEl = document.getElementById('form-done');
    var sendBtn = form.querySelector('.send-btn');
    var sendLabel = form.querySelector('.send-label');
    var sending = false;

    var setSending = function (on) {
      sending = on;
      form.classList.toggle('is-sending', on);
      form.setAttribute('aria-busy', on ? 'true' : 'false');
      if (sendBtn) sendBtn.disabled = on;
      if (sendLabel) sendLabel.textContent = on ? 'Sending…' : 'Send request';
    };

    // kind: '' | 'error'; mailHref adds an "email me instead" link
    var showStatus = function (text, kind, mailHref) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'form-status' + (kind ? ' is-' + kind : '');
      if (mailHref) {
        var a = document.createElement('a');
        a.href = mailHref;
        a.textContent = 'email it to me instead';
        statusEl.appendChild(a);
        statusEl.appendChild(document.createTextNode('.'));
      }
    };

    var showDone = function (name, email) {
      document.getElementById('done-name').textContent = name;
      document.getElementById('done-email').textContent = email;
      form.hidden = true;
      doneEl.hidden = false;
      doneEl.focus();
    };

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
        showStatus('Please fix the highlighted fields.', 'error');
        firstBad.focus();
        return;
      }
      if (sending) return;

      // Bots fill the hidden field: act as if it worked, send nothing
      if (form.elements._honey && form.elements._honey.value) { showDone(name, email); return; }

      var subject = 'New request: ' + service + ' from ' + name + (company ? ' (' + company + ')' : '');
      var payload = {
        name: name,
        email: email,
        phone: phone || '-',
        company: company || '-',
        service: service,
        message: details,
        _subject: subject,
        _template: 'table',
        _captcha: 'false'
      };

      // Ready-made email as a backup if the service can't be reached
      var mailBody = [
        'Name: ' + name, 'Email: ' + email,
        phone ? 'Phone: ' + phone : null, company ? 'Business: ' + company : null,
        'Service: ' + service, '', details
      ].filter(function (l) { return l !== null; }).join('\n');
      var mailHref = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(mailBody);

      setSending(true);
      showStatus('', '');
      var controller = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, 15000);

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || 'Send failed');
          });
        })
        .then(function () { showDone(name, email); })
        .catch(function () {
          if (navigator.onLine === false) {
            showStatus('You seem to be offline. Check your connection and press Send request again.', 'error');
          } else {
            showStatus('Sorry, your request didn’t go through. Please try again, or ', 'error', mailHref);
          }
        })
        .then(function () {
          clearTimeout(timer);
          setSending(false);
        });
    });

    var sendAnother = document.getElementById('send-another');
    if (sendAnother) {
      sendAnother.addEventListener('click', function () {
        form.reset();
        doneEl.hidden = true;
        form.hidden = false;
        showStatus('', '');
        form.elements.name.focus();
      });
    }

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
