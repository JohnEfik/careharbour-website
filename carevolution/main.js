(function () {
  document.documentElement.classList.add('js');

  // Header shadow on scroll
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 10); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  var setNav = function (open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  };
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  // Service cards act as tabs for the detail panel
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.svc-card[role="tab"]'));
  var select = function (tab, scroll) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (scroll && window.matchMedia('(max-width: 960px)').matches) {
      document.getElementById('service-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, true); });
    tab.addEventListener('keydown', function (e) {
      var dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      select(next, false);
      next.focus();
    });
  });

  // Pre-select inquiry type from CTAs like "Share your story"
  document.querySelectorAll('[data-inquiry]').forEach(function (el) {
    el.addEventListener('click', function () {
      var sel = document.getElementById('f-inquiry');
      if (sel) sel.value = el.getAttribute('data-inquiry');
    });
  });

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
