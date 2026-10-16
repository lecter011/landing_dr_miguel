/* Hero scroll animation — Dr. Miguel Carrizoza
   Scroll-scrubbed video (molar → particles → tooth icon), crossfaded into a canvas copy of the
   icon at the same spot, which then moves into the horizontal lockup while the wordmark reveals. */
(function () {
  'use strict';

  const CONFIG = {
    // all-keyframe (ffmpeg -g 1) for smooth reverse scrubbing; vignette + brightness baked in (see CLAUDE.md)
    video: 'assets/hero.mp4',              // 1920×1080
    videoMobile: 'assets/hero-720.mp4',    // 1280×720 for phones/tablets — 1080p seeks stall mobile decoders
    images: {
      icon: 'assets/logo-icon.png',        // 1200×1200, transparent (same artwork as 4.png)
      lockup: 'assets/logo-horizontal.png' // 1200×1200, transparent (same artwork as 1.png)
    },
    // Icon bounding box inside the video's last frame (1920×1080 source pixels) [x0, y0, x1, y1]
    videoSize: [1920, 1080],
    videoIcon: [686, 249, 1227, 817],
    mobileBreakpoint: 768,
    scrollLength: 3.2, // viewport heights of pinned scroll that drive the animation
    hold: 0.6,         // extra viewport heights the finished logo stays pinned before the page scrolls on
    headerClear: 84,   // px kept free at the top for the fixed header (72px) so it never covers the logo
    scrub: 0.5,
    maxDPR: 2,
    stages: {
      videoEnd: 0.62, fadeStart: 0.62, fadeEnd: 0.69, // video holds its last frame while it fades
      settle: 0.72, iconMoveEnd: 0.84, revealStart: 0.81, revealEnd: 0.93,
      copyStart: 0.89, header: 0.96
    },
    // Source-pixel boxes inside the 1200×1200 logo files [x0, y0, x1, y1]
    boxes: {
      icon: [254, 235, 946, 984],
      lockup: [91, 464, 1119, 778],
      lockupIcon: [91, 464, 382, 778],
      line1: [266, 568, 1119, 629],  // DR. MIGUEL CARRIZOZA
      line2: [423, 644, 1119, 774]   // tagline + smile curve
    }
  };

  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const range = (p, a, b) => smooth((p - a) / (b - a));
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  function init(opts) {
    const stage = opts.stage, canvas = opts.canvas, video = opts.video, ctx = canvas.getContext('2d');
    const $ = id => document.getElementById(id);
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const S = CONFIG.stages, B = CONFIG.boxes, VI = CONFIG.videoIcon;
    let imgs = null, W = 0, H = 0, dpr = 1, L = null, progress = reduced ? 1 : 0;
    let visible = true, destroyed = false, lastW = 0, lastH = 0, lastTime = -1, pendingTime = -1, canvasBlank = false;
    const mask = document.createElement('canvas'), mctx = mask.getContext('2d');

    stage.style.height = reduced ? '100vh' : (CONFIG.scrollLength + CONFIG.hold + 1) * 100 + 'vh';

    // ponytail: whole file fetched as a blob so every frame is seekable; fine at ~3MB, use a streamed source if the video grows
    const small = window.innerWidth < CONFIG.mobileBreakpoint || window.matchMedia('(pointer: coarse)').matches;
    fetch(small ? CONFIG.videoMobile : CONFIG.video).then(r => r.blob()).then(b => { if (!destroyed) { video.src = URL.createObjectURL(b); video.load(); } })
      .catch(err => console.error('[DMCHero] video load failed', err));
    video.addEventListener('loadedmetadata', () => { lastTime = -1; render(progress); });
    // one seek in flight at a time; stacking seeks makes mobile decoders restart and fall behind
    video.addEventListener('seeked', () => { if (pendingTime >= 0) { video.currentTime = pendingTime; pendingTime = -1; } });

    function layout() {
      const mobile = W < CONFIG.mobileBreakpoint;
      const iconAsp = (B.icon[2] - B.icon[0]) / (B.icon[3] - B.icon[1]);
      const hh = Math.min(H * (mobile ? 0.44 : 0.58), (W * 0.8) / iconAsp, 620);
      const cx = W / 2, cy = H * 0.5;
      // scale the video so its icon is exactly hh tall and centred, then the canvas icon takes over in place
      const vs = hh / (VI[3] - VI[1]);
      const vcx = (VI[0] + VI[2]) / 2, vcy = (VI[1] + VI[3]) / 2;
      const vid = { x: cx - vcx * vs, y: cy - vcy * vs, w: CONFIG.videoSize[0] * vs, h: CONFIG.videoSize[1] * vs };
      const icon = { x: cx - hh * iconAsp / 2, y: cy - hh / 2, w: hh * iconAsp, h: hh };
      const copyEl = $('dmc-copy'), copyH = copyEl ? copyEl.offsetHeight : 160;
      const iw = B.lockupIcon[2] - B.lockupIcon[0], ih = B.lockupIcon[3] - B.lockupIcon[1];
      let s, target, linesX, linesY, copyTop;
      if (!mobile) {
        const lw = B.lockup[2] - B.lockup[0], lh = B.lockup[3] - B.lockup[1];
        s = Math.min(W * 0.62, 760) / lw;
        const gap = 48, top = Math.max(H * 0.1, CONFIG.headerClear, (H - (lh * s + gap + copyH)) / 2);
        const left = cx - lw * s / 2;
        target = { x: left, y: top, w: iw * s, h: ih * s };
        // lines keep their native offsets relative to the lockup origin
        linesX = left - B.lockup[0] * s; linesY = top - B.lockup[1] * s;
        copyTop = top + lh * s + gap;
      } else {
        const blockW = B.line1[2] - B.line1[0], linesH = B.line2[3] - B.line1[1];
        s = Math.min((H * 0.15) / ih, (W * 0.84) / blockW);
        const g1 = 22, g2 = 34, total = ih * s + g1 + linesH * s + g2 + copyH;
        const top = Math.max(H * 0.07, CONFIG.headerClear, (H - total) / 2);
        target = { x: cx - iw * s / 2, y: top, w: iw * s, h: ih * s };
        linesX = cx - blockW * s / 2 - B.line1[0] * s;
        linesY = top + ih * s + g1 - B.line1[1] * s;
        copyTop = top + ih * s + g1 + linesH * s + g2;
      }
      return { mobile, vid, icon, target, s, linesX, linesY, copyTop };
    }

    function resize(force) {
      const w = window.innerWidth, h = window.innerHeight;
      if (!force && w === lastW && Math.abs(h - lastH) < 120) return false;
      lastW = w; lastH = h;
      dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDPR);
      const r = canvas.getBoundingClientRect();
      W = r.width || w; H = r.height || h;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      mask.width = canvas.width; mask.height = canvas.height;
      canvasBlank = false;
      if (imgs) {
        L = layout();
        Object.assign(video.style, { left: L.vid.x + 'px', top: L.vid.y + 'px', width: L.vid.w + 'px', height: L.vid.h + 'px' });
        render(progress);
      }
      return true;
    }

    function drawSrc(c, img, box, x, y, w, h) {
      c.drawImage(img, box[0], box[1], box[2] - box[0], box[3] - box[1], x, y, w, h);
    }
    function drawLines(c) {
      for (const b of [B.line1, B.line2]) {
        drawSrc(c, imgs.lockup, b, L.linesX + b[0] * L.s, L.linesY + b[1] * L.s, (b[2] - b[0]) * L.s, (b[3] - b[1]) * L.s);
      }
    }

    function render(p) {
      if (!imgs || !L) return;

      // 1 — scrub the video, then fade it out over the canvas icon
      const dur = video.duration;
      if (dur && !reduced) {
        const t = Math.min(dur - 0.001, dur * clamp01(p / S.videoEnd));
        if (Math.abs(t - lastTime) > 0.001) { lastTime = t; if (video.seeking) pendingTime = t; else video.currentTime = t; }
      }
      const vA = 1 - range(p, S.fadeStart, S.fadeEnd);
      video.style.opacity = String(reduced ? 0 : vA);
      video.style.visibility = vA > 0.002 && !reduced ? 'visible' : 'hidden';

      // 2 — crisp icon, then move into the lockup and reveal the wordmark
      // icon sits solid under the fading video (its last frame matches), so only the grey backdrop fades
      const iconA = reduced || p >= S.fadeStart ? 1 : 0;
      // while only the video shows, the canvas stays plain white — skip repainting it every frame
      if (iconA === 0 && canvasBlank) { ui(p); return; }
      canvasBlank = iconA === 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
      const revealT = clamp01((p - S.revealStart) / (S.revealEnd - S.revealStart));
      if (iconA > 0.002) {
        if (revealT >= 1 && !L.mobile) {
          const lw = B.lockup[2] - B.lockup[0], lh = B.lockup[3] - B.lockup[1];
          drawSrc(ctx, imgs.lockup, B.lockup, L.target.x, L.target.y, lw * L.s, lh * L.s);
        } else {
          const mv = easeIO(clamp01((p - S.settle) / (S.iconMoveEnd - S.settle)));
          const a = L.icon, b = L.target;
          ctx.globalAlpha = iconA;
          drawSrc(ctx, imgs.icon, B.icon, lerp(a.x, b.x, mv), lerp(a.y, b.y, mv), lerp(a.w, b.w, mv), lerp(a.h, b.h, mv));
          ctx.globalAlpha = 1;
          if (revealT >= 1) drawLines(ctx);
          else if (revealT > 0) {
            mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mask.width, mask.height);
            mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            mctx.globalCompositeOperation = 'source-over';
            drawLines(mctx);
            const x0 = L.linesX + B.line1[0] * L.s, x1 = L.linesX + B.line1[2] * L.s, f = 80;
            const sx = x0 + (x1 - x0 + f) * revealT;
            const gr = mctx.createLinearGradient(sx - f, 0, sx, 0);
            gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
            mctx.globalCompositeOperation = 'destination-in';
            mctx.fillStyle = gr; mctx.fillRect(0, 0, W, H);
            mctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(mask, 0, 0, W, H);
          }
        }
      }
      ui(p);
    }

    const hint = $('dmc-hint'), copy = $('dmc-copy'), header = $('dmc-header'), fab = $('dmc-fab');
    function ui(p) {
      if (hint) { hint.style.opacity = String(1 - range(p, 0, 0.025)); hint.style.visibility = p < 0.025 ? 'visible' : 'hidden'; }
      if (copy) {
        const a = range(p, S.copyStart, 1);
        copy.style.top = L.copyTop + 'px';
        copy.style.opacity = String(a);
        copy.style.transform = 'translateY(' + ((1 - a) * 14).toFixed(1) + 'px)';
        copy.style.pointerEvents = a > 0.6 ? 'auto' : 'none';
        copy.style.visibility = a > 0.01 ? 'visible' : 'hidden';
      }
      // stage is the first section, so off-screen means scrolled past it; no layout read (it forced a reflow every frame)
      const show = p >= S.header || !visible;
      if (header) header.style.transform = show ? 'translateY(0)' : 'translateY(-100%)';
      if (fab) { fab.style.opacity = show ? '1' : '0'; fab.style.transform = show ? 'translateY(0)' : 'translateY(12px)'; fab.style.pointerEvents = show ? 'auto' : 'none'; }
    }

    // Scroll hint line
    const line = $('dmc-hint-line');
    let hintAnim = null;
    if (line && line.animate && !reduced) {
      hintAnim = line.animate([{ transform: 'scaleY(0)', transformOrigin: 'top' }, { transform: 'scaleY(1)', transformOrigin: 'top', offset: 0.5 }, { transform: 'scaleY(1)', transformOrigin: 'bottom', offset: 0.51 }, { transform: 'scaleY(0)', transformOrigin: 'bottom' }], { duration: 2000, iterations: Infinity, easing: 'ease-in-out' });
    }

    let st = null, tween = null, io = null;
    // mobile address-bar show/hide fires resize; resize() ignores it, so only refresh on real changes
    const onResize = () => { if (resize(false) && window.ScrollTrigger) window.ScrollTrigger.refresh(); };
    let fallbackScroll = null;

    Promise.all([loadImg(CONFIG.images.icon), loadImg(CONFIG.images.lockup)]).then(([icon, lockup]) => {
      if (destroyed) return;
      imgs = { icon, lockup };
      resize(true);
      window.addEventListener('resize', onResize);
      if (reduced) { render(1); return; }
      const state = { p: 0 }, animScale = (CONFIG.scrollLength + CONFIG.hold) / CONFIG.scrollLength;
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        tween = window.gsap.to(state, {
          p: 1, ease: 'none',
          scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom bottom', scrub: CONFIG.scrub },
          onUpdate: () => { progress = clamp01(state.p * animScale); if (visible) render(progress); }
        });
        st = tween.scrollTrigger;
      } else {
        fallbackScroll = () => {
          const r = stage.getBoundingClientRect(), total = r.height - window.innerHeight;
          progress = clamp01(-r.top / Math.max(1, total) * animScale); if (visible) render(progress);
        };
        window.addEventListener('scroll', fallbackScroll, { passive: true });
        fallbackScroll();
      }
      io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) render(progress); else ui(progress); });
      io.observe(stage);
      render(progress);
    }).catch(err => console.error('[DMCHero] image load failed', err));

    return {
      refresh() { if (imgs) { resize(true); } },
      destroy() {
        destroyed = true;
        if (tween) tween.kill(); if (st) st.kill(); if (io) io.disconnect(); if (hintAnim) hintAnim.cancel();
        window.removeEventListener('resize', onResize);
        if (fallbackScroll) window.removeEventListener('scroll', fallbackScroll);
      }
    };
  }

  window.DMCHero = { CONFIG, init };
})();
