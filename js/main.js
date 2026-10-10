(function () {
  // Header shadow on scroll
  var header = document.querySelector('.header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('.nav__links a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Login dropdown (Principal / Teacher / Student)
  var loginMenu = document.querySelector('.login-menu');
  var loginBtn = loginMenu.querySelector('.login-menu__btn');
  loginBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = loginMenu.classList.toggle('is-open');
    loginBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) {
    if (!loginMenu.contains(e.target)) {
      loginMenu.classList.remove('is-open');
      loginBtn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      loginMenu.classList.remove('is-open');
      loginBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Hero dashboard preview tabs (auto-rotate until the user interacts)
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.preview__tabs button'));
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
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timer = reduceMotion ? null : setInterval(function () { showTab((current + 1) % tabs.length); }, 5000);
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      clearInterval(timer);
      showTab(i);
    });
  });

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
