(function () {
  var hero = DMCHero.init({ stage: document.getElementById('top'), canvas: document.getElementById('dmc-canvas'), video: document.getElementById('dmc-video') });

  // layout mode flip (desktop ↔ mobile) changes the copy block height the hero lays out around
  var mq = matchMedia('(max-width:859px)');
  mq.addEventListener('change', function () { setMenu(false); hero.refresh(); });

  // "Desliza" glides to the end of the pinned hero (full logo + copy); any user scroll input cancels it
  var glide = null;
  function stopGlide() { if (glide) { glide.kill(); glide = null; document.documentElement.style.scrollBehavior = ''; } }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { addEventListener(ev, stopGlide, { passive: true }); });
  document.getElementById('dmc-hint').addEventListener('click', function () {
    // stop where the animation finishes, before the pinned hold that follows it
    var C = DMCHero.CONFIG, stage = document.getElementById('top');
    var end = stage.offsetTop + (stage.offsetHeight - innerHeight) * C.scrollLength / (C.scrollLength + C.hold);
    var pos = { y: scrollY };
    stopGlide();
    document.documentElement.style.scrollBehavior = 'auto'; // CSS smooth scroll would fight the per-frame scrollTo
    glide = gsap.to(pos, { y: end, duration: 3.8, ease: 'power2.inOut', onUpdate: function () { scrollTo(0, pos.y); }, onComplete: stopGlide });
  });

  var menu = document.getElementById('menu'), btn = document.getElementById('menu-btn');
  function setMenu(open) { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); }
  btn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });

  // ponytail: no backend yet — form only swaps to the thank-you state, wire to an endpoint when one exists
  var form = document.getElementById('cita-form'), sent = document.getElementById('cita-sent');
  form.addEventListener('submit', function (e) { e.preventDefault(); form.reset(); form.hidden = true; sent.hidden = false; });
  document.getElementById('cita-reset').addEventListener('click', function () { sent.hidden = true; form.hidden = false; });

  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.transition = 'opacity .9s ease, transform .9s cubic-bezier(.2,.7,.2,1)';
      el.style.opacity = '0'; el.style.transform = 'translateY(18px)';
      io.observe(el);
    });
  }
})();
