// My Moonshots: an easter egg. Tap the lightbulb on the hero portrait (or type "moon") and five hackathon builds
// orbit my head. Hover a file to slow the orbit, tap it to open it. Nothing here loads until the egg is opened.
// Three breadcrumbs lead to it: the bulb flickers once per visit, it shows a clue on hover, and the browser console
// has a note for anyone who looks. Section 3's See Them Orbit link opens it too.
(() => {
  'use strict';
  const BASE = 'moonshots/';
  // Each file links to its film on YouTube. Tags name the brand it was built for.
  const FILES = [
    { id: 'pawzoo', name: 'Pawzoo', tag: 'For Amazon · PayPal · NVIDIA', kind: 'Pet-care agent',
      line: 'Watches your dog’s day on your home cameras, speaks up first, and pays for refills with PayPal only after you approve the exact total.',
      films: [['Watch Demo', 'https://youtu.be/TU6OOYvhF2o']] },
    { id: 'apprentice', name: 'Apprentice', tag: 'For NVIDIA', kind: 'Model trainer',
      line: 'Teaches a small open model one job, proves it learned on examples it never saw, and ships it only if it wins: 74% to 87% on a $1 budget.',
      films: [['Watch Demo', 'https://youtu.be/PvEZV1q-UCQ']] },
    { id: 'airlock', name: 'Airlock', tag: 'For NVIDIA', kind: 'Private assistant',
      line: 'Seals every secret on your device before anything reaches the cloud, with a receipt of exactly what left. 1,083 of 1,170 planted secrets held against a red team.',
      films: [['Watch Demo', 'https://youtu.be/cZM7GBF7MQY']] },
    { id: 'windtunnel', name: 'Wind Tunnel', tag: 'For NVIDIA', kind: 'Robot test track',
      line: 'A test track for robot policies, with no robot. The model proposes fixes and the simulator keeps only what helps: pass rate from 36.5% to 73.5%.',
      films: [['Watch Demo', 'https://youtu.be/N_AFv_H6oro']] },
    { id: 'consumed', name: 'Consumed', tag: 'For Meta', kind: 'Social app',
      line: 'Spotify Wrapped, but every day, for everything you listen to, read and eat. Each item comes back hand-painted, and your day cracks open as one card for your story.',
      films: [['Watch Demo', 'https://youtu.be/xpzTUJv_nhA']] },
  ];
  const TURN = 28; // seconds per revolution: slow enough to read each file as it passes
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html) d.innerHTML = html; return d; };
  const badge = document.querySelector('.portrait-badge');
  if (!badge) return;
  badge.classList.add('ms-trigger');
  badge.removeAttribute('aria-hidden');
  badge.setAttribute('role', 'button');
  badge.setAttribute('tabindex', '0');
  badge.setAttribute('aria-label', 'Open My Moonshots');

  // Breadcrumb 2: the clue.
  const tip = el('span', 'ms-tip', '<i></i>One bright idea, or maybe 5?');
  tip.id = 'ms-tip';
  tip.setAttribute('role', 'tooltip');
  badge.setAttribute('aria-describedby', 'ms-tip');
  badge.parentElement?.appendChild(tip);

  // Breadcrumb 1: one flicker, four seconds in, once per visit.
  let seen = false;
  try { seen = sessionStorage.getItem('ms-flicker') === '1'; sessionStorage.setItem('ms-flicker', '1'); } catch { /* no storage: flicker anyway */ }
  if (!seen && !reduced.matches) setTimeout(() => badge.classList.add('ms-flick'), 4000);

  // Breadcrumb 3: a note in the console.
  console.log('%cYou found the console. Now find the moon.', 'font: 700 22px "Barlow Condensed", "Arial Narrow", sans-serif; text-transform: uppercase; color: #111; background: #ff7600; padding: 8px 12px');
  console.log('Type "moon" on the page, or tap the bulb.');

  let root, stage, head, cards, tiles, dust, ringBack, ringFront, file, raf = 0, last = 0, angle = 0, speed = 0, hovering = null, openFile = null, geo, returnFocus = null;
  const NS = 'http://www.w3.org/2000/svg';

  function build() {
    root = el('div', 'ms');
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'ms-heading');
    root.innerHTML = `<div class="ms-title"><p>Easter egg · 05 files</p><h2 id="ms-heading">MY <span>MOONSHOTS.</span></h2></div>
      <button class="ms-close" type="button" aria-label="Close My Moonshots">×</button>
      <div class="ms-stage"></div>
      <p class="ms-hint">${matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0 ? 'Tap a file to open it' : 'Click a file to open it · Esc to close'}</p>
      <aside class="ms-file" hidden aria-live="polite"><button class="ms-back" type="button" aria-label="Close this file">×</button><img alt=""><div class="ms-file-body"><p class="ms-kicker"></p><h3></h3><p class="ms-line"></p><div class="ms-links"></div></div></aside>`;
    document.body.appendChild(root);
    stage = root.querySelector('.ms-stage');
    file = root.querySelector('.ms-file');

    tiles = Array.from({ length: 14 }, () => stage.appendChild(el('div', 'ms-el ms-tile')));
    dust = Array.from({ length: 36 }, () => stage.appendChild(el('div', 'ms-el ms-dust')));
    const svg = (z) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'ms-ring'); s.style.zIndex = z; const p = document.createElementNS(NS, 'path'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#fff8f1'); p.setAttribute('stroke-linecap', 'round'); s.appendChild(p); stage.appendChild(s); return p; };
    ringBack = svg(3); ringFront = svg(60);
    ringBack.setAttribute('stroke-opacity', '.35'); ringFront.setAttribute('stroke-opacity', '.55');

    head = stage.appendChild(el('div', 'ms-el ms-head', `<img src="${BASE}head.webp" alt="BW Simiyu" width="440" height="615">`));
    head.style.zIndex = 50;
    cards = FILES.map((f, i) => {
      const b = el('button', 'ms-el ms-card', `<img src="${BASE}${f.id}.webp" alt="" loading="eager"><span class="ms-chip"><i></i>${f.tag}</span>`);
      b.type = 'button';
      b.setAttribute('aria-label', `${f.name}: open file`);
      b.addEventListener('mouseenter', () => { hovering = i; });
      b.addEventListener('mouseleave', () => { if (hovering === i) hovering = null; });
      b.addEventListener('focus', () => { hovering = i; });
      b.addEventListener('blur', () => { if (hovering === i) hovering = null; });
      b.addEventListener('click', () => show(i));
      stage.appendChild(b);
      return b;
    });

    root.querySelector('.ms-close').addEventListener('click', close);
    file.querySelector('.ms-back').addEventListener('click', hideFile);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); if (openFile !== null) hideFile(); else close(); }
      if (e.key === 'Tab') { // keep focus inside the egg
        const f = [...root.querySelectorAll('button, a')].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    addEventListener('resize', () => { if (!root.hidden) measure(); });
  }

  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  function measure() {
    const W = innerWidth, H = innerHeight, narrow = W < 700;
    // On a phone the cards are smaller, the head sits lower, and the back of the ring rides clear above the head, so
    // the face is never buried under a pile of cards.
    const headH = narrow ? Math.min(H * 0.4, W * 0.8) : Math.min(H * 0.6, W * 0.5);
    const headW = headH * 440 / 615;
    const cardW = narrow ? Math.min(W * 0.33, 160) : Math.max(180, Math.min(W * 0.21, 400));
    const cardH = cardW * 9 / 16;
    const cx = W / 2, headTop = narrow ? H * 0.64 - headH * 0.45 : H * 0.55 - headH * 0.45;
    const RX = narrow ? W * 0.29 : Math.min(W * 0.36, 760);
    geo = { W, H, cx, headH, headW, headTop, cardW, cardH, eyeY: headTop + headH * (narrow ? 0.5 : 0.47),
      backY: narrow ? headTop - cardH * 0.75 : headTop - 10, RX, RZ: RX * (narrow ? 0.95 : 0.68), F: Math.max(W, 900) * 0.95, turn: narrow ? 24 : 36 };
    head.style.width = `${String(headW)}px`;
    cards.forEach((c) => { c.style.width = `${String(geo.cardW)}px`; c.style.height = `${String(geo.cardH)}px`; });
    const u = Math.min(W / 1920, H / 1080);
    dust.forEach((d, i) => { const s = (2 + rnd(i, 1) * 4) * Math.max(u, 0.6); d.style.width = d.style.height = `${String(s)}px`; });
    ringBack.setAttribute('stroke-width', String(2)); ringFront.setAttribute('stroke-width', String(2));
    ringBack.setAttribute('stroke-dasharray', '2 10'); ringFront.setAttribute('stroke-dasharray', '2 10');
  }

  function project(th) {
    const { cx, RX, RZ, F, eyeY, backY } = geo;
    const x = Math.sin(th) * RX, z = Math.cos(th) * RZ, s = F / (F - z);
    const c = Math.cos(th);
    return { x: cx + x * s, y: backY + (eyeY - backY) * (c + 1) / 2, z, s };
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const target = reduced.matches || openFile !== null ? 0 : hovering !== null ? 0.08 : (Math.PI * 2) / TURN;
    speed += (target - speed) * Math.min(1, dt * 4);
    angle += speed * dt;
    draw(now / 1000);
    raf = requestAnimationFrame(frame);
  }

  function draw(t) {
    const { W, H, cx, headW, headTop, cardW, cardH } = geo;
    const bob = reduced.matches ? 0 : Math.sin(t * 0.6) * 8;
    head.style.transform = `translate(${String(cx - headW / 2)}px, ${String(headTop + bob)}px)`;
    tiles.forEach((d, i) => {
      const a = -(i / tiles.length) * Math.PI * 2 - angle * 0.15, z = Math.cos(a);
      const w = (150 + (i % 2) * 50) * Math.max(Math.min(W / 1920, H / 1080), 0.5), h = w * 0.62;
      d.style.width = `${String(w)}px`; d.style.height = `${String(h)}px`;
      d.style.transform = `translate(${String(cx + Math.sin(a) * W * 0.62 - w / 2)}px, ${String(H * 0.3 - z * 60 + (i % 2) * 70 - h / 2)}px)`;
      d.style.opacity = String(0.3 + 0.5 * (1 - (z + 1) / 2));
    });
    dust.forEach((d, i) => {
      const y = ((rnd(i, 2) - t * (0.02 + rnd(i, 5) * 0.03)) % 1 + 1) % 1;
      d.style.transform = `translate(${String(rnd(i, 3) * W + Math.sin(t + i) * 12)}px, ${String(y * (H + 40) - 20)}px)`;
      d.style.opacity = String((0.25 + rnd(i, 4) * 0.55) * Math.sin(y * Math.PI));
    });
    const arc = (a, b) => Array.from({ length: 81 }, (_, k) => { const p = project(a + (b - a) * k / 80); return `${k ? 'L' : 'M'}${String(p.x)},${String(p.y + cardH * 0.62 * p.s + bob * 0.3)}`; }).join(' ');
    ringFront.setAttribute('d', arc(-Math.PI / 2, Math.PI / 2));
    ringBack.setAttribute('d', arc(Math.PI / 2, Math.PI * 1.5));
    cards.forEach((c, i) => {
      const th = angle + (i / cards.length) * Math.PI * 2, p = project(th), depth = (p.z / geo.RZ + 1) / 2;
      const lift = hovering === i ? 1.08 : 1;
      c.style.transform = `translate(${String(p.x - cardW / 2)}px, ${String(p.y - cardH / 2 + bob * 0.3)}px) scale(${String(p.s * (0.82 + 0.18 * depth) * lift)}) perspective(1400px) rotateY(${String(Math.sin(th) * -geo.turn)}deg) rotateX(${String((1 - depth) * 10)}deg)`;
      c.style.zIndex = String(p.z >= 0 ? 100 + Math.round(p.z) : 10 + Math.round(p.z / 10 + 50));
      c.style.filter = `brightness(${String(0.82 + 0.18 * depth)}) blur(${String((1 - depth) * 1.2)}px)`;
    });
  }

  function show(i) {
    const f = FILES[i];
    openFile = i;
    root.classList.add('has-file');
    cards.forEach((c, k) => c.classList.toggle('is-open', k === i));
    file.querySelector('img').src = `${BASE}${f.id}.webp`;
    file.querySelector('.ms-kicker').textContent = `File 0${String(i + 1)} · ${f.kind} · ${f.tag}`;
    file.querySelector('h3').textContent = f.name;
    file.querySelector('.ms-line').textContent = f.line;
    file.querySelector('.ms-links').innerHTML = f.films.length
      ? f.films.map(([label, href], k) => `<a class="${k ? 'ghost' : ''}" href="${href}" target="_blank" rel="noopener">${label} <span aria-hidden="true">▶</span></a>`).join('')
      : '<span class="ms-soon">Film coming soon</span>';
    file.hidden = false;
    file.animate([{ opacity: 0, transform: `${innerWidth < 700 ? 'translateY(40px)' : 'translate(30px, -50%)'}` }, { opacity: 1, transform: innerWidth < 700 ? 'none' : 'translateY(-50%)' }], { duration: reduced.matches ? 1 : 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    (file.querySelector('.ms-links a') ?? file.querySelector('.ms-back')).focus();
  }

  function hideFile() {
    if (openFile === null) return;
    const i = openFile;
    openFile = null;
    root.classList.remove('has-file');
    cards.forEach((c) => c.classList.remove('is-open'));
    file.hidden = true;
    cards[i].focus();
  }

  // The egg opens out of whatever opened it (the bulb, or Section 3's link), or the middle of the screen when that
  // is out of view, and shrinks back into it.
  let origin = badge;
  function centerOf(el) {
    const r = el.getBoundingClientRect();
    const seen = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    return seen ? [r.left + r.width / 2, r.top + r.height / 2] : [innerWidth / 2, innerHeight / 2];
  }

  function open(from) {
    if (!root) build();
    if (!root.hidden) return;
    origin = from instanceof HTMLElement ? from : badge;
    returnFocus = document.activeElement;
    measure();
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    const [x, y] = centerOf(origin);
    if (!reduced.matches) root.animate([{ clipPath: `circle(0px at ${String(x)}px ${String(y)}px)` }, { clipPath: `circle(150vmax at ${String(x)}px ${String(y)}px)` }], { duration: 750, easing: 'cubic-bezier(.6,0,.2,1)' });
    speed = (Math.PI * 2) / TURN * 3; // a little spin-up as it opens
    last = 0;
    raf = requestAnimationFrame(frame);
    root.querySelector('.ms-close').focus();
  }

  function close() {
    if (!root || root.hidden) return;
    hideFile();
    const [x, y] = centerOf(origin);
    const done = () => { root.hidden = true; cancelAnimationFrame(raf); document.documentElement.style.overflow = ''; (returnFocus instanceof HTMLElement ? returnFocus : origin).focus({ preventScroll: true }); };
    if (reduced.matches) { done(); return; }
    root.animate([{ clipPath: `circle(150vmax at ${String(x)}px ${String(y)}px)` }, { clipPath: `circle(0px at ${String(x)}px ${String(y)}px)` }], { duration: 550, easing: 'cubic-bezier(.6,0,.2,1)' }).finished.then(done, done);
  }

  badge.addEventListener('click', () => open());
  document.querySelectorAll('[data-moonshots-open]').forEach((b) => b.addEventListener('click', () => open(b)));
  badge.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  // Typing "moon" anywhere opens it too.
  let typed = '';
  addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === 'moon') open();
  });
  if (location.hash === '#moonshots') addEventListener('load', open);
})();
