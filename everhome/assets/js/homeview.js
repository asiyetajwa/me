// Everhome home view: the scanned home as a rendered model, today and after the fixes.
// mountHouse(container, { mode, labels, focusZoom }) returns { setMode, focus, destroy }.
// Same interface the earlier three.js view had, so the app, landing page and film are unchanged.
const BASE = new URL('../img/', import.meta.url).href;

// Where each hazard sits in each render, in % of the image
export const HAZARDS = [
  { id: 'tub', room: 'Bathroom', today: [33, 39], after: [36, 33], risk: 'Tub rim 17 in, no grab bars', fix: 'Walk-in shower, grab bars at 34 in', sev: 'must', below: true },
  { id: 'stairs', room: 'Stairs', today: [10, 52], after: [26, 48], risk: 'Handrail on one side only', fix: 'Handrails on both sides', sev: 'must', below: true },
  { id: 'rug', room: 'Living room', today: [64, 56], after: [63, 51], risk: 'Thick rug with a raised edge', fix: 'Flat, low-pile rug', sev: 'must' },
  { id: 'night', room: 'Bedroom to bathroom', today: [47, 29], after: [53, 25], risk: 'Dark path at night', fix: 'Motion path lights', sev: 'soon', below: false },
  { id: 'ottoman', room: 'Walkway', today: [50.5, 60], after: [50, 63], risk: 'Low ottoman in the walkway', fix: 'Walkway clear', sev: 'soon', below: true },
];
const PLATES = { today: { src: 'home-today.jpg', ar: 1536 / 1024 }, after: { src: 'home-after.jpg', ar: 1672 / 941 } };

export function mountHouse(container, opts = {}) {
  const o = { mode: 'today', labels: true, focusZoom: 1.9, ...opts };
  container.classList.add('hv');
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  const plates = {};
  for (const [m, p] of Object.entries(PLATES)) {
    const el = document.createElement('div');
    el.className = 'hv-plate'; el.dataset.mode = m;
    el.style.setProperty('--ar', String(p.ar));
    el.innerHTML = `<img src="${BASE}${p.src}" alt="${m === 'today' ? 'Rendered model of the home today, with a tub, a single stair rail and a thick rug' : 'The same home after the fixes, with a walk-in shower and rails on both sides of the stairs'}" draggable="false">`;
    for (const h of HAZARDS) {
      const [x, y] = h[m];
      const mk = document.createElement('div');
      mk.className = `hv-mk${h.below ? ' below' : ''}`; mk.dataset.id = h.id; mk.dataset.state = m === 'after' ? 'fixed' : h.sev;
      mk.style.left = `${x}%`; mk.style.top = `${y}%`;
      mk.innerHTML = `<i></i>${o.labels ? `<span class="hv-lb"><b>${m === 'after' ? '&#10003; ' : ''}${h.room}</b>${m === 'after' ? h.fix : h.risk}</span>` : ''}`;
      el.appendChild(mk);
    }
    container.appendChild(el);
    plates[m] = el;
  }
  let mode = o.mode, focusId = null;
  const apply = () => {
    for (const [m, el] of Object.entries(plates)) {
      el.classList.toggle('on', m === mode);
      const h = focusId && HAZARDS.find((x) => x.id === focusId);
      if (h) { const [x, y] = h[m]; el.style.setProperty('--z', String(o.focusZoom)); el.style.setProperty('--dx', `${(50 - x).toFixed(2)}%`); el.style.setProperty('--dy', `${(50 - y).toFixed(2)}%`); }
      else { el.style.setProperty('--z', '1'); el.style.setProperty('--dx', '0%'); el.style.setProperty('--dy', '0%'); }
      el.querySelectorAll('.hv-mk').forEach((mk) => mk.classList.toggle('dim', !!focusId && mk.dataset.id !== focusId));
    }
  };
  apply();
  return {
    setMode(m) { mode = m; apply(); },
    focus(id) { focusId = id; apply(); },
    destroy() { container.innerHTML = ''; },
  };
}

const css = `.hv{overflow:hidden;container-type:size}
.hv-plate{position:absolute;left:50%;top:50%;width:min(100cqw,100cqh * var(--ar));aspect-ratio:var(--ar);transform:translate(-50%,-50%) scale(var(--z,1)) translate(var(--dx,0%),var(--dy,0%));transition:transform 1.3s cubic-bezier(.65,0,.35,1),opacity .9s ease;opacity:0;--z:1}
.hv-plate.on{opacity:1}
.hv-plate img{width:100%;height:100%;display:block;user-select:none;-webkit-user-select:none;animation:hvDrift 18s ease-in-out infinite alternate}
@keyframes hvDrift{from{transform:scale(1)}to{transform:scale(1.03)}}
.hv-mk{position:absolute;width:0;height:0;transition:opacity .5s}
.hv-mk.dim{opacity:.3}
.hv-mk i{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:#ff4d6a;box-shadow:0 0 0 3px rgba(255,255,255,.9),0 4px 12px rgba(0,0,0,.35);transform:scale(calc(1 / var(--z,1)))}
.hv-mk i::after{content:'';position:absolute;inset:-3px;border-radius:50%;border:3px solid #ff4d6a;animation:hvPulse 1.8s ease-out infinite}
.hv-mk[data-state=soon] i,.hv-mk[data-state=soon] i::after{background:#ffa24d;border-color:#ffa24d}
.hv-mk[data-state=soon] i::after{background:transparent}
.hv-mk[data-state=fixed] i{background:#37c88a}.hv-mk[data-state=fixed] i::after{border-color:#37c88a;animation:none;opacity:.6}
@keyframes hvPulse{from{transform:scale(1);opacity:.9}to{transform:scale(2.6);opacity:0}}
.hv-lb{position:absolute;left:0;bottom:16px;transform:translateX(-50%) scale(calc(1 / var(--z,1)));transform-origin:50% 100%;padding:7px 12px 8px;border-radius:14px;background:rgba(30,26,46,.82);color:#f4f1fa;font:600 14px/1.25 'Atkinson',system-ui,sans-serif;white-space:nowrap;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,77,106,.7);box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.hv-mk.below .hv-lb{bottom:auto;top:16px;transform-origin:50% 0}
.hv-lb b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.hv-mk[data-state=soon] .hv-lb{border-color:rgba(255,162,77,.8)}
.hv-mk[data-state=fixed] .hv-lb{background:rgba(22,70,52,.86);border-color:rgba(55,200,138,.7)}
@media (prefers-reduced-motion:reduce){.hv-plate img,.hv-mk i::after{animation:none}}`;
if (!document.getElementById('hv-css')) { const s = document.createElement('style'); s.id = 'hv-css'; s.textContent = css; document.head.appendChild(s); }
