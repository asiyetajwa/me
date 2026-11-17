// Everhome landing: hero model, the interactive 3D section, and Ever cycling languages.
import { mountHouse } from './homeview.js';

const $ = (s) => document.querySelector(s);
const lazy = (el, fn) => new IntersectionObserver((en, ob) => { if (en.some((e) => e.isIntersecting)) { fn(); ob.disconnect(); } }, { rootMargin: '200px' }).observe(el);

// Hero: today's render with the risks marked
const hero = mountHouse($('#hero-house'), { labels: false, interactive: false, radius: innerWidth < 820 ? 21 : 26, phi: 0.92 });

// Ever speaks each language in turn
const langs = ['Soomaali', 'Hmoob', 'Español', 'English'];
let li = 0;
setInterval(() => { li = (li + 1) % langs.length; $('#hero-lang').textContent = langs[li]; }, 2600);

// 3D section
let land = null, score = 58, anim = 0;
lazy($('#land-house'), () => { land = mountHouse($('#land-house'), { labels: true, radius: innerWidth < 560 ? 24 : 18 }); });
function countTo(n) {
  const el = $('#land-score'), from = score, t0 = performance.now();
  cancelAnimationFrame(anim);
  const step = () => { const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = String(Math.round(from + (n - from) * (1 - (1 - k) ** 3))); if (k < 1) anim = requestAnimationFrame(step); else score = n; };
  step();
  $('.score-big').classList.toggle('good', n >= 80);
}
document.querySelectorAll('.seg-l button').forEach((b) => b.addEventListener('click', () => {
  const m = b.dataset.mode;
  document.querySelectorAll('.seg-l button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  land?.setMode(m); countTo(m === 'after' ? 91 : 58);
}));

window.EHL = { hero, setMode: (m) => document.querySelector(`.seg-l [data-mode="${m}"]`).click() };
