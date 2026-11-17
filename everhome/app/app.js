// Everhome app mockup: navigation, the scripted moments, 3D, and the film API (window.EH).
import { mountHouse } from '../assets/js/homeview.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const FILM = params.has('film');
if (FILM) document.body.classList.add('film');

const ORDER = ['lang', 'talk', 'consent', 'plan', 'scan', 'home', 'quotes', 'family'];
let current = null, timers = [], house = null, houseOT = null;
const later = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

function go(id, { play = !FILM } = {}) {
  if (!ORDER.includes(id) || id === current) return;
  clearTimers();
  const prev = current && $(`.scr[data-s="${current}"]`);
  const next = $(`.scr[data-s="${id}"]`);
  if (prev) { prev.classList.remove('on'); prev.classList.add('out'); later(600, () => prev.classList.remove('out')); }
  reset(id);
  next.classList.add('on');
  current = id;
  $('#screen').classList.toggle('on-dark', id === 'scan' || id === 'lang');
  $$('#steplist button').forEach((b) => b.classList.toggle('on', b.dataset.go === id));
  if (id === 'home') ensureHouse();
  if (play) PLAY[id]?.();
}

// Put each screen back to its first frame so a scripted moment can play from the start.
function reset(id) {
  if (id === 'lang') $$('.lang').forEach((b) => b.classList.remove('on'));
  if (id === 'talk') { $$('.bub, .fill, .fill li').forEach((e) => e.classList.remove('in')); }
  if (id === 'consent') { $$('.toggle').forEach((t) => t.setAttribute('aria-checked', 'false')); $('#vsign').classList.remove('in'); }
  if (id === 'scan') { $$('.mchip, .cam .dim, .cam .turn').forEach((e) => e.classList.remove('in')); $('#tip').textContent = 'Walk slowly around the room'; }
  if (id === 'home') { setMode('today'); setScore(58); }
  if (id === 'quotes') $$('.q').forEach((e) => e.classList.remove('in'));
}

// The scripted moments (also used by the film, which calls them at its own pace)
const PLAY = {
  lang() { later(900, () => pickLang('so')); },
  talk() {
    const bubs = $$('.bub'), lis = $$('.fill li');
    bubs.forEach((b, i) => later(300 + i * 1500, () => b.classList.add('in')));
    later(2200, () => $('#fill').classList.add('in'));
    lis.forEach((l, i) => later(2800 + i * 650, () => l.classList.add('in')));
  },
  consent() { later(700, () => toggle('photo', true)); later(1500, () => toggle('health', true)); later(2300, () => $('#vsign').classList.add('in')); },
  plan() {},
  scan() {
    later(900, () => { $('[data-m="door"]').classList.add('in'); $('.cam .dim').classList.add('in'); });
    later(1900, () => $('[data-m="tub"]').classList.add('in'));
    later(2700, () => { $('#tip').textContent = 'Mirror ahead. Slow down a little.'; });
    later(3300, () => { $('[data-m="turn"]').classList.add('in'); $('.cam .turn').classList.add('in'); });
    later(4200, () => $('[data-m="mirror"]').classList.add('in'));
  },
  home() { later(2600, () => setMode('after')); },
  quotes() { $$('.q').forEach((q, i) => later(250 + i * 380, () => q.classList.add('in'))); },
  family() {},
};

function pickLang(l) { $$('.lang').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); }
function toggle(name, on) { $(`.toggle[data-t="${name}"]`).setAttribute('aria-checked', String(on)); }

// Score ring: 58 today, 91 after the fixes
let scoreNow = 58, scoreAnim = 0;
function setScore(n, animate = false) {
  const el = $('#score'), arc = $('#sc-arc'), num = $('#score-n');
  arc.style.strokeDashoffset = String(213.6 * (1 - n / 100));
  el.classList.toggle('good', n >= 80);
  cancelAnimationFrame(scoreAnim);
  if (!animate) { scoreNow = n; num.textContent = String(n); return; }
  const from = scoreNow, t0 = performance.now();
  const step = () => { const k = Math.min(1, (performance.now() - t0) / 1000); const e = 1 - (1 - k) ** 3; num.textContent = String(Math.round(from + (n - from) * e)); if (k < 1) scoreAnim = requestAnimationFrame(step); else scoreNow = n; };
  step();
}
function setMode(m) {
  const seg = $('.seg');
  seg.classList.toggle('after', m === 'after');
  $$('.seg button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
  $('#fixes').classList.toggle('after', m === 'after');
  $$('#fixes .tag').forEach((t) => { t.textContent = m === 'after' ? 'Fixed' : 'Now'; });
  house?.setMode(m);
  setScore(m === 'after' ? 91 : 58, true);
}
function ensureHouse() {
  if (house) return;
  house = mountHouse($('#house'), { labels: false, focusZoom: 1.9, visible: () => current === 'home' && !document.body.classList.contains('show-console') });
}
function focusHazard(id) { house?.focus(id); $$('#fixes li').forEach((li) => li.classList.toggle('hl', li.dataset.h === id)); }

// Console approval
let approved = false;
function approve() {
  if (approved) return; approved = true;
  if ($('#turn-in').value !== '52 in') editTurning();
  const rows = $$('#meas tr');
  rows.forEach((r, i) => setTimeout(() => r.querySelector('.ck').classList.add('on'), i * 160));
  setTimeout(() => {
    const b = $('#banner'); b.classList.remove('draft'); b.classList.add('ok');
    $('#banner-t').textContent = 'Approved for quoting';
    $('#banner-s').textContent = 'Jenna Lindqvist, OTR/L · 21 Nov, 09:14 · Sent to 3 matched contractors';
    const a = $('#approve'); a.classList.add('done'); a.textContent = 'Approved';
    houseOT?.setMode('after');
  }, rows.length * 160 + 200);
}
function editTurning() { const i = $('#turn-in'); i.value = '52 in'; i.closest('tr').classList.remove('flag'); i.closest('tr').classList.add('edited'); }

// Wire up
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go, { play: true }); return; }
  const l = e.target.closest('.lang'); if (l) { pickLang(l.dataset.lang); setTimeout(() => go('talk', { play: true }), 500); return; }
  const t = e.target.closest('.toggle'); if (t) { e.preventDefault(); t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true')); return; }
  const o = e.target.closest('.opt'); if (o) { $$('.opt').forEach((x) => x.classList.toggle('on', x === o)); $('#pay').textContent = o.dataset.opt === 'a' ? 'Pay $349 One-Time' : 'Pay $199 One-Time'; return; }
  const s = e.target.closest('.seg button'); if (s) { setMode(s.dataset.mode); return; }
  const f = e.target.closest('#fixes li'); if (f) { focusHazard(f.dataset.h); return; }
  if (e.target.closest('#approve')) approve();
});
$('#turn-in').addEventListener('change', (e) => e.target.closest('tr').classList.replace('flag', 'edited'));

// The OT console's 3D view mounts when it scrolls into view (or at once in the film)
const mountOT = () => { if (!houseOT) houseOT = mountHouse($('#house-ot'), { labels: true, focusZoom: 1.8, visible: () => !FILM || document.body.classList.contains('show-console') }); };
if (FILM) mountOT(); else new IntersectionObserver((en, ob) => { if (en.some((x) => x.isIntersecting)) { mountOT(); ob.disconnect(); } }, { rootMargin: '200px' }).observe($('#house-ot'));

// Film stage extras: dusk backdrop and the big dot-matrix word beside the phone
if (FILM) {
  const bg = document.createElement('div'); bg.className = 'stage-bg dusk';
  bg.innerHTML = '<div class="streak" style="top:22%"></div><div class="streak" style="top:58%;opacity:.35"></div><div class="dotgrid" style="position:absolute;inset:0;opacity:.5"></div>';
  bg.style.background = 'linear-gradient(180deg,#221c3d 0%,#3d3170 40%,#7b64a8 75%,#b89acb 100%)';
  $('#phone').prepend(bg);
  const fw = document.createElement('div'); fw.className = 'filmword'; fw.id = 'filmword'; $('#phone').append(fw);
}
function word(w, line) {
  const fw = $('#filmword'); if (!fw) return;
  fw.innerHTML = w ? `<div class="fw-in"><span class="dots">${w}</span>${line ? `<p>${line}</p>` : ''}</div>` : '';
}

window.EH = {
  go, play: (id) => PLAY[id]?.(), pickLang, toggle, setMode, focusHazard, approve, editTurning, word,
  side(on) { document.body.classList.toggle('side-left', on); },
  console(on) { document.body.classList.toggle('show-console', on); if (on) houseOT?.focus('tub'); },
  reveal(sel) { $(sel)?.classList.add('in'); },
  otFocus(id) { houseOT?.focus(id); },
};

const start = params.get('screen') ?? (location.hash === '#console' ? 'home' : 'lang');
go(ORDER.includes(start) ? start : 'lang', { play: !FILM });

// ---- Film helpers: a soft cursor that glides and taps, and the end card ----
const cur = $('#cursor');
let cx = 1180, cy = 700;
cur.style.transform = `translate(${cx}px, ${cy}px)`; cur.style.left = '0'; cur.style.top = '0'; cur.style.margin = '-17px 0 0 -17px';
function cursorTo(sel, { ms = 900, click = false, dx = 0, dy = 0 } = {}) {
  const el = typeof sel === 'string' ? $(sel) : sel; if (!el) return;
  const r = el.getBoundingClientRect();
  const tx = r.left + r.width / 2 + dx, ty = r.top + r.height / 2 + dy, fx = cx, fy = cy, t0 = performance.now();
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms), e = ease(k);
    cx = fx + (tx - fx) * e; cy = fy + (ty - fy) * e;
    cur.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
    if (k < 1) requestAnimationFrame(step);
    else if (click) { cur.classList.add('down'); setTimeout(() => { cur.classList.remove('down'); el.click(); }, 160); }
  };
  step();
}
function cursorHide(on) { cur.style.opacity = on ? '0' : '1'; }
function endcard() {
  const e = document.createElement('div'); e.className = 'endcard';
  e.innerHTML = '<div class="ec-in"><span class="orb live" style="--s:96px"></span><span class="dots ec-word">Everhome</span><p>Stay safe in the home you love.</p><small>Twin Cities and Dakota County · Somali, Hmong, Spanish and English</small></div>';
  document.body.append(e); requestAnimationFrame(() => e.classList.add('on'));
}
Object.assign(window.EH, { cursorTo, cursorHide, endcard, speakSo(on) { $('.listen .so').classList.toggle('speaking', on); } });
