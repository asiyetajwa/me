// Everhome landing: hero model, the interactive 3D section, and Ever cycling languages.
import { mountHouse } from './homeview.js';

const $ = (s) => document.querySelector(s);
const lazy = (el, fn) => new IntersectionObserver((en, ob) => { if (en.some((e) => e.isIntersecting)) { fn(); ob.disconnect(); } }, { rootMargin: '200px' }).observe(el);

// Hero: today's render with the risks marked
const hero = mountHouse($('#hero-house'), { labels: false });

// Ever speaks each language in turn: the flag in the pill changes
const FLAGS = {"us": "<svg class=\"flag\" viewBox=\"0 0 38 20\" role=\"img\" aria-label=\"United States flag\"><rect width=\"38\" height=\"20\" fill=\"#fff\"/><g fill=\"#b22234\"><rect y=\"0.00\" width=\"38\" height=\"1.54\"/><rect y=\"3.08\" width=\"38\" height=\"1.54\"/><rect y=\"6.15\" width=\"38\" height=\"1.54\"/><rect y=\"9.23\" width=\"38\" height=\"1.54\"/><rect y=\"12.31\" width=\"38\" height=\"1.54\"/><rect y=\"15.38\" width=\"38\" height=\"1.54\"/><rect y=\"18.46\" width=\"38\" height=\"1.54\"/></g><rect width=\"15.2\" height=\"10.77\" fill=\"#3c3b6e\"/><g fill=\"#fff\"><circle cx=\"1.30\" cy=\"1.10\" r=\"0.42\"/><circle cx=\"3.80\" cy=\"1.10\" r=\"0.42\"/><circle cx=\"6.30\" cy=\"1.10\" r=\"0.42\"/><circle cx=\"8.80\" cy=\"1.10\" r=\"0.42\"/><circle cx=\"11.30\" cy=\"1.10\" r=\"0.42\"/><circle cx=\"2.55\" cy=\"2.85\" r=\"0.42\"/><circle cx=\"5.05\" cy=\"2.85\" r=\"0.42\"/><circle cx=\"7.55\" cy=\"2.85\" r=\"0.42\"/><circle cx=\"10.05\" cy=\"2.85\" r=\"0.42\"/><circle cx=\"12.55\" cy=\"2.85\" r=\"0.42\"/><circle cx=\"1.30\" cy=\"4.60\" r=\"0.42\"/><circle cx=\"3.80\" cy=\"4.60\" r=\"0.42\"/><circle cx=\"6.30\" cy=\"4.60\" r=\"0.42\"/><circle cx=\"8.80\" cy=\"4.60\" r=\"0.42\"/><circle cx=\"11.30\" cy=\"4.60\" r=\"0.42\"/><circle cx=\"2.55\" cy=\"6.35\" r=\"0.42\"/><circle cx=\"5.05\" cy=\"6.35\" r=\"0.42\"/><circle cx=\"7.55\" cy=\"6.35\" r=\"0.42\"/><circle cx=\"10.05\" cy=\"6.35\" r=\"0.42\"/><circle cx=\"12.55\" cy=\"6.35\" r=\"0.42\"/><circle cx=\"1.30\" cy=\"8.10\" r=\"0.42\"/><circle cx=\"3.80\" cy=\"8.10\" r=\"0.42\"/><circle cx=\"6.30\" cy=\"8.10\" r=\"0.42\"/><circle cx=\"8.80\" cy=\"8.10\" r=\"0.42\"/><circle cx=\"11.30\" cy=\"8.10\" r=\"0.42\"/><circle cx=\"2.55\" cy=\"9.85\" r=\"0.42\"/><circle cx=\"5.05\" cy=\"9.85\" r=\"0.42\"/><circle cx=\"7.55\" cy=\"9.85\" r=\"0.42\"/><circle cx=\"10.05\" cy=\"9.85\" r=\"0.42\"/><circle cx=\"12.55\" cy=\"9.85\" r=\"0.42\"/></g></svg>", "so": "<svg class=\"flag\" viewBox=\"0 0 30 20\" role=\"img\" aria-label=\"Somali flag\"><rect width=\"30\" height=\"20\" fill=\"#4189dd\"/><polygon fill=\"#fff\" points=\"15.00,5.00 16.21,8.73 20.14,8.73 16.96,11.04 18.17,14.77 15.00,12.46 11.83,14.77 13.04,11.04 9.86,8.73 13.79,8.73\"/></svg>", "es": "<svg class=\"flag\" viewBox=\"0 0 30 20\" role=\"img\" aria-label=\"Spanish flag\"><rect width=\"30\" height=\"20\" fill=\"#aa151b\"/><rect y=\"5\" width=\"30\" height=\"10\" fill=\"#f1bf00\"/></svg>"};
const order = ['so', 'es', 'us'];
let li = 0;
setInterval(() => { li = (li + 1) % order.length; $('#hero-flag').innerHTML = FLAGS[order[li]]; }, 2600);

// The headline's last word rotates through the family
const who = ['Mom', 'Dad', 'Grandma', 'Grandpa', 'Aunt', 'Uncle'];
let wi = 0;
const rot = $('#rot');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => {
  rot.classList.add('out');
  setTimeout(() => { wi = (wi + 1) % who.length; rot.textContent = who[wi]; rot.classList.remove('out'); }, 380);
}, 2400);

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
