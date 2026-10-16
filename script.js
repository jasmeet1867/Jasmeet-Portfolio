(() => {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('jasmeet-motion'); } catch (_) { /* Storage is optional on local files. */ }
  let userPaused = savedMotion === 'paused';
  let isPaused = reduceMotion.matches || userPaused;
  const motionButton = document.querySelector('.motion-toggle');
  const canvas = document.getElementById('portal-canvas');
  const portal = document.querySelector('.portal-visual');
  const hero = document.querySelector('.hero');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  let tunnel = null;
  let revealObserver = null;
  let scrollScheduled = false;

  function updateMotion() {
    isPaused = reduceMotion.matches || userPaused;
    root.classList.toggle('motion-paused', isPaused);
    if (motionButton) {
      const label = isPaused ? 'Play animations' : 'Pause animations';
      motionButton.setAttribute('aria-pressed', String(isPaused));
      motionButton.setAttribute('aria-label', label);
      motionButton.title = reduceMotion.matches ? 'Reduced motion is enabled in your device settings' : label;
      motionButton.querySelector('.motion-symbol').textContent = isPaused ? '▷' : 'Ⅱ';
      motionButton.querySelector('.motion-label').textContent = label;
      motionButton.disabled = reduceMotion.matches;
    }
    if (isPaused) {
      root.classList.remove('motion-ready');
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      if (portal) { portal.style.removeProperty('--portal-y'); portal.style.removeProperty('--portal-scale'); }
      document.querySelectorAll('[data-tilt]').forEach(el => { el.style.transform = ''; });
    }
    if (tunnel) tunnel.setPaused(isPaused);
    onScroll();
  }
  if (motionButton) motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('jasmeet-motion', userPaused ? 'paused' : 'playing'); } catch (_) { /* Nonessential preference. */ }
    updateMotion();
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', updateMotion);

  function closeNav(restoreFocus = false) {
    if (!nav || !navToggle) return;
    const wasOpen = nav.classList.contains('is-open');
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
    if (restoreFocus && wasOpen) navToggle.focus();
  }
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeNav()));
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(true); });
    // A closed mobile menu is hidden from keyboard navigation by visibility:hidden.
    window.matchMedia('(max-width: 720px)').addEventListener('change', () => closeNav());
  }

  function initReveals() {
    if (isPaused || !('IntersectionObserver' in window)) return;
    const elements = document.querySelectorAll('.reveal');
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -12px 0px' });
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('is-visible');
      else revealObserver.observe(el);
    });
    root.classList.add('motion-ready');
  }

  function onScroll() {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    root.style.setProperty('--progress', max ? Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4) : '0');
    if (portal && hero && !isPaused && window.innerWidth > 720) {
      const rect = hero.getBoundingClientRect();
      const offset = Math.min(hero.offsetHeight, Math.max(0, -rect.top));
      portal.style.setProperty('--portal-y', `${(offset * 0.16).toFixed(1)}px`);
      portal.style.setProperty('--portal-scale', String(1 + offset / 2500));
    } else if (portal) {
      portal.style.removeProperty('--portal-y');
      portal.style.removeProperty('--portal-scale');
    }
    scrollScheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  window.addEventListener('resize', () => { onScroll(); if (tunnel) tunnel.resize(); }, { passive: true });

  document.querySelectorAll('[data-tilt]').forEach(card => {
    let rect;
    let tiltFrame = 0;
    card.addEventListener('pointerenter', () => { rect = card.getBoundingClientRect(); });
    card.addEventListener('pointermove', e => {
      if (isPaused || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      const x = e.clientX, y = e.clientY;
      tiltFrame = requestAnimationFrame(() => {
        rect = rect || card.getBoundingClientRect();
        const rx = ((y - rect.top) / rect.height - .5) * -3;
        const ry = ((x - rect.left) / rect.width - .5) * 3;
        card.style.transform = `perspective(1600px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        tiltFrame = 0;
      });
    });
    card.addEventListener('pointerleave', () => {
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      card.style.transform = '';
      tiltFrame = 0;
    });
  });

  // Native view transitions when available; a short shutter works on local file pages too.
  let navigating = false;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download') || isPaused) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    let url;
    try { url = new URL(link.href); } catch (_) { return; }
    if (url.origin !== location.origin || !/\.html$/.test(url.pathname) || url.protocol !== location.protocol) return;
    if (url.pathname === location.pathname && url.hash) return;
    if (location.protocol !== 'file:' && 'onpagereveal' in window) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 360);
  });
  window.addEventListener('pageshow', () => { navigating = false; document.body.classList.remove('is-leaving'); });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  function createTunnel(target) {
    let ctx;
    try { ctx = target.getContext('2d', { alpha: true }); } catch (_) { return null; }
    if (!ctx) return null;
    let width = 0, height = 0, dpr = 1, frame = 0, last = 0, time = 0;
    let paused = isPaused, visible = true;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const particles = Array.from({ length: coarse ? 60 : 105 }, (_, i) => {
      // Deterministic points keep the composition steady between pages and refreshes.
      const rand = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
      return { a: rand(i + 2) * Math.PI * 2, r: 230 + rand(i + 9) * 560, z: rand(i + 17) * 1800, s: .4 + rand(i + 25) * .9 };
    });
    function resize() {
      const r = target.getBoundingClientRect();
      width = Math.max(1, r.width); height = Math.max(1, r.height); dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      target.width = Math.round(width * dpr); target.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
    function project(x, y, z) {
      const p = 580 / z;
      const unit = Math.min(width / 950, height / 900);
      return [width * .53 + x * p * unit, height * .49 + y * p * unit];
    }
    function ringPoint(angle, z, twist) {
      const radius = 253;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * .93;
      const px = x * Math.cos(twist) - y * Math.sin(twist);
      const py = x * Math.sin(twist) + y * Math.cos(twist);
      return project(px, py, z + Math.sin(angle) * 35 + Math.cos(angle) * 28);
    }
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const travel = time * 49;
      const rings = Array.from({ length: 17 }, (_, i) => 145 + ((i * 112 - travel) % 1904 + 1904) % 1904).sort((a, b) => b - a);
      // Fine radial guides add depth without competing with the headline.
      for (let s = 0; s < 10; s++) {
        const angle = s / 10 * Math.PI * 2 + .12;
        ctx.beginPath();
        const far = ringPoint(angle, 2060, .1);
        const near = ringPoint(angle, 140, -.1);
        ctx.moveTo(...far); ctx.lineTo(...near);
        ctx.strokeStyle = 'rgba(110,153,232,.045)'; ctx.lineWidth = .6; ctx.stroke();
      }
      rings.forEach(z => {
        const fade = Math.min(1, (z - 145) / 200) * Math.min(1, (2050 - z) / 500);
        const twist = Math.sin(z / 950 + time * .07) * .12 - .26;
        const alpha = (0.07 + (1 - z / 2200) * .28) * fade;
        const gradient = ctx.createLinearGradient(width * .25, height * .2, width * .8, height * .8);
        gradient.addColorStop(0, `rgba(118,157,255,${alpha * .45})`);
        gradient.addColorStop(.45, `rgba(111,158,255,${alpha})`);
        gradient.addColorStop(.75, `rgba(160,240,214,${alpha * .8})`);
        gradient.addColorStop(1, `rgba(78,118,223,${alpha * .2})`);
        ctx.beginPath();
        for (let n = 0; n <= 100; n++) {
          const a = n / 100 * Math.PI * 2;
          const point = ringPoint(a, z, twist);
          if (!n) ctx.moveTo(...point); else ctx.lineTo(...point);
        }
        ctx.closePath(); ctx.strokeStyle = gradient; ctx.lineWidth = z < 500 ? 1.2 : .8; ctx.stroke();
        // A short moving highlight makes each frame read as a ring rather than a flat grid.
        const start = -.9 + time * .08 + z / 1500;
        ctx.beginPath();
        for (let n = 0; n <= 22; n++) {
          const a = start + n / 22 * .27;
          const point = ringPoint(a, z, twist);
          if (!n) ctx.moveTo(...point); else ctx.lineTo(...point);
        }
        ctx.strokeStyle = `rgba(169,211,249,${alpha * 1.4})`; ctx.lineWidth = 1.3; ctx.stroke();
      });
      particles.forEach(p => {
        const z = 130 + ((p.z - travel * .7) % 1900 + 1900) % 1900;
        const x = Math.cos(p.a) * p.r, y = Math.sin(p.a) * p.r * .8;
        const [sx, sy] = project(x, y, z);
        if (sx < 0 || sx > width || sy < 0 || sy > height) return;
        const alpha = Math.min(.6, (1 - z / 2200) * .6);
        ctx.fillStyle = `rgba(157,188,227,${alpha})`;
        ctx.beginPath(); ctx.arc(sx, sy, Math.min(1.6, p.s * 400 / z), 0, Math.PI * 2); ctx.fill();
      });
    }
    function tick(now) {
      frame = 0;
      if (paused || !visible || document.hidden) { last = 0; return; }
      const delta = last ? Math.min((now - last) / 1000, .05) : 0;
      time += delta; last = now;
      draw(); frame = requestAnimationFrame(tick);
    }
    function resume() {
      if (!frame && !paused && visible && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); }
    }
    function setPaused(value) {
      paused = value;
      if (paused && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
      draw(); resume();
    }
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
        resume();
      }, { threshold: 0 });
      observer.observe(target);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
      resume();
    });
    resize(); resume();
    return { setPaused, resize };
  }

  updateMotion();
  initReveals();
  if (canvas) tunnel = createTunnel(canvas);
})();
