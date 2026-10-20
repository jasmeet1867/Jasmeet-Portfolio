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


  // Scroll spy: mark the nav link for the section in view and slide the dot under it.
  const navLinks = nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  const navDot = document.querySelector('.nav-dot');
  const spySections = navLinks
    .map(a => ({ link: a, target: a.getAttribute('href') === '#top' ? null : document.querySelector(a.getAttribute('href')) }))
    .filter(s => s.target || s.link.getAttribute('href') === '#top');
  let activeLink = null;
  function placeDot() {
    if (!navDot || !activeLink) return;
    const x = activeLink.offsetLeft + activeLink.offsetWidth / 2 - navDot.offsetWidth / 2;
    navDot.style.setProperty('--dot-x', `${x}px`);
    navDot.style.bottom = `${nav.offsetHeight / 2 - activeLink.offsetHeight / 2 - 10}px`;
    navDot.classList.add('is-ready');
  }
  function updateSpy() {
    if (!spySections.length) return;
    const line = window.innerHeight * 0.35;
    let current = spySections[0];
    spySections.forEach(s => { if (s.target && s.target.getBoundingClientRect().top <= line) current = s; });
    // At the very bottom the last section is always the active one.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = spySections[spySections.length - 1];
    if (current.link === activeLink) return;
    activeLink = current.link;
    navLinks.forEach(a => a.removeAttribute('aria-current'));
    activeLink.setAttribute('aria-current', 'true');
    placeDot();
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
    updateSpy();
    scrollScheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  window.addEventListener('resize', () => { onScroll(); placeDot(); if (tunnel) tunnel.resize(); }, { passive: true });

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

  // Live network map of the real stack: Software, Systems and People hubs with packets moving between tools.
  function createTunnel(target) {
    let ctx;
    try { ctx = target.getContext('2d', { alpha: true }); } catch (_) { return null; }
    if (!ctx) return null;
    const COLORS = { software: [65, 105, 198], systems: [8, 127, 101], people: [196, 128, 44] };
    const HUBS = [
      { id: 'software', label: 'Software', x: .24, y: .4 },
      { id: 'systems', label: 'Systems', x: .72, y: .3 },
      { id: 'people', label: 'People', x: .5, y: .8 },
    ];
    const SATS = {
      software: [['Python', -.15, -.16], ['C#', .03, -.2], ['React', -.2, .03], ['TypeScript', -.13, .2], ['ASP.NET Core', .09, .19], ['SQL', .17, -.06], ['Git', -.04, -.33]],
      systems: [['Windows', .17, .1], ['Intune', .06, .22], ['Entra ID', -.12, -.15], ['Active Directory', .03, -.24], ['Linux', -.16, .1], ['Networking', .2, -.1], ['Microsoft 365', .21, .28]],
      people: [['Scrum', -.18, .03], ['Help desk', .17, .02], ['Documentation', -.05, .15], ['English / French', .12, .14]],
    };
    const CROSS = [['SQL', 'Linux'], ['Git', 'Entra ID'], ['Microsoft 365', 'Help desk'], ['Networking', 'Windows'],
      ['Scrum', 'TypeScript'], ['Documentation', 'ASP.NET Core'], ['Intune', 'Windows'], ['Linux', 'Help desk']];
    const nodes = [], byLabel = {}, edges = [], packets = [];
    HUBS.forEach(h => {
      const hub = { label: h.label, hub: true, group: h.id, hx: h.x, hy: h.y, ph: h.x * 5 };
      nodes.push(hub); byLabel[h.label] = hub;
      SATS[h.id].forEach(([label, dx, dy], i) => {
        const n = { label, group: h.id, hub: false, hx: h.x + dx, hy: h.y + dy, ph: i * 1.7 + h.x * 3, left: dx < -.02 };
        nodes.push(n); byLabel[label] = n;
        edges.push([hub, n]);
      });
    });
    edges.push([byLabel.Software, byLabel.Systems], [byLabel.Systems, byLabel.People], [byLabel.People, byLabel.Software]);
    CROSS.forEach(([a, b]) => edges.push([byLabel[a], byLabel[b]]));
    nodes.forEach(n => { n.nb = new Set(); });
    edges.forEach(([a, b]) => { a.nb.add(b); b.nb.add(a); });

    let W = 0, H = 0, dpr = 1, frame = 0, last = 0, time = 0, small = false;
    let paused = isPaused, visible = true, hover = null;
    let pointer = { x: -1e4, y: -1e4, on: false };
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    function resize() {
      const r = target.getBoundingClientRect();
      W = Math.max(1, target.offsetWidth || r.width); H = Math.max(1, target.offsetHeight || r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      target.width = Math.round(W * dpr); target.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      small = window.innerWidth <= 720;
      // The canvas runs partly under the headline and off the right edge, so the map sits in its visible middle.
      const region = small ? { x: W * .16, y: H * .16, w: W * .66, h: H * .68 } : { x: W * .38, y: H * .2, w: W * .4, h: H * .6 };
      nodes.forEach(n => {
        n.tx = region.x + n.hx * region.w; n.ty = region.y + n.hy * region.h;
        if (n.x == null) { n.x = n.tx; n.y = n.ty; n.vx = 0; n.vy = 0; }
      });
      if (!frame) { settle(); draw(); }
    }
    function settle() { for (let i = 0; i < 90; i++) step(1 / 60, true); }

    function step(dt, quiet) {
      nodes.forEach(n => {
        const still = paused || quiet;
        const dx0 = still ? 0 : Math.sin(time * .5 + n.ph) * (n.hub ? 2 : 5);
        const dy0 = still ? 0 : Math.cos(time * .4 + n.ph * 1.3) * (n.hub ? 2 : 5);
        let fx = (n.tx + dx0 - n.x) * 18, fy = (n.ty + dy0 - n.y) * 18;
        if (pointer.on && !small && !paused) {
          const dx = n.x - pointer.x, dy = n.y - pointer.y, d2 = dx * dx + dy * dy, R = 150;
          if (d2 < R * R && d2 > 1) { const d = Math.sqrt(d2), k = (1 - d / R) * 900; fx += dx / d * k; fy += dy / d * k; }
        }
        n.vx = (n.vx + fx * dt) * Math.pow(.02, dt);
        n.vy = (n.vy + fy * dt) * Math.pow(.02, dt);
        n.x += n.vx * dt; n.y += n.vy * dt;
      });
      if (paused || quiet) return;
      if (Math.random() < dt * (small ? 4 : 7)) {
        const e = edges[(Math.random() * edges.length) | 0], flip = Math.random() < .5;
        packets.push({ a: flip ? e[1] : e[0], b: flip ? e[0] : e[1], t: 0, speed: .5 + Math.random() * .6 });
      }
      for (let i = packets.length - 1; i >= 0; i--) { packets[i].t += dt * packets[i].speed; if (packets[i].t >= 1) packets.splice(i, 1); }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const lit = hover ? new Set([hover, ...hover.nb]) : null;
      edges.forEach(([a, b]) => {
        const on = lit && (a === hover || b === hover);
        const hubEdge = a.hub && b.hub;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = on ? rgba(COLORS[hover.group], .8) : `rgba(35,67,55,${lit ? .05 : hubEdge ? .26 : .14})`;
        ctx.lineWidth = on ? 1.6 : hubEdge ? 1.2 : 1; ctx.stroke();
      });
      packets.forEach(p => {
        const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        const tt = Math.max(0, p.t - .2), tx = p.a.x + (p.b.x - p.a.x) * tt, ty = p.a.y + (p.b.y - p.a.y) * tt;
        const c = COLORS[p.a.group], fade = Math.sin(p.t * Math.PI);
        const g = ctx.createLinearGradient(tx, ty, x, y);
        g.addColorStop(0, rgba(c, 0)); g.addColorStop(1, rgba(c, fade));
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.strokeStyle = g; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = rgba(c, fade); ctx.fill();
      });
      nodes.forEach(n => {
        const c = COLORS[n.group], dim = lit && !lit.has(n), isHover = n === hover;
        if (n.hub) {
          const r = small ? 7 : 9;
          const pulse = paused ? 0 : (Math.sin(time * 1.6 + n.hx * 9) + 1) * 4;
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 10 + pulse, 0, Math.PI * 2); ctx.fillStyle = rgba(c, dim ? .03 : .12); ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fillStyle = rgba(c, dim ? .3 : 1); ctx.fill();
          ctx.font = `700 ${small ? 10 : 11}px "Courier New", monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = dim ? 'rgba(23,35,31,.3)' : '#17231f';
          ctx.fillText(n.label.toUpperCase(), n.x, n.y - r - (small ? 10 : 14));
        } else {
          const r = isHover ? 5 : 3.4;
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fillStyle = rgba(c, dim ? .25 : isHover ? 1 : .85); ctx.fill();
          if (isHover) { ctx.beginPath(); ctx.arc(n.x, n.y, 11, 0, Math.PI * 2); ctx.strokeStyle = rgba(c, .5); ctx.lineWidth = 1; ctx.stroke(); }
          ctx.font = `${isHover ? 700 : 400} ${small ? 11 : 13}px Arial, Helvetica, sans-serif`;
          ctx.textAlign = n.left ? 'right' : 'left';
          ctx.fillStyle = dim ? 'rgba(82,100,93,.3)' : lit ? '#17231f' : '#52645d';
          // On phones, tool names appear when their part of the map is tapped.
          if (!small || (lit && !dim)) ctx.fillText(n.label, n.x + (n.left ? -9 : 9), n.y + 4);
        }
      });
    }

    function tick(now) {
      frame = 0;
      if (paused || !visible || document.hidden) { last = 0; return; }
      const dt = last ? Math.min((now - last) / 1000, .05) : .016;
      time += dt; last = now;
      step(dt); draw(); frame = requestAnimationFrame(tick);
    }
    function resume() { if (!frame && !paused && visible && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); } }
    function setPaused(value) {
      paused = value;
      if (paused && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
      if (paused) { settle(); }
      draw(); resume();
    }
    // The canvas sits behind the hero text, so pointer input is read from the whole hero.
    const area = target.closest('.hero') || target;
    const locate = e => {
      const r = target.getBoundingClientRect();
      const sx = W / r.width, sy = H / r.height; // undo the scroll parallax scale
      pointer = { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy, on: e.pointerType === 'mouse' };
      let best = null, bd = 28 * 28;
      nodes.forEach(n => { const d = (n.x - pointer.x) ** 2 + (n.y - pointer.y) ** 2; if (d < bd) { bd = d; best = n; } });
      if (best !== hover) { hover = best; if (!frame) draw(); }
    };
    area.addEventListener('pointermove', locate);
    area.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && !e.target.closest('a, button')) locate(e); });
    area.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { pointer.on = false; hover = null; if (!frame) draw(); } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
        resume();
      }, { threshold: 0 }).observe(target);
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
  if (document.fonts) document.fonts.ready.then(placeDot);
  if (canvas) tunnel = createTunnel(canvas);
})();
