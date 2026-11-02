// Hand-built SVG charts. Rules: missing data is drawn as a gap and labelled, never as zero;
// targets are drawn only when a target exists; every chart has a table twin.
import { esc } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';

function scale(d0, d1, r0, r1) {
  return (v) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
}

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * p;
}

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

const hatchDefs = (id) => `<defs>
  <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-2)" stroke-width="2"/></pattern>
  <linearGradient id="fill-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--series)" stop-opacity=".28"/><stop offset="1" stop-color="var(--series)" stop-opacity="0"/></linearGradient>
</defs>`;

/**
 * Trend chart for one indicator.
 * opts: { labels, values (null = missing), target, targetLabel, baseline, unit, band, colorVar, height,
 *         gapNotes: {i: text}, missingMode: 'gap' | 'cadence', yMax, rubric }
 */
export function trendChart(el, opts) {
  const id = Math.random().toString(36).slice(2, 8);
  const W = opts.width ?? 640;
  const H = opts.height ?? 260;
  const m = { t: 22, r: 64, b: 30, l: 40 };
  const { labels, values } = opts;
  const present = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  const maxV = opts.yMax ?? niceMax(Math.max(opts.target ?? 0, ...present.map(([, v]) => v + (opts.band ?? 0))) * 1.08);
  const x = scale(0, labels.length - 1, m.l, W - m.r);
  const y = scale(0, maxV, H - m.b, m.t);
  const col = `var(${opts.colorVar ?? '--obs'})`;
  const ticks = opts.rubric ? opts.rubric.map((_, i) => i + 1) : [0, maxV / 4, maxV / 2, (maxV * 3) / 4, maxV];
  const fmt = (v) => (opts.rubric ? opts.rubric[v - 1] : `${Math.round(v * 10) / 10}${opts.unit === '%' ? '%' : ''}`);

  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title ?? 'Trend chart')}" style="--series:${col}">${hatchDefs(id)}`;

  // grid + y labels
  for (const t of ticks) {
    s += `<line class="grid-line" x1="${m.l}" x2="${W - m.r + 8}" y1="${y(t)}" y2="${y(t)}"/>`;
    s += `<text x="${m.l - 8}" y="${y(t) + 3.5}" text-anchor="end">${esc(opts.rubric ? opts.rubric[t - 1].slice(0, 4) : fmt(t))}</text>`;
  }
  // x labels
  labels.forEach((lb, i) => {
    s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(lb)}</text>`;
  });

  // gaps: only flag periods where a report was due and none came
  if (opts.gapNotes) {
    for (const k of Object.keys(opts.gapNotes)) {
      const i = Number(k);
      const half = (x(1) - x(0)) / 2;
      s += `<rect class="gap-band" x="${x(i) - half * .8}" y="${m.t}" width="${half * 1.6}" height="${H - m.b - m.t}" rx="8"/>`;
      s += `<text x="${x(i)}" y="${m.t - 6}" text-anchor="middle" style="fill:var(--watch)">${esc(opts.gapLabel ?? 'No report')}</text>`;
    }
  }

  // target
  if (opts.target != null) {
    s += `<line class="target-line" x1="${m.l}" x2="${W - m.r + 8}" y1="${y(opts.target)}" y2="${y(opts.target)}"/>`;
    s += `<text x="${W - m.r + 12}" y="${y(opts.target) + 4}" class="lbl-mid">Target ${esc(fmt(opts.target))}</text>`;
    if (opts.targetLabel) s += `<text x="${W - m.r + 12}" y="${y(opts.target) + 17}">${esc(opts.targetLabel)}</text>`;
  }

  // uncertainty band
  if (opts.band) {
    const up = present.map(([i, v]) => [x(i), y(v + opts.band)]);
    const dn = present.map(([i, v]) => [x(i), y(Math.max(0, v - opts.band))]).reverse();
    s += `<path d="M${up.map((p) => p.join(',')).join(' L')} L${dn.map((p) => p.join(',')).join(' L')} Z" fill="${col}" opacity=".12"/>`;
  }

  // series: connect across cadence gaps (not collected), break at real gaps
  const segments = [];
  let cur = [];
  values.forEach((v, i) => {
    if (v == null) {
      if (opts.gapNotes && opts.gapNotes[i] != null) { if (cur.length) segments.push(cur); cur = []; }
      return;
    }
    cur.push([x(i), y(v)]);
  });
  if (cur.length) segments.push(cur);
  for (const seg of segments) {
    if (seg.length > 1) {
      const area = `${smoothPath(seg)} L${seg[seg.length - 1][0]},${H - m.b} L${seg[0][0]},${H - m.b} Z`;
      s += `<path d="${area}" fill="url(#fill-${id})"/>`;
      s += `<path class="series" d="${smoothPath(seg)}" stroke="${col}" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.2s var(--ease) forwards"/>`;
    }
  }

  // pace line from last point to target (what is needed)
  if (opts.target != null && opts.paceTo != null && present.length) {
    const [li, lv] = present[present.length - 1];
    s += `<path class="series-proj" d="M${x(li)},${y(lv)} L${x(opts.paceTo)},${y(opts.target)}" stroke="var(--ink-3)"/>`;
  }

  // baseline marker
  if (opts.baseline != null) {
    s += `<circle cx="${x(0)}" cy="${y(opts.baseline)}" r="4" fill="var(--bg)" stroke="var(--ink-3)" stroke-width="1.5"/>`;
    s += `<text x="${x(0) + 8}" y="${y(opts.baseline) + 16}">Baseline ${esc(fmt(opts.baseline))}</text>`;
  }

  // points
  present.forEach(([i, v], k) => {
    const last = k === present.length - 1;
    const partial = opts.partial && opts.partial[i];
    s += `<circle class="pt" cx="${x(i)}" cy="${y(v)}" r="${last ? 5.5 : 3.5}" fill="${partial ? 'var(--bg)' : col}" ${partial ? `stroke="${col}" stroke-width="2"` : ''}/>`;
    if (last) {
      s += `<circle cx="${x(i)}" cy="${y(v)}" r="11" fill="${col}" opacity=".16"/>`;
      s += `<text x="${x(i) - 12}" y="${y(v) - 12}" text-anchor="end" class="lbl-strong">${esc(fmt(v))}${partial ? '*' : ''}</text>`;
    }
  });

  // hover targets
  labels.forEach((_, i) => {
    const half = (x(1) - x(0)) / 2;
    s += `<rect data-i="${i}" x="${x(i) - half}" y="${m.t}" width="${half * 2}" height="${H - m.b - m.t}" fill="transparent"/>`;
  });
  s += `<line class="hover-line" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" style="opacity:0"/>`;
  s += '</svg>';

  el.classList.add('chart');
  el.innerHTML = `${s}<div class="tooltip" role="presentation"></div>`;
  const svg = el.querySelector('svg');
  const tip = el.querySelector('.tooltip');
  const hl = svg.querySelector('.hover-line');
  svg.querySelectorAll('rect[data-i]').forEach((r) => {
    r.addEventListener('mouseenter', () => {
      const i = Number(r.dataset.i);
      const v = values[i];
      const bb = svg.getBoundingClientRect();
      const px = (x(i) / W) * bb.width;
      hl.setAttribute('x1', x(i)); hl.setAttribute('x2', x(i)); hl.style.opacity = '1';
      let body;
      if (v != null) {
        body = `<div class="eyebrow">${esc(labels[i])}</div><b>${esc(fmt(v))}</b>${opts.band ? ` <span class="faint">±${opts.band}</span>` : ''}`;
        if (opts.partial && opts.partial[i]) body += `<div class="faint" style="margin-top:4px;max-width:200px">${esc(opts.partial[i])}</div>`;
        if (opts.target != null) body += `<div class="faint" style="margin-top:4px">${esc(fmt(opts.target))} target</div>`;
      } else if (opts.gapNotes && opts.gapNotes[i]) {
        body = `<div class="eyebrow">${esc(labels[i])}</div><div style="color:var(--watch);font-weight:600">No report received</div><div class="faint" style="max-width:200px">${esc(opts.gapNotes[i])}</div>`;
      } else {
        body = `<div class="eyebrow">${esc(labels[i])}</div><div class="faint">Not collected this period (${esc(opts.cadence ?? 'by design')})</div>`;
      }
      tip.innerHTML = body;
      tip.style.left = `${Math.min(Math.max(px - 80, 0), bb.width - 200)}px`;
      tip.style.top = '-6px';
      tip.classList.add('show');
    });
    r.addEventListener('mouseleave', () => { tip.classList.remove('show'); hl.style.opacity = '0'; });
  });
}

/** Small multiples bar: value per district, null shown as "No report" hatched */
export function districtBars(el, data, { unit = '%', max, colorVar = '--obs', target, rubric } = {}) {
  const entries = Object.entries(data);
  const W = 640; const rowH = 34; const H = entries.length * rowH + 20;
  const l = 110; const r = 70;
  const mx = max ?? niceMax(Math.max(target ?? 0, ...entries.map(([, v]) => v ?? 0)));
  const x = scale(0, mx, l, W - r);
  const fmt = (v) => (rubric ? rubric[v - 1] : `${v}${unit === '%' ? '%' : ''}`);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Values by district">${hatchDefs('db')}`;
  if (target != null) {
    s += `<line class="target-line" x1="${x(target)}" x2="${x(target)}" y1="4" y2="${H - 14}"/>`;
    s += `<text x="${x(target)}" y="${H - 2}" text-anchor="middle">Target ${esc(fmt(target))}</text>`;
  }
  entries.forEach(([k, v], i) => {
    const yy = i * rowH + 6;
    s += `<text x="0" y="${yy + 15}" style="font-family:var(--font-ui);font-size:12.5px;fill:var(--ink-2)">${esc(k)}</text>`;
    s += `<rect x="${l}" y="${yy + 2}" width="${W - l - r}" height="18" rx="9" fill="var(--glass-2)"/>`;
    if (v == null) {
      s += `<rect x="${l}" y="${yy + 2}" width="${W - l - r}" height="18" rx="9" fill="url(#hatch)" stroke="var(--watch)" stroke-dasharray="3 3" stroke-opacity=".6"/>`;
      s += `<text x="${l + 10}" y="${yy + 15}" style="fill:var(--watch)">No report: excluded, not zero</text>`;
    } else {
      s += `<rect x="${l}" y="${yy + 2}" width="${x(v) - l}" height="18" rx="9" fill="var(${colorVar})" style="transform-origin:${l}px 0;animation:grow .9s var(--ease) both ${i * 0.06}s"/>`;
      s += `<text x="${x(v) + 8}" y="${yy + 15}" class="lbl-mid">${esc(fmt(v))}</text>`;
    }
  });
  s += '</svg>';
  el.classList.add('chart');
  el.innerHTML = s;
}

/** Annual bars with target, for budget-cycle indicators */
export function annualBars(el, { labels, values, target, unit = '%', baseline, title }) {
  const W = 640; const H = 240; const m = { t: 24, r: 70, b: 30, l: 40 };
  const mx = niceMax(Math.max(target ?? 0, ...values) * 1.1);
  const y = scale(0, mx, H - m.b, m.t);
  const bw = 64;
  const step = (W - m.l - m.r) / labels.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title ?? 'Annual values')}">`;
  for (const t of [0, mx / 2, mx]) {
    s += `<line class="grid-line" x1="${m.l}" x2="${W - m.r + 8}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 8}" y="${y(t) + 3.5}" text-anchor="end">${Math.round(t)}${unit}</text>`;
  }
  labels.forEach((lb, i) => {
    const cx = m.l + step * i + step / 2;
    const v = values[i];
    const isBase = i === 0 && baseline != null;
    s += `<rect x="${cx - bw / 2}" y="${y(v)}" width="${bw}" height="${H - m.b - y(v)}" rx="10" fill="${isBase ? 'var(--ink-4)' : 'var(--off)'}" opacity="${isBase ? '.55' : '.9'}" style="transform-origin:0 ${H - m.b}px;animation:growy .9s var(--ease) both ${i * 0.08}s"/>`;
    s += `<text x="${cx}" y="${y(v) - 8}" text-anchor="middle" class="lbl-strong">${v}${unit}</text>`;
    s += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(lb)}${isBase ? ' · baseline' : ''}</text>`;
  });
  if (target != null) {
    s += `<line class="target-line" x1="${m.l}" x2="${W - m.r + 8}" y1="${y(target)}" y2="${y(target)}"/>`;
    s += `<text x="${W - m.r + 12}" y="${y(target) + 4}" class="lbl-mid">Target ${target}${unit}</text><text x="${W - m.r + 12}" y="${y(target) + 17}">by FY27</text>`;
  }
  s += '</svg>';
  el.classList.add('chart');
  el.innerHTML = s;
}

/** Tiny sparkline. Gaps at null. */
export function sparkline(values, { colorVar = '--obs', w = 96, h = 28 } = {}) {
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return `<svg width="${w}" height="${h}"></svg>`;
  const mx = Math.max(...pts.map(([, v]) => v));
  const mn = Math.min(...pts.map(([, v]) => v));
  const x = scale(0, values.length - 1, 3, w - 3);
  const y = scale(mn, mx === mn ? mn + 1 : mx, h - 4, 4);
  const p = pts.map(([i, v]) => [x(i), y(v)]);
  const [lx, ly] = p[p.length - 1];
  const gapAfter = values[values.length - 1] == null;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="overflow:visible">
    <path d="${smoothPath(p)}" fill="none" stroke="var(${colorVar})" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="${lx}" cy="${ly}" r="2.6" fill="var(${colorVar})"/>
    ${gapAfter ? `<circle cx="${w - 3}" cy="${ly}" r="2.6" fill="none" stroke="var(--watch)" stroke-dasharray="1.5 1.5"/>` : ''}
  </svg>`;
}

/** Spectrum bar HTML from {observed, voice, document, agent} counts */
export function spectrumBar(sp, { lg = false, showGap = true } = {}) {
  const total = (sp.observed ?? 0) + (sp.voice ?? 0) + (sp.document ?? 0) + (sp.agent ?? 0);
  if (!total) return `<div class="spectrum ${lg ? 'spectrum--lg' : ''}" role="img" aria-label="No evidence linked"><span class="s-gap"></span></div>`;
  const parts = ['observed', 'voice', 'document', 'agent'].filter((k) => sp[k]).map((k) => `<span class="s-${k}" style="flex:${sp[k]}" title="${k}: ${sp[k]}"></span>`).join('');
  const missing = showGap && (!sp.voice || !sp.observed) ? '<span class="s-gap" style="flex:1.2" title="Missing evidence kind"></span>' : '';
  const label = `Evidence: ${sp.observed ?? 0} data, ${sp.voice ?? 0} voice, ${sp.document ?? 0} documents, ${sp.agent ?? 0} agent interpretations`;
  return `<div class="spectrum ${lg ? 'spectrum--lg' : ''}" role="img" aria-label="${label}">${parts}${missing}</div>`;
}
