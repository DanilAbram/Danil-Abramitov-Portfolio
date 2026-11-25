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
  document.querySelectorAll('.tags, .facts, .stats, .contact-alt').forEach(function (list) {
    list.classList.add('stagger');
    Array.prototype.forEach.call(list.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  // Liquid glass header: draws the map that tells the browser how far to bend
  // the picture behind the glass. Chromium only; others keep the plain blur.
  var glassMap = document.getElementById('liquid-map');
  if (glassMap && navigator.userAgentData && window.matchMedia('(min-width: 900px)').matches) {
    var drawGlass = function () {
      var w = Math.round(Math.min(1120, document.documentElement.clientWidth - 16));
      var h = header.offsetHeight - 10;
      var edge = 15;
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
        '<defs><linearGradient id="x"><stop stop-color="red" stop-opacity="0"/><stop offset="1" stop-color="red"/></linearGradient>' +
        '<linearGradient id="y" x2="0" y2="1"><stop stop-color="lime" stop-opacity="0"/><stop offset="1" stop-color="lime"/></linearGradient>' +
        '<filter id="b"><feGaussianBlur stdDeviation="7"/></filter></defs>' +
        '<rect width="100%" height="100%" fill="black"/>' +
        '<rect width="100%" height="100%" fill="url(#x)"/>' +
        '<rect width="100%" height="100%" fill="url(#y)" style="mix-blend-mode:screen"/>' +
        '<rect x="' + edge + '" y="' + edge + '" width="' + (w - 2 * edge) + '" height="' + (h - 2 * edge) +
        '" rx="' + (h / 2 - edge) + '" fill="rgb(128,128,0)" filter="url(#b)"/></svg>';
      glassMap.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(svg));
      glassMap.setAttribute('width', w);
      glassMap.setAttribute('height', h);
    };
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        setTimeout(function () { drawGlass(); document.documentElement.classList.add('liquid'); }, 0);
      });
    });
    window.addEventListener('resize', drawGlass);
  }

  // Soft light that follows the mouse. It trails a little behind the arrow and
  // stops working out frames once it has caught up. Touch never shows it.
  if (!reduceMotion && window.PointerEvent) {
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    body.appendChild(glow);
    var projectBox = document.getElementById('case');
    var gx = 0, gy = 0, toX = 0, toY = 0, glowOn = false, glowFrame = 0;
    var moveGlow = function () {
      gx += (toX - gx) * 0.16;
      gy += (toY - gy) * 0.16;
      var there = Math.abs(toX - gx) < 0.3 && Math.abs(toY - gy) < 0.3;
      if (there) { gx = toX; gy = toY; }
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      glowFrame = there ? 0 : requestAnimationFrame(moveGlow);
    };
    var hideGlow = function () { glowOn = false; glow.classList.remove('is-on'); };
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') { hideGlow(); return; }
      // An open project sits above the page, so the light moves in with it
      var host = projectBox && projectBox.open ? projectBox : body;
      if (glow.parentNode !== host) host.appendChild(glow);
      toX = e.clientX;
      toY = e.clientY;
      if (!glowOn) {
        glowOn = true;
        gx = toX; gy = toY;
        glow.classList.add('is-on');
      }
      if (!glowFrame) glowFrame = requestAnimationFrame(moveGlow);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', hideGlow);
    window.addEventListener('blur', hideGlow);
  }

  // ---------- Scroll-linked effects ----------
  // Header background, nav highlight, progress line, hero depth and
  // page stack all run from one per-frame update.
  // Layout is only READ in measure() (on load, resize and font changes),
  // all reads first, then writes. Scrolling itself does plain math with the
  // cached numbers, so it never forces the browser to recalculate layout.
  var root = document.documentElement;
  var main = document.querySelector('main');
  var hero = document.querySelector('.hero');
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  // Page stack: every screen except the last sticks and is covered by the next
  var stack = reduceMotion ? [] : sections.slice(0, -1);
  stack.forEach(function (s) { s.classList.add('stack'); });
  if (stack.length) root.classList.add('stack-on');

  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var m = { vh: 0, docH: 0, tops: [], heroH: 0 }; // filled by the first measure()
  var currentHash;
  var scrolledState;

  function measure() {
    // ---- reads ----
    var y = window.scrollY;
    var vh = window.innerHeight;
    var heights = sections.map(function (s) { return s.offsetHeight; });
    // The hero's negative margin is already part of main.offsetTop
    var start = main.offsetTop;
    var tops = [];
    heights.reduce(function (y, h, i) { tops[i] = y; return y + h; }, start);
    m = { vh: vh, docH: root.scrollHeight, tops: tops, heroH: heights[0] || vh };
    // ---- writes ----
    stack.forEach(function (s, i) {
      // Tall pages stick only once their bottom reaches the screen bottom,
      // so every part of them can still be read
      s.style.setProperty('--stick', Math.min(0, vh - heights[i]) + 'px');
    });
    paint(y);
  }

  function scrollFrame() {
    ticking = false;
    if (m.vh) paint(window.scrollY);
  }

  function paint(y) {
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
  }

  var ticking = false;
  function schedule() {
    if (!ticking) { ticking = true; requestAnimationFrame(scrollFrame); }
  }
  var measureQueued = false;
  function scheduleMeasure() {
    if (measureQueued) return;
    measureQueued = true;
    // Just after a frame: the layout is ready, so reading it costs nothing
    requestAnimationFrame(function () {
      setTimeout(function () { measureQueued = false; measure(); }, 0);
    });
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', scheduleMeasure);
  window.addEventListener('load', scheduleMeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure);
  if ('ResizeObserver' in window) {
    // Called right after layout, on start and whenever a section changes size
    var ro = new ResizeObserver(measure);
    sections.forEach(function (s) { ro.observe(s); });
  } else {
    scheduleMeasure();
  }

  // Links to a page section (menu, logo, Back to top). The sections stick, so
  // the browser thinks the ones above are already on screen and barely moves.
  // Scroll to their real place instead.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var href = link.getAttribute('href');
    var at = sections.findIndex(function (s) { return '#' + s.id === href; });
    if (at === -1) return;
    e.preventDefault();
    if (caseBox && caseBox.open && finishClose) finishClose(); // link inside a project page
    if (location.hash !== href) history.pushState(null, '', href);
    pushed = false;
    measure();
    var gap = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    window.scrollTo(0, Math.max(0, m.tops[at] - gap));
    // Keyboard and screen reader users continue from that section
    var target = sections[at];
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', function () { target.removeAttribute('tabindex'); }, { once: true });
  });

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

  // ---------- My work: filters ----------
  var projects = Array.prototype.slice.call(document.querySelectorAll('#projects .project'));
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var workCount = document.getElementById('work-count');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var kind = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var shown = projects.filter(function (p) {
        var match = kind === 'all' || p.getAttribute('data-kinds').split(' ').indexOf(kind) > -1;
        p.hidden = !match;
        return match;
      });
      shown.forEach(function (p, i) {
        // First is wide; a last one with no neighbour is wide too, mirrored
        var alone = i > 0 && i === shown.length - 1 && shown.length % 2 === 0;
        p.classList.toggle('is-wide', i === 0 || alone);
        p.classList.toggle('is-flipped', alone);
        p.classList.add('is-visible');
      });
      workCount.textContent = shown.length + (shown.length === 1 ? ' project' : ' projects');
    });
  });

  // ---------- My work: project pages ----------
  // The address (#work/sage) decides what is open, so the browser's Back
  // button closes a project and a project link can be shared.
  // Pressing a card makes its picture fly and grow into the project page;
  // closing flies it back. With reduced motion everything just appears.
  var caseBox = document.getElementById('case');
  if (caseBox && caseBox.showModal) {
    var pages = Array.prototype.slice.call(caseBox.querySelectorAll('[data-case-page]'));
    var caseIds = pages.map(function (p) { return p.getAttribute('data-case-page'); });
    var caseCount = document.getElementById('case-count');
    var nextName = document.getElementById('case-next-name');
    var current = -1;
    var pushed = false;  // did we add the history entry ourselves?
    var closing = false;
    var opening = false; // a card was pressed and its picture is getting ready
    var flying = null;   // card picture hidden while its copy is in the air
    var canAnimate = !reduceMotion && typeof caseBox.animate === 'function';
    var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
    var FLY = 'cubic-bezier(0.45, 0, 0.1, 1)'; // gentle start, soft landing

    var titleOf = function (i) { return pages[i].querySelector('.case-title'); };
    var heroOf = function (i) { return pages[i].querySelector('.case-hero'); };
    var cardPic = function (i) {
      var btn = document.querySelector('[data-case="' + caseIds[i] + '"]');
      return btn ? btn.closest('.project').querySelector('.project-pic') : null;
    };
    var onScreen = function (r) { return r.width > 0 && r.bottom > 90 && r.top < window.innerHeight - 90; };
    // Transform that makes a box laid out at `to` look like it sits at `from`
    var flip = function (from, to) {
      return 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' +
        (from.width / to.width) + ',' + (from.height / to.height) + ')';
    };
    var fadeParts = function () {
      var page = pages[current];
      return [caseBox.querySelector('.case-bar')]
        .concat(Array.prototype.slice.call(page.querySelector('.case-body').children))
        .concat([page.querySelector('.case-thumbs'), caseBox.querySelector('.case-next')]);
    };
    var stopAnimations = function () {
      if (!caseBox.getAnimations) return;
      caseBox.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
    };
    // Run fn when an animation ends, or after ms if the browser has paused it
    // (background tab). A cancelled animation never runs fn.
    var after = function (anim, ms, fn) {
      var done = false;
      var run = function () { if (!done) { done = true; fn(); } };
      anim.finished.then(run, function () { done = true; });
      setTimeout(run, ms);
    };
    var land = function () {
      if (flying) flying.style.visibility = '';
      flying = null;
      caseBox.classList.remove('is-flying');
    };
    var hideCard = function (pic) {
      land();
      flying = pic;
      pic.style.visibility = 'hidden';
      caseBox.classList.add('is-flying');
    };
    // Page scroll is locked while a project is open; the padding keeps the
    // page from shifting when its scrollbar goes away
    var lockPage = function () {
      if (root.classList.contains('case-open')) return;
      root.style.setProperty('--sbw', (window.innerWidth - root.clientWidth) + 'px');
      root.classList.add('case-open');
    };
    // Back to the first picture, using the file the card has already loaded
    var resetGallery = function (i) {
      var pic = cardPic(i);
      var img = pic && pic.querySelector('img');
      var hero = heroOf(i);
      pages[i].querySelectorAll('.case-thumbs button').forEach(function (t, n) {
        t.setAttribute('aria-pressed', String(n === 0));
        if (n === 0) {
          hero.alt = t.getAttribute('data-alt');
          hero.src = (img && img.currentSrc) || t.getAttribute('data-src');
        }
      });
      hero.loading = 'eager';
      return hero;
    };
    // Swap in the full-size first picture once it has loaded
    var sharpen = function (i) {
      var first = pages[i].querySelector('.case-thumbs button');
      var big = new Image();
      big.src = first.getAttribute('data-src');
      if (!big.decode) return;
      big.decode().then(function () {
        if (first.getAttribute('aria-pressed') === 'true' && !closing) heroOf(i).src = big.src;
      }).catch(function () {});
    };

    var finishClose = function () {
      stopAnimations();
      closing = false;
      if (caseBox.open) caseBox.close();
      land();
      root.classList.remove('case-open');
    };

    var animateOpen = function (from) {
      var hero = heroOf(current);
      var pic = from && cardPic(current);
      if (!pic) { caseBox.animate({ opacity: [0, 1] }, { duration: 300, easing: 'ease-out' }); return; }
      var to = hero.getBoundingClientRect();
      hideCard(pic);
      var bg = getComputedStyle(caseBox).backgroundColor;
      caseBox.animate({ backgroundColor: ['rgba(8, 23, 30, 0)', bg] }, { duration: 420, easing: 'ease-out' });
      after(hero.animate([{ transform: flip(from, to) }, { transform: 'none' }], { duration: 700, easing: FLY }), 1200, land);
      fadeParts().forEach(function (part, n) {
        part.animate(
          [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 480, delay: 260 + Math.min(n, 8) * 35, easing: EASE, fill: 'backwards' });
      });
    };

    var animateClose = function () {
      closing = true;
      var i = current;
      var hero = heroOf(i);
      var now = hero.getBoundingClientRect(); // may still be mid-flight
      var pic = cardPic(i);
      var r = null;
      if (pic) {
        var card = pic.closest('.project');
        card.style.transition = 'none';
        card.classList.add('is-visible');
        r = pic.getBoundingClientRect();
        // After Next/Previous the card can be off screen: bring it back first
        if (r.width && !onScreen(r)) {
          card.scrollIntoView({ block: 'center', behavior: 'instant' });
          r = pic.getBoundingClientRect();
        }
        card.style.transition = '';
      }
      if (!canAnimate) { finishClose(); return; }
      stopAnimations();
      if (!r || !onScreen(r) || !onScreen(now)) {
        after(caseBox.animate({ opacity: [1, 0] }, { duration: 220, easing: 'ease-in', fill: 'forwards' }), 600, finishClose);
        return;
      }
      hideCard(pic);
      resetGallery(i);
      var base = hero.getBoundingClientRect();
      var bg = getComputedStyle(caseBox).backgroundColor;
      fadeParts().forEach(function (part) {
        part.animate({ opacity: [1, 0] }, { duration: 180, easing: 'ease-in', fill: 'forwards' });
      });
      caseBox.animate({ backgroundColor: [bg, 'rgba(8, 23, 30, 0)'] }, { duration: 400, delay: 80, easing: 'ease-in-out', fill: 'both' });
      after(hero.animate([{ transform: flip(now, base) }, { transform: flip(r, base) }], { duration: 560, easing: FLY, fill: 'forwards' }), 1000, finishClose);
    };

    // `from`: where the pressed card's picture was, if a card was pressed
    var syncCase = function (from) {
      var at = caseIds.indexOf(location.hash.indexOf('#work/') === 0 ? location.hash.slice(6) : '');
      if (at === -1) {
        pushed = false;
        if (caseBox.open && !closing) animateClose();
        return;
      }
      if (closing) finishClose();
      var wasOpen = caseBox.open;
      var changed = at !== current;
      if (!wasOpen || changed) { resetGallery(at); sharpen(at); }
      current = at;
      pages.forEach(function (p, i) { p.hidden = i !== at; });
      caseBox.setAttribute('aria-labelledby', titleOf(at).id);
      caseCount.textContent = (at + 1) + ' / ' + pages.length;
      nextName.textContent = titleOf((at + 1) % pages.length).textContent;
      lockPage();
      if (!wasOpen) caseBox.showModal();
      if (!wasOpen || changed) {
        titleOf(at).focus({ preventScroll: true });
        caseBox.scrollTop = 0;
      }
      if (!wasOpen && canAnimate) animateOpen(from);
    };
    var closeCase = function () {
      if (closing) return;
      if (pushed) { history.back(); return; }
      history.replaceState(null, '', '#work');
      syncCase();
    };

    document.querySelectorAll('[data-case]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (opening) return;
        var id = btn.getAttribute('data-case');
        var i = caseIds.indexOf(id);
        var gone = false;
        var go = function () {
          if (gone) return;
          gone = true;
          opening = false;
          var pic = cardPic(i);
          var r = canAnimate && pic ? pic.getBoundingClientRect() : null;
          history.pushState(null, '', '#work/' + id);
          pushed = true;
          syncCase(r && onScreen(r) ? r : null);
        };
        opening = true;
        if (!canAnimate) { go(); return; }
        // Have the picture ready to paint so the flight never starts blank
        if (closing) finishClose();
        var hero = resetGallery(i);
        if (hero.decode) hero.decode().then(go, go);
        setTimeout(go, 150);
      });
    });
    caseBox.querySelector('[data-case-close]').addEventListener('click', closeCase);
    caseBox.addEventListener('cancel', function (e) { e.preventDefault(); closeCase(); });
    // Some browsers close on a second Esc without asking: tidy up
    caseBox.addEventListener('close', function () {
      if (caseBox.open) return;
      finishClose();
      if (location.hash.indexOf('#work/') === 0) closeCase();
    });

    var stepping = false;
    var showStep = function (to) {
      history.replaceState(null, '', '#work/' + caseIds[to]);
      syncCase();
    };
    caseBox.querySelectorAll('[data-case-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (closing || stepping) return;
        var by = Number(btn.getAttribute('data-case-step'));
        var to = (current + by + pages.length) % pages.length;
        if (!canAnimate) { showStep(to); return; }
        stopAnimations();
        land();
        stepping = true;
        var out = pages[current].animate(
          { opacity: [1, 0], transform: ['none', 'translateX(' + (-28 * by) + 'px)'] },
          { duration: 160, easing: 'ease-in', fill: 'forwards' });
        out.finished.catch(function () { stepping = false; });
        after(out, 500, function () {
          stepping = false;
          if (closing || !caseBox.open) return;
          stopAnimations();
          showStep(to);
          pages[to].animate(
            { opacity: [0, 1], transform: ['translateX(' + (28 * by) + 'px)', 'none'] },
            { duration: 420, easing: EASE });
        });
      });
    });
    pages.forEach(function (page) {
      var big = page.querySelector('.case-hero');
      var thumbs = Array.prototype.slice.call(page.querySelectorAll('.case-thumbs button'));
      thumbs.forEach(function (t) {
        t.addEventListener('click', function () {
          if (closing) return;
          thumbs.forEach(function (o) { o.setAttribute('aria-pressed', String(o === t)); });
          big.src = t.getAttribute('data-src');
          big.alt = t.getAttribute('data-alt');
          if (canAnimate) big.animate({ opacity: [0.3, 1] }, { duration: 350, easing: 'ease-out' });
        });
      });
    });
    window.addEventListener('popstate', function () { syncCase(); });
    syncCase();
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
  if (word && !reduceMotion && word.animate) {
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
    var OUT = { opacity: 0, transform: 'translateY(-0.35em)' };
    var IN = { opacity: 0, transform: 'translateY(0.35em)' };
    var REST = { opacity: 1, transform: 'none' };
    var nextGreeting = function () {
      if (document.hidden) return;
      gi = (gi + 1) % greetings.length;
      var leave = word.animate([REST, OUT], { duration: 350, easing: 'ease-out', fill: 'forwards' });
      setTimeout(function () {
        word.textContent = greetings[gi].text;
        word.setAttribute('lang', greetings[gi].lang);
        word.setAttribute('dir', greetings[gi].lang === 'ar' ? 'rtl' : 'ltr');
        word.animate([IN, REST], { duration: 450, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        leave.cancel();
      }, 350);
    };
    // The first "Hello" stays until the page has settled
    setTimeout(function () { nextGreeting(); setInterval(nextGreeting, 2000); }, 4000);
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

  // Contact form: checks the fields, then sends the message to Danil's
  // inbox through FormSubmit (no server of our own). Falls back to a
  // ready-made email if the service can't be reached.
  var form = document.getElementById('request-form');
  if (form) {
    var TO = 'abramitov.danya@gmail.com';
    var ENDPOINT = 'https://formsubmit.co/ajax/' + TO;
    var statusEl = document.getElementById('form-status');
    var doneEl = document.getElementById('form-done');
    var kindField = document.getElementById('kind-field');
    var reachField = document.getElementById('reach-field');
    var sendBtn = form.querySelector('.send-btn');
    var sendLabel = form.querySelector('.send-label');
    var sending = false;
    var HINTS = {
      Project: 'Your idea, who it is for, and any deadline.',
      Question: 'What would you like to ask or tell me?'
    };

    var chosen = function (name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    };
    // "Start a project" shows one more question; the other choice hides it
    var showTopic = function () {
      var topic = chosen('topic');
      kindField.hidden = topic !== 'Project';
      form.elements.details.placeholder = HINTS[topic] || HINTS.Project;
    };
    form.addEventListener('change', function (e) {
      if (e.target.name === 'topic') showTopic();
    });
    // "Start a project" links choose that answer for the visitor
    document.querySelectorAll('[data-topic]').forEach(function (link) {
      link.addEventListener('click', function () {
        var radio = form.querySelector('input[name="topic"][value="' + link.getAttribute('data-topic') + '"]');
        if (!radio) return;
        radio.checked = true;
        radio.dispatchEvent(new Event('input', { bubbles: true }));
        showTopic();
      });
    });

    var setSending = function (on) {
      sending = on;
      form.classList.toggle('is-sending', on);
      form.setAttribute('aria-busy', on ? 'true' : 'false');
      if (sendBtn) sendBtn.disabled = on;
      if (sendLabel) sendLabel.textContent = on ? 'Sending…' : 'Send message';
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

    var showDone = function (name, reach) {
      document.getElementById('done-name').textContent = name;
      document.getElementById('done-reach').textContent = reach;
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
        else { fieldEl.removeAttribute('aria-invalid'); fieldEl.removeAttribute('aria-describedby'); }
      }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var phone = form.elements.phone.value.trim();
      var details = form.elements.details.value.trim();
      var topic = chosen('topic');
      var kind = topic === 'Project' ? chosen('kind') : '';

      var firstBad = null;
      var check = function (ok, id, el, msg) {
        setError(id, el, ok ? '' : msg);
        if (!ok && !firstBad) firstBad = el;
      };
      check(!!topic, 'f-topic-error', form.querySelector('input[name="topic"]'), 'Please choose one.');
      check(topic !== 'Project' || !!kind, 'f-kind-error', form.querySelector('input[name="kind"]'), 'Please choose one. “Not sure yet” is fine too.');
      check(name.length > 0, 'f-name-error', form.elements.name, 'Please enter your name.');
      // One way to reply is enough, but what is filled in has to be complete
      var none = !email && !phone;
      check(!none && (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)), 'f-email-error', form.elements.email,
        none ? 'Please leave an email or a phone number so I can reply.' : 'That email looks incomplete. Please check it.');
      check(!phone || phone.replace(/\D/g, '').length >= 7, 'f-phone-error', form.elements.phone,
        'That number looks too short. Please check it.');
      check(details.length > 0, 'f-details-error', form.elements.details, 'Please write a few words so I know how to help.');

      if (firstBad) {
        showStatus('Please fix the highlighted fields.', 'error');
        firstBad.focus();
        return;
      }
      if (sending) return;

      // Bots fill the hidden field: act as if it worked, send nothing
      if (form.elements._honey && form.elements._honey.value) { showDone(name, email || phone); return; }

      var about = topic === 'Project' ? 'Project: ' + kind : 'Question';
      var subject = (topic === 'Project' ? 'New project request (' + kind + ')' : 'New message') + ' from ' + name;
      var payload = {
        name: name,
        about: about,
        message: details,
        _subject: subject,
        _template: 'table',
        _captcha: 'false'
      };
      if (email) payload.email = email; // FormSubmit uses it as the reply address
      if (phone) payload.phone = phone;

      // Ready-made email as a backup if the service can't be reached
      var mailBody = [
        'Name: ' + name, email ? 'Email: ' + email : null, phone ? 'Phone: ' + phone : null,
        'About: ' + about, '', details
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
        .then(function () { showDone(name, email || phone); })
        .catch(function () {
          if (navigator.onLine === false) {
            showStatus('You seem to be offline. Check your connection and press Send message again.', 'error');
          } else {
            showStatus('Sorry, your message didn’t go through. Please try again, or ', 'error', mailHref);
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
        showTopic();
        doneEl.hidden = true;
        form.hidden = false;
        showStatus('', '');
        form.querySelector('input[name="topic"]').focus();
      });
    }

    // Clear an error as soon as the visitor fixes the field
    form.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      // Email and phone share one question, so filling either clears both
      var wraps = reachField.contains(t)
        ? Array.prototype.slice.call(reachField.querySelectorAll('.field'))
        : [t.closest('.field')];
      wraps.forEach(function (wrap) {
        if (!wrap || !wrap.classList.contains('has-error')) return;
        var err = wrap.querySelector('.field-error');
        if (err) err.textContent = '';
        wrap.classList.remove('has-error');
        wrap.querySelectorAll('[aria-invalid]').forEach(function (el) {
          el.removeAttribute('aria-invalid');
          el.removeAttribute('aria-describedby');
        });
      });
      if (!form.querySelector('.has-error') && statusEl.classList.contains('is-error')) showStatus('', '');
    });
  }

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
