(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sliding pill: moves an indicator behind the target element (platform nav standard)
  function movePill(indicator, el) {
    if (!indicator || !el) return;
    indicator.style.setProperty('--x', el.offsetLeft + 'px');
    indicator.style.setProperty('--y', el.offsetTop + 'px');
    indicator.style.setProperty('--w', el.offsetWidth + 'px');
    indicator.style.setProperty('--h', el.offsetHeight + 'px');
  }

  // Header: transparent at top, glass on scroll
  var header = document.querySelector('.header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Main navigation pill
  var navList = document.querySelector('.nav__links');
  var navPill = navList.querySelector('.nav__indicator');
  var navLinks = Array.prototype.slice.call(navList.querySelectorAll('a'));
  var activeLink = navList.querySelector('a.is-active') || navLinks[0];
  var setTarget = function (link) {
    navLinks.forEach(function (a) { a.classList.toggle('is-target', a === link); });
    movePill(navPill, link);
  };
  navLinks.forEach(function (a) {
    a.addEventListener('mouseenter', function () { setTarget(a); });
    a.addEventListener('focus', function () { setTarget(a); });
  });
  navList.addEventListener('mouseleave', function () { setTarget(activeLink); });
  navList.addEventListener('focusout', function (e) {
    if (!navList.contains(e.relatedTarget)) setTarget(activeLink);
  });

  // Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  var closeNav = function () {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) requestAnimationFrame(function () { movePill(navPill, activeLink); });
  });
  navLinks.forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  // Hero dashboard preview tabs (same sliding pill, auto-rotate until the user interacts)
  var tabWrap = document.querySelector('.preview__tabs');
  var tabPill = tabWrap.querySelector('.preview__indicator');
  var tabs = Array.prototype.slice.call(tabWrap.querySelectorAll('button'));
  var panels = document.querySelectorAll('.preview__panel');
  var current = 0;
  var showTab = function (i) {
    current = i;
    tabs.forEach(function (t, k) {
      t.classList.toggle('is-active', k === i);
      t.setAttribute('aria-selected', String(k === i));
    });
    panels.forEach(function (p) {
      var active = p.dataset.panel === tabs[i].dataset.tab;
      p.classList.toggle('is-active', active);
      p.hidden = !active;
    });
    movePill(tabPill, tabs[i]);
  };
  var timer = reduceMotion ? null : setInterval(function () { showTab((current + 1) % tabs.length); }, 5000);
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      clearInterval(timer);
      showTab(i);
    });
  });

  // Position pills once layout and fonts are ready, and on resize
  var placePills = function () {
    movePill(navPill, navList.querySelector('a.is-target') || activeLink);
    movePill(tabPill, tabs[current]);
  };
  placePills();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePills);
  window.addEventListener('resize', placePills);

  // Section transition: reveal-up with stagger (platform standard)
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  revealEls.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute('data-reveal'); });
    el.style.setProperty('--d', (siblings.indexOf(el) * 90) + 'ms');
  });
  var finish = function (el) {
    var delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
    setTimeout(function () {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-visible');
      el.style.removeProperty('--d');
    }, delay + 850);
  };
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.removeAttribute('data-reveal'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
        finish(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // FAQ: keep one item open at a time
  var items = document.querySelectorAll('.accordion__item');
  items.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      items.forEach(function (other) { if (other !== item) other.open = false; });
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
