import { icon, mark, $, $$ } from './ui.js';

/* ---------- theme (shared preference with the app) ---------- */
const getTheme = () => { try { return localStorage.getItem('prism-theme') ?? 'dusk'; } catch { return 'dusk'; } };
function paintTheme() {
  const t = getTheme();
  document.documentElement.dataset.theme = t;
  $('#theme').innerHTML = icon(t === 'dusk' ? 'sun' : 'moon');
  $('#theme').setAttribute('aria-label', t === 'dusk' ? 'Switch to daylight' : 'Switch to dusk');
  paintTextures();
}
$('#theme').onclick = () => {
  try { localStorage.setItem('prism-theme', getTheme() === 'dusk' ? 'day' : 'dusk'); } catch { /* private mode */ }
  paintTheme();
};

$$('[data-mark]').forEach((el) => { el.innerHTML = mark('mk', 28); });

/* ---------- evidence textures for the wordmark, drawn from the theme's own colours ---------- */
function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const svgUrl = (s) => `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`;

function paintTextures() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  const obs = v('--obs'); const voice = v('--voice'); const doc = v('--doc');
  const S = 260;

  // observed data: bars and a dotted grid
  let r = rng(7); let s = `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}'><rect width='${S}' height='${S}' fill='${obs}' opacity='.35'/>`;
  for (let x = 6; x < S; x += 13) { const h = 40 + r() * 200; s += `<rect x='${x}' y='${S - h}' width='8' height='${h}' rx='2' fill='${obs}' opacity='${(0.45 + r() * 0.55).toFixed(2)}'/>`; }
  for (let y = 10; y < S; y += 26) for (let x = 10; x < S; x += 26) s += `<circle cx='${x}' cy='${y}' r='1.4' fill='white' opacity='.35'/>`;
  document.documentElement.style.setProperty('--tex-observed', svgUrl(s + '</svg>'));

  // participant voice: waveforms
  r = rng(11); s = `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}'><rect width='${S}' height='${S}' fill='${voice}' opacity='.38'/>`;
  for (let row = 0; row < 7; row++) {
    const y0 = 18 + row * 37; let d = `M0 ${y0}`;
    for (let x = 0; x <= S; x += 4) { const amp = (Math.sin(x / 9 + row) * 0.6 + r() * 0.8) * 14 * Math.sin((x / S) * Math.PI) + 2; d += ` L${x} ${(y0 + (x % 8 ? amp : -amp)).toFixed(1)}`; }
    s += `<path d='${d}' fill='none' stroke='${voice}' stroke-width='2.6' stroke-linejoin='round' opacity='${(0.6 + r() * 0.4).toFixed(2)}'/>`;
  }
  document.documentElement.style.setProperty('--tex-voice', svgUrl(s + '</svg>'));

  // documents: lines of text
  r = rng(23); s = `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}'><rect width='${S}' height='${S}' fill='${doc}' opacity='.38'/>`;
  for (let y = 10; y < S; y += 14) {
    let x = 8; while (x < S - 20) { const w = 10 + r() * 46; s += `<rect x='${x}' y='${y}' width='${Math.min(w, S - x - 8)}' height='6' rx='3' fill='${doc}' opacity='${(0.55 + r() * 0.45).toFixed(2)}'/>`; x += w + 6; }
  }
  document.documentElement.style.setProperty('--tex-document', svgUrl(s + '</svg>'));
}

/* ---------- cycle the wordmark through the evidence kinds ---------- */
const KINDS = [
  { k: 'observed', label: 'Observed data', note: 'survey waves, hearing logs, budgets', c: '--obs' },
  { k: 'voice', label: 'Participant voice', note: 'interviews and focus groups, with consent', c: '--voice' },
  { k: 'document', label: 'Documents', note: 'circulars, adopted budgets, reports', c: '--doc' },
  { k: 'spectrum', label: 'One clear picture', note: 'every claim traced to all three', c: '--on' },
];
let ki = 0;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function showKind(i) {
  const kind = KINDS[i];
  $$('.word__layer').forEach((l) => l.classList.toggle('is-on', l.dataset.kind === kind.k));
  $('#wordKind').textContent = kind.label;
  $('#wordNote').textContent = kind.note;
  $('.word__dot').style.setProperty('--dotc', `var(${kind.c})`);
}
if (!reduce) setInterval(() => { ki = (ki + 1) % KINDS.length; showKind(ki); }, 3200);

/* ---------- product tiles ---------- */
const TILES = [
  { id: 'brief', ic: 'brief', t: 'Brief', d: 'What changed, and the decisions waiting for you.', c: '--obs' },
  { id: 'framework', ic: 'framework', t: 'Theory of Change', d: 'A living map whose assumptions are tested against evidence.', c: '--doc' },
  { id: 'indicators', ic: 'indicators', t: 'Indicators', d: 'Each indicator with its trend, target and evidence behind it.', c: '--obs' },
  { id: 'evidence', ic: 'evidence', t: 'Evidence', d: 'Coded interviews and focus groups, by theme and by group.', c: '--voice' },
  { id: 'report', ic: 'report', t: 'Reports', d: 'Drafts built from approved records, every claim checked.', c: '--on' },
  { id: 'ledger', ic: 'ledger', t: 'Ledger', d: 'Every change by a person or an agent, and why.', c: '--watch' },
];
$('#tiles').innerHTML = TILES.map((x) => `<a class="tile reveal" href="app/#/${x.id}" style="--c:var(${x.c})">
  <span class="tile__ic">${icon(x.ic)}</span><h3>${x.t}</h3><p>${x.d}</p><span class="tile__go">Open in the demo</span></a>`).join('');

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el) => io.observe(el));

paintTheme();
showKind(0);

/* ---------- show the tour only once the video has been published ---------- */
fetch('assets/Prism-demo.mp4', { method: 'HEAD' }).then((r) => {
  if (r.ok) return;
  $('#tour').hidden = true;
  $$('a[href="#tour"]').forEach((a) => { a.hidden = true; });
}).catch(() => {});

/* old #/ demo links followed from within this page */
window.addEventListener('hashchange', () => { if (location.hash.startsWith('#/')) location.replace('app/' + location.hash); });
