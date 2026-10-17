// MYWARE motion layer: scroll reveal, progress bar, parallax, spotlight, KPI count-up.
(function () {
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = document.createElement('div'); bar.id = 'progress'; document.body.appendChild(bar);
  var hdr = document.querySelector('header');
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(scrollY / max, 1) : 0) + ')';
    if (hdr) hdr.classList.toggle('scrolled', scrollY > 20);
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  if (RM) return;

  var SEL = '.v2-sec > h2,.v2-sec > p,.svc button,.band,.steps4 > div,.cta-end > *,.card,.kpi,.spec-card,.trust-badge-item,.req-form-card,.page-hero,.authx,.contact-info-card,.empty,.wrap,.dash-head,.path';

  function countKpi(el) {
    if (!el.classList.contains('kpi')) return;
    var s = el.querySelector('.stat'); if (!s) return;
    var m = s.textContent.match(/^([^\d]*)([\d,]+)(.*)$/); if (!m) return;
    var to = parseInt(m[2].replace(/,/g, ''), 10), t0 = performance.now();
    if (!to) return;
    (function step(t) {
      var k = Math.min((t - t0) / 900, 1), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
      s.textContent = m[1] + v.toLocaleString('en-IN') + m[3];
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); countKpi(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function scan() {
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.dataset.fx) return;
      el.dataset.fx = '1';
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(SEL); });
      el.style.setProperty('--d', Math.min(sibs.indexOf(el), 8) * 70 + 'ms');
      el.classList.add('rv'); io.observe(el);
    });
    setTimeout(function () {
      document.querySelectorAll('.rv:not(.in)').forEach(function (el) {
        if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in');
      });
    }, 2500);
  }

  var app = document.getElementById('app'), pending = false;
  if (app) new MutationObserver(function () {
    if (pending) return; pending = true;
    requestAnimationFrame(function () { pending = false; scan(); onScroll(); });
  }).observe(app, { childList: true, subtree: true });
  scan();

  document.addEventListener('mousemove', function (e) {
    var hero = document.querySelector('.v2-hero');
    if (hero) {
      var r = hero.getBoundingClientRect();
      if (e.clientY < r.bottom) {
        hero.style.setProperty('--hx', (e.clientX - r.left) + 'px');
        hero.style.setProperty('--hy', (e.clientY - r.top) + 'px');
        hero.style.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
        hero.style.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
      }
    }
    var c = e.target.closest && e.target.closest('.svc button');
    if (c) {
      var b = c.getBoundingClientRect();
      c.style.setProperty('--x', (e.clientX - b.left) + 'px');
      c.style.setProperty('--y', (e.clientY - b.top) + 'px');
    }
  }, { passive: true });
})();
