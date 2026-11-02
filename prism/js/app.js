import {
  ORG, ME, PEOPLE, PROGRAMME, PERIODS, KINDS, STATUS, RESULTS, LINKS, ASSUMPTIONS, INDICATORS, EVIDENCE,
  THEMES, GROUPS, MATRIX, DECISIONS, TIMELINE, VERSIONS, LEDGER, LIBRARY, CONCEPT_NOTE, DRAFT, REPORT_CLAIMS,
} from './data.js';
import { icon, mark, $, $$, esc, fmtDate, daysBetween, toast } from './ui.js';
import { trendChart, districtBars, annualBars, sparkline, spectrumBar } from './charts.js';

const TODAY = '2026-11-02';

/* ------------------------------------------------------------------ state */
const state = {
  v4: false,
  version: 'v3',
  fixed: new Set(),
  dismissed: new Set(),
  requestSent: false,
  adapted: new Set(),
  draft: {},
  ledger: [...LEDGER],
  check: true,
  evFilter: 'all',
  libQuery: '',
  libLevel: 'All',
  agentIndicator: false,
};

const byId = (arr, id) => arr.find((x) => x.id === id);
const ind = (id) => byId(INDICATORS, id);
const ev = (id) => byId(EVIDENCE, id);
const res = (id) => byId(RESULTS, id);
const vNum = (v) => Number(v.slice(1));

function statusChip(s, extra = '') {
  const st = STATUS[s] ?? STATUS.nodata;
  return `<span class="chip status status--${s} ${extra}" title="${st.label}">${icon(st.icon)}<span class="st-l">${st.label}</span></span>`;
}
function kindChip(k) {
  return `<span class="chip kind kind--${k}"><i></i>${KINDS[k].short}</span>`;
}
function srcChip(id) {
  const e = ev(id);
  if (e) return `<a class="srcchip" href="#/evidence?id=${id}" style="--c:var(${KINDS[e.kind].var})" title="${esc(e.title)}"><i></i>${id}</a>`;
  const i = ind(id);
  if (i) return `<a class="srcchip" href="#/indicators?id=${id}" style="--c:var(--ink-3)" title="${esc(i.title)}"><i></i>${id}</a>`;
  return `<span class="srcchip">${esc(id)}</span>`;
}
function fmtVal(i, v = i.current) {
  if (v == null) return '–';
  if (i.rubric) return i.rubric[v - 1];
  if (i.unit === '%') return `${v}%`;
  return `${v}`;
}
function log(who, what, obj, st, agent = false) {
  const d = new Date();
  const t = `${TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  state.ledger.unshift({ t, who, what, obj, state: st, agent });
}

/* ------------------------------------------------------------------ shell */
const NAV = [
  { id: 'brief', label: 'Brief', icon: 'brief' },
  { id: 'framework', label: 'Theory of Change', icon: 'framework', short: 'Change' },
  { id: 'indicators', label: 'Indicators', icon: 'indicators' },
  { id: 'evidence', label: 'Evidence', icon: 'evidence' },
  { id: 'report', label: 'Reports', icon: 'report' },
  { id: 'ledger', label: 'Ledger', icon: 'ledger' },
];

function pendingCount() {
  return DECISIONS.filter((d) => !state.dismissed.has(d.id) && !(d.id === 'D1' && state.v4) && !(d.id === 'D2' && state.fixed.has('c2')) && !(d.id === 'D3' && state.requestSent)).length;
}

function shell() {
  document.body.insertAdjacentHTML('afterbegin', `
  <div class="atmos" aria-hidden="true">
    <div class="atmos__sky"></div>
    <div class="atmos__orb atmos__orb--1"></div><div class="atmos__orb atmos__orb--2"></div><div class="atmos__orb atmos__orb--3"></div>
    <svg class="atmos__hills" viewBox="0 0 1440 400" preserveAspectRatio="none">
      <path d="M0 210 C 180 150 320 170 470 200 S 760 120 920 160 1240 210 1440 150 V400 H0Z" fill="var(--sky-b)" opacity=".75"/>
      <path d="M0 270 C 220 230 380 260 560 250 S 900 210 1100 250 1320 280 1440 240 V400 H0Z" fill="var(--ground)" opacity=".85"/>
    </svg>
    <div class="atmos__grain"></div>
  </div>
  <div class="app">
    <aside class="side" aria-label="Primary">
      <div class="side__panel glass">
        <div class="lights" aria-hidden="true"><i></i><i></i><i></i></div>
        <a class="brand" href="#/brief" aria-label="Prism home">${mark('mk', 30)}<div><div class="brand__word">Prism</div><div class="brand__sub">Programme intelligence</div></div></a>
        <button class="ws" type="button" title="Workspace (demo)">
          <span class="ws__dot">OC</span>
          <span><span class="ws__name">${PROGRAMME.name}</span><br><span class="ws__meta">${ORG.name}</span></span>
        </button>
        <nav class="nav" id="nav"></nav>
        <div class="side__foot">
          <div class="me"><span class="avatar">${ME.initials}</span><div><div class="me__name">${ME.name}</div><div class="me__role">${ME.role}</div></div></div>
        </div>
      </div>
    </aside>
    <main class="main" id="main" tabindex="-1">
      <header class="topbar">
        <div class="crumbs">
          <div class="crumbs__arrows"><button type="button" aria-label="Back" id="back">${icon('left')}</button><button type="button" aria-label="Forward" id="fwd">${icon('right')}</button></div>
          <h1 class="crumbs__title" id="title">Brief</h1>
        </div>
        <div class="topbar__spacer"></div>
        <span class="demo-tag" title="Every person, place, quote and figure in this demo is fictional">Demo data · fictional</span>
        <button class="search" type="button" id="openPalette" aria-label="Search everything">${icon('search')}<span>Search indicators, evidence…</span><kbd>⌘K</kbd></button>
        <button class="iconbtn" type="button" id="theme" aria-label="Switch theme"></button>
      </header>
      <div id="view"></div>
    </main>
  </div>
  <nav class="mobilebar glass" id="mobilebar" aria-label="Primary"></nav>
  <button class="orb" type="button" id="orb" aria-label="Open Prism agents" aria-expanded="false">${mark('mk', 30)}<span class="orb__badge" id="orbBadge"></span></button>
  <section class="dock" id="dock" aria-label="Prism agents"></section>
  <div class="drawer-scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" aria-hidden="true" aria-label="Details"></aside>
  <div class="palette-scrim" id="paletteScrim"><div class="palette" role="dialog" aria-label="Search"><input id="paletteInput" placeholder="Search programmes, indicators, evidence…" autocomplete="off"><div class="palette__list" id="paletteList" role="listbox"></div></div></div>
  <div class="toasts" id="toasts" aria-live="polite"></div>`);

  $('#back').onclick = () => history.back();
  $('#fwd').onclick = () => history.forward();
  $('#theme').onclick = toggleTheme;
  $('#orb').onclick = () => toggleDock();
  $('#scrim').onclick = closeDrawer;
  $('#openPalette').onclick = openPalette;
  $('#paletteScrim').onclick = (e) => { if (e.target.id === 'paletteScrim') closePalette(); };
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    if (e.key === 'Escape') { closePalette(); closeDrawer(); toggleDock(false); }
  });
  paintTheme();
}

function renderNav(route) {
  const n = pendingCount();
  $('#nav').innerHTML = `<div class="nav__label">${PROGRAMME.name}</div>` + NAV.map((x) => `
    <a href="#/${x.id}" ${route === x.id ? 'aria-current="page"' : ''}>${icon(x.icon)}<span>${x.label}</span>
      ${x.id === 'brief' && n ? `<span class="nav__count nav__count--alert">${n}</span>` : ''}
      ${x.id === 'evidence' ? `<span class="nav__count">${EVIDENCE.length}</span>` : ''}
    </a>`).join('') + `<div class="nav__label">Workspace</div>
    <a href="#/indicators?tab=library" ${route === 'library' ? 'aria-current="page"' : ''}>${icon('library')}<span>Indicator Library</span></a>`;
  $('#mobilebar').innerHTML = NAV.slice(0, 5).map((x) => `<a href="#/${x.id}" ${route === x.id ? 'aria-current="page"' : ''}>${icon(x.icon)}<span>${x.short ?? x.label}</span></a>`).join('');
  const b = $('#orbBadge');
  b.textContent = n || '';
  b.style.display = n ? 'grid' : 'none';
}

/* ------------------------------------------------------------------ theme */
function getTheme() {
  try { return localStorage.getItem('prism-theme'); } catch { return null; }
}
function paintTheme() {
  const t = getTheme() ?? 'dusk';
  document.documentElement.dataset.theme = t;
  $('#theme').innerHTML = icon(t === 'dusk' ? 'sun' : 'moon');
  $('#theme').setAttribute('aria-label', t === 'dusk' ? 'Switch to daylight' : 'Switch to dusk');
}
function toggleTheme() {
  const t = (getTheme() ?? 'dusk') === 'dusk' ? 'day' : 'dusk';
  try { localStorage.setItem('prism-theme', t); } catch { /* private mode */ }
  paintTheme();
}

/* ------------------------------------------------------------------ router */
function parse() {
  const h = location.hash.replace(/^#\/?/, '') || 'brief';
  const [path, qs] = h.split('?');
  return { route: path || 'brief', q: Object.fromEntries(new URLSearchParams(qs ?? '')) };
}

const VIEWS = {};
let current = null;

function go() {
  const { route, q } = parse();
  const view = VIEWS[route] ? route : 'brief';
  closeDrawer();
  const v = $('#view');
  v.innerHTML = '';
  v.className = 'page';
  void v.offsetWidth;
  v.className = 'page';
  const navRoute = view === 'indicators' && q.tab === 'library' ? 'library' : view;
  renderNav(navRoute);
  current = { view, q };
  VIEWS[view](v, q);
  renderDock();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ================================================================== BRIEF */
VIEWS.brief = (v) => {
  $('#title').textContent = 'Brief';
  const days = daysBetween(TODAY, PROGRAMME.nextReport.due);
  const outputs = INDICATORS.filter((i) => res(i.result)?.level === 'output');
  const outPct = Math.round((outputs.reduce((a, i) => a + i.current / i.target, 0) / outputs.length) * 100);
  const onTrack = INDICATORS.filter((i) => i.status === 'on').length;
  const n = pendingCount();
  const thisQ = EVIDENCE.filter((e) => e.date >= '2026-07-01');

  v.innerHTML = `
  <div class="brief stagger">
    <section class="glass hero refract" aria-labelledby="hero-line">
      <div class="hero__date">
        <span class="eyebrow">Monday 2 November</span>
        <span class="chip">${icon('flag')}${days} days to the ${esc(PROGRAMME.nextReport.name)}</span>
        <span class="chip">Framework ${state.v4 ? 'v4' : 'v3'}</span>
      </div>
      <h2 class="display hero__line" id="hero-line">Activities are landing. <em>The budget link isn’t.</em> <span class="dim">Outputs are ${outPct}% of the way to target, but funded citizen priorities moved three points in two budget cycles.</span></h2>
      <div class="hero__foot">
        <div class="stat"><div class="stat__v">${onTrack}<small>/ ${INDICATORS.length}</small></div><div class="stat__l">Indicators on track</div><div class="stat__d" style="color:var(--off)">${icon('alert', '').replace('<svg', '<svg width="12" height="12"')} 1 off track</div></div>
        <div class="stat"><div class="stat__v">${thisQ.length}</div><div class="stat__l">Evidence items this quarter</div><div class="stat__d faint">${thisQ.filter((e) => e.kind === 'voice').length} participant voice</div></div>
        <div class="stat"><div class="stat__v">${n}</div><div class="stat__l">Decisions waiting for you</div><div class="stat__d faint">Prepared by agents</div></div>
        <div class="stat"><div class="stat__v">${state.requestSent ? 0 : 1}</div><div class="stat__l">Report overdue</div><div class="stat__d" style="color:var(--watch)">${state.requestSent ? 'Request sent' : 'Tarn Valley, 23 days'}</div></div>
      </div>
    </section>

    <section class="glass cascade" aria-labelledby="cascade-h">
      <div class="card__head"><div><div class="card__title" id="cascade-h">Results health</div><div class="card__sub">Status of every result in framework ${state.v4 ? 'v4' : 'v3'}, by level</div></div></div>
      ${cascadeRows()}
      <div class="callout">${icon('alert')}<div><strong>Outputs are green but Outcome 2 is red.</strong> Completing activities is not evidence of change. Assumption A3, that trained officials can move budgets, is contradicted by six interviews.</div></div>
      <div class="chart-foot"><span class="legend"><span style="--c:var(--on)"><i></i>On track</span><span style="--c:var(--watch)"><i></i>Watch</span><span style="--c:var(--off)"><i></i>Off track</span><span class="lg-gap"><i></i>No data yet</span></span><span class="spacer"></span><a class="btn btn--sm btn--ghost" href="#/framework">Open Theory of Change</a></div>
    </section>
  </div>

  <div class="card__head section-gap" style="margin-top:28px;padding:0 4px"><div><div class="card__title">Waiting on your judgement</div><div class="card__sub">Agents prepared these from approved records. Nothing changes until you decide.</div></div></div>
  <div class="decisions stagger" id="decisions">${decisionCards()}</div>

  <div class="lower section-gap stagger">
    <section class="glass card" aria-labelledby="pulse-h">
      <div class="card__head"><div><div class="card__title" id="pulse-h">Outcome pulse</div><div class="card__sub">Impact and outcome indicators, latest value against target</div></div><span class="spacer"></span><a class="btn btn--sm btn--ghost" href="#/indicators">All indicators</a></div>
      <div class="tablewrap"><table class="data">
        <thead><tr><th>Indicator</th><th class="c-trend">Trend</th><th class="num">Now</th><th class="num c-target">Target</th><th>Status</th></tr></thead>
        <tbody>${INDICATORS.filter((i) => ['impact', 'outcome'].includes(res(i.result).level)).map((i) => `
          <tr class="clickable" data-go="#/indicators?id=${i.id}" tabindex="0">
            <td class="c-title"><div style="font-weight:500;font-size:13.5px;line-height:1.3">${esc(i.title)}</div><div class="faint mono" style="font-size:11px;margin-top:2px">${i.id} · ${i.type === 'qual' ? 'Qualitative' : 'Quantitative'}</div></td>
            <td class="c-trend">${i.series ? sparkline(i.annualSeries ?? i.series, { colorVar: i.type === 'qual' ? '--voice' : '--obs', w: 72 }) : '<span class="faint mono" style="font-size:11px">Harvest log</span>'}</td>
            <td class="num">${fmtVal(i)}${i.partial ? '*' : ''}</td>
            <td class="num c-target">${i.target != null ? fmtVal(i, i.target) : '–'}</td>
            <td>${statusChip(i.status)}</td>
          </tr>`).join('')}</tbody>
      </table></div>
      <div class="chart-foot">* Q3 covers three of four districts. Tarn Valley has not reported.</div>
    </section>
    <div class="grid">
      <section class="glass card tl-host" aria-labelledby="tl-h">
        <div class="card__head"><div><div class="card__title" id="tl-h">Next eight weeks</div><div class="card__sub">Reviews, reporting dates and the budget calendar</div></div></div>
        <div class="tl">${TIMELINE.map((t) => `<div class="tl__item ${t.done ? 'done' : ''} ${t.today ? 'today' : ''} ${t.key ? 'key' : ''}"><div class="tl__dot"></div><div class="tl__date">${fmtDate(t.date)}</div><div class="tl__label">${esc(t.label)}</div>${t.note ? `<div class="tl__note">${esc(t.note)}</div>` : ''}</div>`).join('')}</div>
      </section>
      <section class="glass card" aria-labelledby="sp-h">
        <div class="card__head"><div><div class="card__title" id="sp-h">Evidence spectrum</div><div class="card__sub">What kind of evidence stands behind each outcome</div></div></div>
        ${['IMP', 'O1', 'O2', 'O3'].map((rid) => {
          const r = res(rid);
          const sp = r.indicators.map(ind).reduce((a, i) => { for (const k in i.spectrum) a[k] = (a[k] ?? 0) + i.spectrum[k]; return a; }, {});
          const thin = !sp.voice ? 'No participant voice' : !sp.observed ? 'No observed data' : '';
          return `<div style="display:grid;grid-template-columns:86px 1fr;gap:12px;align-items:center;padding:8px 0"><span class="cascade__lvl">${r.code.replace('Outcome ', 'Out. ')}</span><div>${spectrumBar(sp)}${thin ? `<div class="faint" style="font-size:11.5px;margin-top:4px;color:var(--watch)">${thin}</div>` : ''}</div></div>`;
        }).join('')}
        <div class="chart-foot"><span class="legend">${['observed', 'voice', 'document'].map((k) => `<span style="--c:var(${KINDS[k].var})"><i></i>${KINDS[k].label}</span>`).join('')}<span class="lg-agent"><i></i>Agent interpretation</span><span class="lg-gap"><i></i>Missing kind</span></span></div>
      </section>
    </div>
  </div>`;

  wireRows(v);
  wireDecisions(v);
};

function cascadeRows() {
  const levels = [['impact', 'Impact'], ['outcome', 'Outcomes'], ['output', 'Outputs']];
  return levels.map(([lvl, label]) => {
    const rs = RESULTS.filter((r) => r.level === lvl && vNum(r.since) <= (state.v4 ? 4 : 3));
    const counts = rs.reduce((a, r) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {});
    return `<div class="cascade__row"><span class="cascade__lvl">${label}</span>
      <div class="cascade__bar" role="img" aria-label="${label}: ${Object.entries(counts).map(([k, n]) => `${n} ${STATUS[k].label}`).join(', ')}">
        ${rs.map((r) => `<span class="b-${r.status}" title="${esc(r.code)}: ${STATUS[r.status].label}">${esc(r.code.replace('Outcome ', 'O').replace('Output ', '').replace('Impact', 'IMP'))}</span>`).join('')}
      </div>
      <span class="cascade__n">${Object.entries(counts).map(([k, n]) => `${n} ${k === 'on' ? 'on' : k === 'off' ? 'off' : k === 'watch' ? 'watch' : 'new'}`).join(' · ')}</span></div>`;
  }).join('');
}

function decisionCards() {
  const list = DECISIONS.filter((d) => !state.dismissed.has(d.id));
  return list.map((d) => {
    const done = (d.id === 'D1' && state.v4) || (d.id === 'D2' && state.fixed.has('c2')) || (d.id === 'D3' && state.requestSent);
    return `
    <article class="glass decision ${done ? '' : 'refract'}" style="${done ? 'opacity:.62' : ''}">
      <div class="decision__top">${statusChip(done ? 'on' : d.severity, '')}<span class="tag">${esc(d.kind)}</span></div>
      <h3 class="decision__title">${esc(d.title)}</h3>
      <p class="decision__body">${esc(d.body)}</p>
      <div class="decision__prop"><span class="eyebrow">${done ? 'Done' : 'Proposed'}</span>${esc(done ? doneText(d.id) : d.proposal)}</div>
      <div class="decision__srcs">${d.sources.map(srcChip).join('')}</div>
      <div class="faint" style="font-size:12px"><strong style="color:var(--ink-2)">Confidence ${esc(d.confidence)}.</strong> ${esc(d.limits)}</div>
      <div class="decision__foot">
        <span class="agentline">${mark('mk', 18)}${esc(d.agent)}</span><span style="flex:1"></span>
        ${done ? '' : `<button class="btn btn--sm btn--ghost" data-dismiss="${d.id}">Dismiss</button><a class="btn btn--sm btn--primary" href="${d.route}">${esc(d.action)}</a>`}
      </div>
    </article>`;
  }).join('') || '<div class="glass card faint">Nothing waiting. Agents will bring you new decisions as evidence arrives.</div>';
}
function doneText(id) {
  return { D1: 'Framework v4 approved and recorded in the Ledger.', D2: 'Claim rewritten in the Q3 report draft.', D3: 'Request sent to Ruth W. and logged.' }[id];
}
function wireDecisions(v) {
  $$('[data-dismiss]', v).forEach((b) => b.onclick = () => {
    state.dismissed.add(b.dataset.dismiss);
    log(ME.name, `Dismissed agent suggestion ${b.dataset.dismiss}`, 'Brief', 'Dismissed');
    $('#decisions').innerHTML = decisionCards();
    wireDecisions(v);
    renderNav('brief');
    toast('Dismissed. The suggestion and your decision are kept in the Ledger.');
  });
}
function wireRows(v) {
  $$('tr[data-go]', v).forEach((tr) => {
    tr.onclick = () => { location.hash = tr.dataset.go; };
    tr.onkeydown = (e) => { if (e.key === 'Enter') location.hash = tr.dataset.go; };
  });
}

/* ================================================================== FRAMEWORK */
const COLS = { activity: 20, output: 252, outcome: 544, impact: 836 };
const POS = {
  A1: 72, A2: 180, A3: 288, A4: 396, A5: 510, A6: 636,
  P11: 50, P12: 158, P21: 266, P22: 374, P23: 482, P31: 614,
  O1: 80, O2: 360, O3: 614, IMP: 300,
};

VIEWS.framework = (v, q) => {
  $('#title').textContent = 'Theory of Change';
  if (q.proposal) state.version = 'v4';
  const tab = q.tab ?? (window.matchMedia('(max-width: 700px)').matches && !q.proposal ? 'list' : 'map');
  v.innerHTML = `
    <div class="btnrow" style="margin-bottom:16px">
      <div class="seg" role="group" aria-label="View">
        <button aria-pressed="${tab === 'map'}" data-tab="map">Map</button>
        <button aria-pressed="${tab === 'list'}" data-tab="list">List</button>
        <button aria-pressed="${tab === 'studio'}" data-tab="studio">Draft from a concept note</button>
      </div>
    </div>
    <div id="fw"></div>`;
  $$('[data-tab]', v).forEach((b) => b.onclick = () => { location.hash = `#/framework?tab=${b.dataset.tab}`; });
  const fw = $('#fw', v);
  if (tab === 'list') return fwList(fw);
  if (tab === 'studio') return studio(fw);
  fwMap(fw);
};

function visible(r) {
  if (r.proposed && !(state.version === 'v4')) return false;
  return vNum(r.since) <= vNum(state.version);
}

function fwMap(fw) {
  const showProposal = state.version === 'v4' && !state.v4;
  fw.innerHTML = `
  ${showProposal ? proposalCard() : ''}
  <section class="glass toc-wrap" aria-label="Theory of change map">
    <div class="toc-bar">
      <div class="versions" role="group" aria-label="Framework version">
        ${VERSIONS.map((x) => `<button type="button" class="${x.proposed && !state.v4 ? 'proposed' : ''}" aria-pressed="${state.version === x.v}" data-v="${x.v}" title="${esc(x.note)}">${x.v}${x.proposed && !state.v4 ? ' · proposed' : ''}</button>`).join('')}
      </div>
      <span class="faint" style="font-size:12.5px" id="vnote">${esc(VERSIONS.find((x) => x.v === state.version).note)}</span>
      <span style="flex:1"></span>
      <span class="legend">
        <span style="--c:var(--on)"><i></i>Holding</span><span style="--c:var(--watch)"><i></i>Strained</span><span style="--c:var(--off)"><i></i>Contradicted</span><span style="--c:var(--nodata)"><i></i>Untested</span>
      </span>
    </div>
    <div class="toc-scroll"><div class="toc" id="toc">
      <span class="toc-col-label" style="left:${COLS.activity + 4}px">Activities</span>
      <span class="toc-col-label" style="left:${COLS.output + 4}px">Outputs</span>
      <span class="toc-col-label" style="left:${COLS.outcome + 4}px">Outcomes</span>
      <span class="toc-col-label" style="left:${COLS.impact + 4}px">Impact</span>
      <svg class="edges" id="edges"></svg>
      ${RESULTS.map((r) => nodeHtml(r)).join('')}
      <div id="assumes"></div>
    </div></div>
  </section>
  <p class="faint" style="font-size:12.5px;margin:12px 4px 0">Select any result or assumption badge to see the indicators and evidence behind it. The List tab shows the same framework as structured text.</p>`;

  $$('[data-v]', fw).forEach((b) => b.onclick = () => { state.version = b.dataset.v; fwMap(fw); });
  if (showProposal) wireProposal(fw);
  $$('.node', fw).forEach((n) => n.onclick = () => openResult(n.dataset.id));
  fitToc();
  requestAnimationFrame(() => drawEdges());
}

function nodeHtml(r) {
  const vis = visible(r);
  const sp = (r.indicators ?? []).map(ind).filter(Boolean).reduce((a, i) => { for (const k in i.spectrum) a[k] = (a[k] ?? 0) + i.spectrum[k]; return a; }, {});
  const c = { on: '--on', watch: '--watch', off: '--off', nodata: '--nodata' }[r.status] ?? '--nodata';
  const top = POS[r.id] - (tocCompact() && ['P31', 'A6', 'O3'].includes(r.id) ? 112 : 0);
  return `<button type="button" class="node node--${r.level} ${r.proposed && !state.v4 ? 'node--proposed' : ''} ${vis ? '' : 'is-hidden'}" data-id="${r.id}" style="left:${COLS[r.level]}px;top:${top}px;--c:var(${c})" aria-label="${esc(r.code)}: ${esc(r.title)}${r.status ? `, ${STATUS[r.status].label}` : ''}" ${vis ? '' : 'tabindex="-1" aria-hidden="true"'}>
    <div class="node__code">${esc(r.code)}${r.status ? '<span class="dot"></span>' : ''}</div>
    <div class="node__title">${esc(r.title)}</div>
    ${r.level !== 'activity' ? spectrumBar(sp, { showGap: true }) : ''}
  </button>`;
}

function drawEdges() {
  const toc = $('#toc');
  if (!toc) return;
  const svg = $('#edges');
  const host = $('#assumes');
  let paths = '';
  let badges = '';
  for (const [a, b, as] of LINKS) {
    const ra = res(a); const rb = res(b);
    if (!visible(ra) || !visible(rb)) continue;
    const na = toc.querySelector(`[data-id="${a}"]`);
    const nb = toc.querySelector(`[data-id="${b}"]`);
    const same = ra.level === rb.level;
    const x1 = same ? na.offsetLeft + na.offsetWidth / 2 : na.offsetLeft + na.offsetWidth;
    const y1 = same ? na.offsetTop + na.offsetHeight : na.offsetTop + na.offsetHeight / 2;
    const x2 = same ? nb.offsetLeft + nb.offsetWidth / 2 : nb.offsetLeft;
    const y2 = same ? nb.offsetTop : nb.offsetTop + Math.min(nb.offsetHeight / 2, 46);
    const mx = (x1 + x2) / 2;
    const asm = as ? ASSUMPTIONS[as] : null;
    const cls = [ra.proposed && !state.v4 ? 'proposed' : '', asm && vNum(state.version) >= (as === 'AS4' ? 3 : 1) ? asm.status : ''].join(' ');
    paths += same ? `<path class="edge ${cls}" d="M${x1},${y1} L${x2},${y2}"/>` : `<path class="edge ${cls}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
    if (asm && !(as === 'AS4' && vNum(state.version) < 3)) {
      const bx = (x1 + x2) / 2; const by = (y1 + y2) / 2;
      const st = state.version === 'v4' || asm.status !== 'contradicted' ? asm.status : 'contradicted';
      badges += `<button type="button" class="assume assume--${st}" style="left:${bx}px;top:${by}px" data-as="${as}" aria-label="Assumption ${asm.code}: ${esc(asm.text)}. ${STATUS[st].label}">${icon(STATUS[st].icon)}${asm.code}</button>`;
    }
  }
  svg.innerHTML = paths;
  host.innerHTML = badges;
  $$('[data-as]', host).forEach((b) => b.onclick = () => openAssumption(b.dataset.as));
}
// The map is drawn on a fixed 1080 x 760 canvas and scaled to fit its card, so it never scrolls sideways.
const TOC_W = 1080;
const tocCompact = () => !visible(res('P23'));
const tocH = () => (tocCompact() ? 648 : 760);
function fitToc() {
  const toc = $('#toc');
  if (!toc) return;
  const wrap = toc.parentElement;
  const s = Math.min(1.25, wrap.clientWidth / TOC_W);
  const left = Math.max(0, (wrap.clientWidth - TOC_W * s) / 2);
  toc.style.height = `${tocH()}px`;
  toc.style.transform = `translate(${left}px, 0) scale(${s})`;
  wrap.style.height = `${Math.ceil(tocH() * s)}px`;
}
window.addEventListener('resize', () => { if (current?.view === 'framework') fitToc(); });

function proposalCard() {
  const d = DECISIONS[0];
  return `<section class="glass card refract" style="margin-bottom:16px" aria-labelledby="prop-h">
    <div class="card__head"><div><div class="eyebrow" style="margin-bottom:6px">Proposed change · framework v4</div><div class="card__title" id="prop-h" style="font-size:19px">${esc(d.title)}</div></div><span class="spacer"></span><span class="agentline">${mark('mk', 18)}${esc(d.agent)}</span></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px">
      <div><div class="eyebrow" style="margin-bottom:8px">What changes</div>
        <div style="display:grid;gap:8px;font-size:13.5px">
          <div><span class="chip" style="color:var(--obs)">${icon('plus')}Add</span> Output 2.3: councils and the regional treasury set ceilings after citizen hearings</div>
          <div><span class="chip" style="color:var(--obs)">${icon('plus')}Add</span> Activity: pre-ceiling treasury dialogues, from February each year</div>
          <div><span class="chip" style="color:var(--off)">${icon('alert')}Mark</span> Assumption A3 as contradicted</div>
          <div><span class="chip">${icon('check')}Keep</span> Everything in v3. It stays readable in the Ledger.</div>
        </div>
      </div>
      <div><div class="eyebrow" style="margin-bottom:8px">Why, in the evidence</div>
        <p class="muted" style="font-size:13.5px">${esc(d.body)}</p>
        <div class="decision__srcs" style="margin-top:10px">${d.sources.map(srcChip).join('')}</div>
        <p class="faint" style="font-size:12px;margin-top:10px">Confidence ${esc(d.confidence)}. ${esc(d.limits)} Restricted note EV-047 was not read.</p>
      </div>
      <div><label class="eyebrow" for="why" style="display:block;margin-bottom:8px">Your reason, saved with the version</label>
        <textarea id="why" rows="4" style="width:100%;border-radius:14px;border:1px solid var(--line-2);background:var(--glass-2);padding:10px 12px;font-size:13.5px;resize:vertical">Treasury ceilings, not council willingness, limit Outcome 2. Kessa shows early engagement works. Test it in all four districts from the FY28 cycle.</textarea>
        <div class="btnrow" style="margin-top:10px"><button class="btn btn--primary" id="approve">${icon('check')}Approve as v4</button><button class="btn btn--ghost" id="reject">Not now</button></div>
        <p class="faint" style="font-size:11.5px;margin-top:8px">Demo: you hold M&amp;E Lead and approver rights. In a live workspace this goes to Daniel O.</p>
      </div>
    </div>
  </section>`;
}
function wireProposal(fw) {
  $('#approve', fw).onclick = () => {
    const why = $('#why', fw).value.trim();
    if (!why) { toast('Add a reason first. Every approved change records why.', 'alert'); return; }
    state.v4 = true; state.version = 'v4';
    VERSIONS[3].date = 'Nov 2026'; VERSIONS[3].approved = ME.name; VERSIONS[3].note = `Added Output 2.3 and its activity. A3 marked contradicted. Reason: ${why}`; VERSIONS[3].proposed = false;
    res('P23').proposed = false; res('A5').proposed = false;
    PROGRAMME.frameworkVersion = 'v4';
    log(ME.name, `Approved framework v4. Reason: ${why}`, 'Framework', 'Approved');
    toast('Framework v4 approved. v3 is kept unchanged and the change is in the Ledger.');
    renderNav('framework');
    fwMap(fw);
    $$('[data-id="P23"], [data-id="A5"]', fw).forEach((n) => n.classList.add('is-new'));
  };
  $('#reject', fw).onclick = () => { state.version = 'v3'; log(ME.name, 'Deferred framework v4 proposal', 'Framework', 'Deferred'); toast('Deferred. The proposal stays in the Ledger.'); fwMap(fw); };
}

function fwList(fw) {
  const tree = (parent, lvl) => RESULTS.filter((r) => r.level === lvl && (lvl === 'outcome' || r.parent === parent) && visible(r));
  const asmFor = (a, b) => { const l = LINKS.find((x) => x[0] === a && x[1] === b && x[2]); return l ? ASSUMPTIONS[l[2]] : null; };
  const item = (r) => `<div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><span class="tag">${esc(r.code)}</span><a href="#" data-open="${r.id}" class="d-link" style="text-decoration:none;font-weight:500">${esc(r.title)}</a>${r.status ? statusChip(r.status) : ''}${r.proposed && !state.v4 ? '<span class="chip" style="color:var(--obs)">Proposed</span>' : ''}</div>`;
  const indList = (r) => (r.indicators ?? []).map(ind).filter(Boolean).map((i) => `<li><a href="#/indicators?id=${i.id}" class="mono" style="font-size:12px">${i.id}</a> <span class="muted" style="font-size:13px">${esc(i.title)}</span></li>`).join('');
  fw.innerHTML = `<section class="glass card">
    <div class="card__head"><div><div class="card__title">Framework ${state.version} as a list</div><div class="card__sub">Impact, outcomes, outputs and activities, with indicators and assumptions</div></div></div>
    <ol style="list-style:none;padding:0;margin:0;display:grid;gap:18px">
      <li>${item(res('IMP'))}<ul style="margin:6px 0 0 18px;padding:0">${indList(res('IMP'))}</ul>
        <ol style="list-style:none;padding:0 0 0 22px;margin:14px 0 0;display:grid;gap:16px;border-left:1px solid var(--line)">
          ${tree(null, 'outcome').map((o) => {
            const a = asmFor(o.id, 'IMP');
            return `<li style="padding-left:14px">${item(o)}${a ? `<div class="faint" style="font-size:12.5px;margin-top:4px">Assumes (${a.code}): ${esc(a.text)} · ${STATUS[a.status].label}</div>` : ''}<ul style="margin:6px 0 0 18px;padding:0">${indList(o)}</ul>
              <ol style="list-style:none;padding:0 0 0 22px;margin:10px 0 0;display:grid;gap:10px;border-left:1px solid var(--line)">
              ${tree(o.id, 'output').map((p) => { const a2 = asmFor(p.id, o.id); return `<li style="padding-left:14px">${item(p)}${a2 ? `<div style="font-size:12.5px;margin-top:4px;color:var(--${a2.status === 'contradicted' ? 'off' : 'ink-3'})">Assumes (${a2.code}): ${esc(a2.text)} · ${STATUS[a2.status].label}</div>` : ''}<ul style="margin:6px 0 0 18px;padding:0">${indList(p)}${tree(p.id, 'activity').map((x) => `<li class="faint" style="font-size:13px">Activity: ${esc(x.title)}</li>`).join('')}</ul></li>`; }).join('')}
              </ol></li>`;
          }).join('')}
        </ol>
      </li>
    </ol></section>`;
  $$('[data-open]', fw).forEach((a) => a.onclick = (e) => { e.preventDefault(); openResult(a.dataset.open); });
}

/* ------------------------------------------------------------ studio */
function studio(fw) {
  fw.innerHTML = `<div class="studio">
    <section class="glass card">
      <div class="card__head"><div><div class="card__title">Concept note</div><div class="card__sub">Halden region proposal, page 2 (demo). Document text is treated as data, never as instructions.</div></div></div>
      <div class="note" id="note">${CONCEPT_NOTE.map((s) => `<p data-s="${s.id}" class="${s.hostile ? 'hostile' : ''}"><span class="sid">${s.id}</span>${esc(s.text)}</p>`).join('')}</div>
      <div class="btnrow" style="margin-top:16px"><button class="btn btn--primary" id="runDesign">${mark('mk', 18)}Draft a results chain</button><button class="btn btn--ghost" type="button" onclick="this.nextElementSibling.click()">${icon('upload')}Upload a document</button><input type="file" hidden accept=".pdf,.docx,.txt" id="up"></div>
    </section>
    <section class="glass card">
      <div class="card__head"><div><div class="card__title">Programme Design Agent</div><div class="card__sub">Each item is a draft. Accept, edit or reject it on its own.</div></div></div>
      <div id="draftOut"><div class="faint" style="font-size:13.5px;padding:24px 0">Run the agent to draft impact, outcomes, outputs, assumptions and indicators from the note. Hover a draft to see the sentences it came from.</div></div>
    </section></div>`;
  $('#up', fw).onchange = () => toast('Upload is simulated in this demo. The agent uses the sample note.', 'document');
  $('#runDesign', fw).onclick = () => runDesign(fw);
}

function runDesign(fw) {
  const out = $('#draftOut', fw);
  const steps = [
    ['', 'Read concept note: 7 sentences, 1 page'],
    ['warn', 'Sentence s6 contains an instruction. Treated as text and ignored.'],
    ['', 'Matched problem, intent and activities to result levels'],
    ['', 'Searched shared indicator library: 3 candidates'],
    ['warn', 'Gap: the note never says who sets budget ceilings'],
    ['ok', 'Draft ready: 7 items. Nothing saved yet.'],
  ];
  out.innerHTML = '<div class="trace" id="tr"></div><div id="items" style="display:grid;gap:10px;margin-top:12px"></div>';
  const tr = $('#tr', out);
  steps.forEach(([c, t], i) => setTimeout(() => { tr.insertAdjacentHTML('beforeend', `<div class="${c}" style="animation-delay:0s">${esc(t)}</div>`); }, 280 * i));
  setTimeout(() => {
    const items = $('#items', out);
    items.innerHTML = DRAFT.map((d, i) => `
      <div class="draft-item ${d.flag ? 'flag' : ''}" data-i="${i}" style="animation-delay:${i * 0.07}s">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="tag">${esc(d.level)}</span>${d.flag ? `<span class="chip status status--watch">${icon('eye')}Check this</span>` : ''}<span style="flex:1"></span>${d.src.map((s) => `<span class="srcchip" style="--c:var(--doc)"><i></i>${s}</span>`).join('')}</div>
        <div class="draft-item__text" style="font-size:14.5px;font-weight:500">${esc(d.text)}</div>
        <div class="faint" style="font-size:12.5px"><span class="chip kind kind--agent" style="height:20px;font-size:11px"><i></i>Agent rationale</span> ${esc(d.why)}</div>
        <div class="btnrow"><button class="btn btn--sm" data-act="accept">${icon('check')}Accept</button><button class="btn btn--sm btn--ghost" data-act="edit">${icon('edit')}Edit</button><button class="btn btn--sm btn--ghost" data-act="reject">Reject</button></div>
      </div>`).join('') + '<div class="btnrow" style="margin-top:6px"><button class="btn btn--primary" id="saveDraft" disabled>Save accepted items as a draft framework</button><span class="faint" id="draftCount" style="font-size:12.5px">0 accepted</span></div>';
    $$('.draft-item', items).forEach((el) => {
      const d = DRAFT[Number(el.dataset.i)];
      el.onmouseenter = () => d.src.forEach((s) => $(`[data-s="${s}"]`, fw)?.classList.add('lit'));
      el.onmouseleave = () => $$('.note p', fw).forEach((p) => p.classList.remove('lit'));
      $$('[data-act]', el).forEach((b) => b.onclick = () => {
        const act = b.dataset.act;
        const txt = $('.draft-item__text', el);
        if (act === 'edit') { txt.contentEditable = 'true'; txt.focus(); return; }
        txt.contentEditable = 'false';
        el.classList.toggle('accepted', act === 'accept');
        el.classList.toggle('rejected', act === 'reject');
        state.draft[el.dataset.i] = act;
        const n = Object.values(state.draft).filter((x) => x === 'accept').length;
        $('#draftCount', items).textContent = `${n} accepted`;
        $('#saveDraft', items).disabled = n === 0;
      });
    });
    $('#saveDraft', items).onclick = () => {
      const n = Object.values(state.draft).filter((x) => x === 'accept').length;
      log(ME.name, `Saved ${n} agent-drafted items as a draft framework (Halden concept)`, 'Draft framework', 'Draft');
      log('Programme Design Agent', 'Drafted 7 items from concept note. Ignored embedded instruction in s6.', 'Halden concept', 'Reviewed', true);
      toast(`${n} items saved as a draft framework with their sources. Nothing is approved yet.`);
    };
  }, 280 * steps.length + 150);
}

/* ------------------------------------------------------------ drawers */
function openDrawer(html) {
  const d = $('#drawer');
  d.innerHTML = html;
  d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('open');
  $('[data-close]', d)?.addEventListener('click', closeDrawer);
  setTimeout(() => $('[data-close]', d)?.focus(), 50);
}
function closeDrawer() {
  $('#drawer')?.classList.remove('open');
  $('#drawer')?.setAttribute('aria-hidden', 'true');
  $('#scrim')?.classList.remove('open');
}
const drawerHead = (eyebrow, title, chip = '') => `<div class="drawer__head"><div style="flex:1;min-width:0"><div class="eyebrow">${eyebrow}</div><h2 style="font-size:20px;margin-top:6px;line-height:1.25">${esc(title)}</h2>${chip ? `<div style="margin-top:10px">${chip}</div>` : ''}</div><button class="iconbtn" data-close aria-label="Close">${icon('close')}</button></div>`;

function openResult(id) {
  const r = res(id);
  const inds = (r.indicators ?? []).map(ind).filter(Boolean);
  const links = LINKS.filter((l) => (l[0] === id || l[1] === id) && l[2]).map((l) => ({ ...ASSUMPTIONS[l[2]], key: l[2] }));
  const evs = EVIDENCE.filter((e) => e.links.some((x) => inds.find((i) => i.id === x)));
  openDrawer(`${drawerHead(r.code, r.title, r.status ? statusChip(r.status) : '')}
    <div class="drawer__body">
      ${r.proposed && !state.v4 ? '<div class="callout" style="background:color-mix(in srgb,var(--obs) 8%,transparent);border-color:color-mix(in srgb,var(--obs) 30%,transparent)">Proposed in v4. Not part of the approved framework until someone approves it.</div>' : ''}
      ${r.level === 'activity' ? '<p class="muted">Activities are tracked through their output indicators.</p>' : ''}
      ${inds.length ? `<div><div class="eyebrow" style="margin-bottom:10px">Indicators</div>${inds.map((i) => `
        <a href="#/indicators?id=${i.id}" class="glass" style="display:grid;grid-template-columns:1fr auto;gap:8px;padding:14px;border-radius:16px;text-decoration:none;margin-bottom:8px">
          <div><div style="font-weight:500;font-size:13.5px">${esc(i.title)}</div><div class="faint mono" style="font-size:11px;margin-top:3px">${i.id} · now ${fmtVal(i)}${i.target != null ? ` · target ${fmtVal(i, i.target)}` : ''}</div><div style="margin-top:8px">${spectrumBar(i.spectrum)}</div></div>
          <div>${statusChip(i.status)}</div></a>`).join('')}</div>` : r.level !== 'activity' ? `<div class="callout">${icon('alert')}<div><strong>No indicator yet.</strong> Ask the Indicator Agent for a suggestion from the shared library.</div></div>` : ''}
      ${links.length ? `<div><div class="eyebrow" style="margin-bottom:10px">Assumptions on this link</div>${links.map((a) => `<button class="glass" style="width:100%;text-align:left;padding:14px;border-radius:16px;margin-bottom:8px;display:grid;gap:6px" data-asm="${a.key}"><div style="display:flex;gap:8px;align-items:center"><span class="tag">${a.code}</span>${statusChip(a.status)}</div><div style="font-size:13.5px">${esc(a.text)}</div></button>`).join('')}</div>` : ''}
      ${evs.length ? `<div><div class="eyebrow" style="margin-bottom:10px">Evidence (${evs.length})</div><div class="decision__srcs">${evs.map((e) => srcChip(e.id)).join('')}</div></div>` : ''}
    </div>`);
  $$('[data-asm]', $('#drawer')).forEach((b) => b.onclick = () => openAssumption(b.dataset.asm));
}

function openAssumption(key) {
  const a = ASSUMPTIONS[key];
  const evs = a.evidence.map(ev).filter(Boolean);
  openDrawer(`${drawerHead(`Assumption ${a.code}`, a.text, statusChip(a.status))}
    <div class="drawer__body">
      <p class="muted">${esc(a.note)}</p>
      ${evs.length ? evs.map((e) => e.restricted ? `<div class="restricted"><div style="display:flex;gap:8px;align-items:center">${icon('lock')}<strong>${e.id} · Restricted</strong></div><p class="faint" style="font-size:13px;margin-top:6px">Protection record. Visible to you as M&amp;E Lead; agents cannot read it and it is never used in drafts.</p></div>` : `
        <figure class="glass" style="margin:0;padding:18px;border-radius:18px">
          ${e.quote ? `<blockquote class="quote" style="margin:0;font-size:16px">${esc(e.quote)}</blockquote>` : `<div style="font-weight:500">${esc(e.title)}</div>`}
          <figcaption style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap">${kindChip(e.kind)}${srcChip(e.id)}<span class="faint" style="font-size:12px">${esc(e.title)}${e.at ? ` · ${esc(e.at)}` : ''}</span>${e.contrary ? '<span class="chip status status--on">Contrary case</span>' : ''}</figcaption>
        </figure>`).join('') : `<div class="callout">${icon('alert')}<div><strong>No evidence on this assumption.</strong> Nothing in the M&amp;E plan tests it. Add a method, for example a short reader survey on coalition reports.</div></div>`}
      ${key === 'AS3' && !state.v4 ? '<a class="btn btn--primary" href="#/framework?proposal=1">Review the proposed v4 change</a>' : ''}
    </div>`);
}

/* ================================================================== INDICATORS */
VIEWS.indicators = (v, q) => {
  const tab = q.tab ?? 'plan';
  $('#title').textContent = tab === 'library' ? 'Indicator Library' : 'Indicators';
  v.innerHTML = `
    <div class="btnrow" style="margin-bottom:16px">
      <div class="seg" role="group" aria-label="View"><button aria-pressed="${tab === 'plan'}" data-tab="plan">M&amp;E plan</button><button aria-pressed="${tab === 'library'}" data-tab="library">Shared library</button></div>
    </div><div id="ind"></div>`;
  $$('[data-tab]', v).forEach((b) => b.onclick = () => { location.hash = `#/indicators${b.dataset.tab === 'library' ? '?tab=library' : ''}`; });
  if (tab === 'library') return library($('#ind', v));
  plan($('#ind', v), q.id ?? 'O1-a');
};

function plan(host, selId) {
  const all = [...INDICATORS];
  if (state.agentIndicator) all.push({ id: 'P23-a', result: 'P23', type: 'mixed', status: 'nodata', title: 'Ceilings issued after citizen hearings (adapted from LIB-322)', unit: 'councils', current: null, target: 4, spectrum: {}, lastUpdate: null, draft: true });
  host.innerHTML = `
  <section class="glass card" style="padding:8px 8px 4px">
    <div class="tablewrap"><table class="data">
      <thead><tr><th>Indicator</th><th class="c-res">Result</th><th class="c-trend">Trend</th><th class="num c-base">Baseline</th><th class="num">Now</th><th class="num c-target">Target</th><th class="c-ev">Evidence</th><th>Status</th><th class="c-upd">Updated</th></tr></thead>
      <tbody>${all.map((i) => {
        const age = i.lastUpdate ? daysBetween(i.lastUpdate, TODAY) : null;
        return `<tr class="clickable" data-id="${i.id}" tabindex="0" aria-selected="${i.id === selId}">
          <td class="c-title"><div style="font-weight:500;font-size:13.5px;line-height:1.3">${esc(i.title)}</div><div class="faint mono" style="font-size:11px;margin-top:2px">${i.id} · ${i.type === 'qual' ? 'Qualitative' : i.type === 'mixed' ? 'Mixed' : 'Quantitative'}${i.draft ? ' · draft' : ''}<span class="c-upd-inline"${(i.overdue || i.partial) ? ' style="color:var(--watch)"' : ''}> · ${age != null ? `${age}d ago` : 'new'}${(i.overdue || i.partial) ? ', gap' : ''}</span></div></td>
          <td class="c-res"><span class="tag">${esc(res(i.result).code.replace('Outcome', 'Out.').replace('Output', 'Op.'))}</span></td>
          <td class="c-trend">${i.series ? sparkline(i.annualSeries ?? i.series, { colorVar: i.type === 'qual' ? '--voice' : '--obs' }) : ''}</td>
          <td class="num c-base">${i.baseline != null ? fmtVal(i, i.baseline) : '–'}</td>
          <td class="num" style="color:var(--ink)">${fmtVal(i)}${i.partial ? '*' : ''}</td>
          <td class="num c-target">${i.target != null ? fmtVal(i, i.target) : '–'}</td>
          <td class="c-ev" style="min-width:90px">${spectrumBar(i.spectrum ?? {})}</td>
          <td>${statusChip(i.status)}</td>
          <td class="mono c-upd" style="font-size:11.5px;white-space:nowrap;${(i.overdue || i.partial) ? 'color:var(--watch)' : ''}">${age != null ? `${age}d ago` : 'New'}${(i.overdue || i.partial) ? ' · gap' : ''}</td>
        </tr>`;
      }).join('')}</tbody></table></div>
  </section>
  <div id="detail" class="section-gap"></div>`;
  $$('tr[data-id]', host).forEach((tr) => {
    const pick = () => { history.replaceState(null, '', `#/indicators?id=${tr.dataset.id}`); $$('tr[data-id]', host).forEach((x) => x.setAttribute('aria-selected', x === tr)); detail($('#detail', host), tr.dataset.id); $('#detail', host).scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    tr.onclick = pick; tr.onkeydown = (e) => { if (e.key === 'Enter') pick(); };
  });
  detail($('#detail', host), selId, false);
}

function detail(host, id) {
  const i = ind(id);
  if (!i) { host.innerHTML = `<section class="glass card"><div class="card__title">P23-a · draft</div><p class="muted" style="margin-top:8px">Adapted from LIB-322. It joins the M&amp;E plan when framework v4 is approved and a baseline is collected in January.</p></section>`; return; }
  const r = res(i.result);
  const evs = EVIDENCE.filter((e) => e.links.includes(i.id));
  const needsRequest = (i.id === 'O1-a' || i.id === 'O3-a');
  host.innerHTML = `
  <section class="glass card refract" aria-labelledby="det-h">
    <div class="card__head" style="flex-wrap:wrap">
      <div style="flex:1;min-width:260px"><div class="eyebrow" style="margin-bottom:6px">${i.id} · ${esc(r.code)} · ${i.type === 'qual' ? 'Qualitative' : 'Quantitative'}</div><h2 id="det-h" style="font-size:22px;line-height:1.25;max-width:40ch">${esc(i.title)}</h2></div>
      <div class="btnrow">${statusChip(i.status)}<div class="seg" role="group" aria-label="Chart or table"><button aria-pressed="true" data-mode="chart">${icon('chart').replace('<svg', '<svg width="14" height="14"')} Chart</button>${i.byDistrict ? '<button aria-pressed="false" data-mode="district">By district</button>' : ''}<button aria-pressed="false" data-mode="table">${icon('table').replace('<svg', '<svg width="14" height="14"')} Table</button></div></div>
    </div>
    <div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:28px" class="det-grid">
      <div>
        <div id="viz"></div>
        <div class="chart-foot"><span>${esc(i.unitLabel ? `${i.unit === '%' ? 'Percent' : i.unit}, ${i.unitLabel}` : '')}${i.cadence ? ` · ${esc(i.cadence)}` : ''}</span><span class="spacer"></span><span>Source: ${esc(i.source)}</span></div>
        ${i.note ? `<p class="faint" style="font-size:12.5px;margin-top:6px">${esc(i.note)}</p>` : ''}
        <div class="glass" style="margin-top:16px;padding:14px 16px;border-radius:16px">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><span class="chip kind kind--observed"><i></i>Observed</span></div>
          <p style="font-size:14px">${observedLine(i)}</p>
          <div style="display:flex;gap:8px;align-items:center;margin:12px 0 6px"><span class="chip kind kind--agent"><i></i>Agent interpretation</span><span class="faint" style="font-size:11.5px">Indicator Agent · review before use</span></div>
          <p class="muted" style="font-size:14px">${interpretLine(i)}</p>
        </div>
        ${needsRequest ? requestBlock() : ''}
      </div>
      <div>
        <div class="eyebrow" style="margin-bottom:10px">Measurement plan</div>
        <dl class="kv">
          <dt>Definition</dt><dd>${esc(i.definition ?? '–')}</dd>
          <dt>Baseline → target</dt><dd>${i.baseline != null ? `${fmtVal(i, i.baseline)} → ${fmtVal(i, i.target)} by ${esc(i.targetBy)}` : 'Narrative target: substantiated changes in council practice'}</dd>
          <dt>Responsible</dt><dd>${esc(i.owner)}</dd>
          <dt>Frequency</dt><dd>${esc(i.cadence)}${i.reporting ? ` · reported ${esc(i.reporting.toLowerCase())}` : ''}</dd>
        </dl>
        <details class="more"><summary>Sources, methods, assumptions and data quality</summary>
          <dl class="kv">
            <dt>Data source</dt><dd>${esc(i.source)}</dd>
            <dt>Verification</dt><dd>${esc(i.mov ?? '–')}</dd>
            <dt>Method</dt><dd>${esc(i.method ?? '–')}</dd>
            <dt>Assumptions</dt><dd>${esc(i.assumptions ?? '–')}</dd>
            <dt>Risks</dt><dd>${esc(i.risks ?? '–')}</dd>
            <dt>Data quality</dt><dd>${esc(i.quality ?? '–')}</dd>
          </dl>
        </details>
        <div style="margin-top:20px"><div class="eyebrow" style="margin-bottom:10px">Evidence spectrum</div>${spectrumBar(i.spectrum, { lg: true })}
          <div class="legend" style="margin-top:10px">${Object.entries(i.spectrum).filter(([, n]) => n).map(([k, n]) => `<span style="--c:var(${KINDS[k].var})" class="${k === 'agent' ? 'lg-agent' : ''}"><i></i>${n} ${n === 1 ? KINDS[k].label.toLowerCase().replace(/s$/, '') : KINDS[k].label.toLowerCase()}</span>`).join('')}</div>
          ${!i.spectrum.voice ? '<p style="font-size:12.5px;color:var(--watch);margin-top:8px">No participant voice behind this number yet.</p>' : ''}
        </div>
        ${evs.length ? `<div style="margin-top:20px"><div class="eyebrow" style="margin-bottom:10px">Linked evidence</div><div class="decision__srcs">${evs.map((e) => srcChip(e.id)).join('')}</div></div>` : ''}
      </div>
    </div>
  </section>`;
  const viz = $('#viz', host);
  const draw = (mode) => {
    $$('[data-mode]', host).forEach((b) => b.setAttribute('aria-pressed', b.dataset.mode === mode));
    if (mode === 'table') return tableFor(viz, i);
    if (mode === 'district') return districtBars(viz, i.byDistrict, { unit: i.unit, target: i.target, rubric: i.rubric, max: i.rubric ? 4 : undefined, colorVar: i.type === 'qual' ? '--voice' : '--obs' });
    chartFor(viz, i);
  };
  $$('[data-mode]', host).forEach((b) => b.onclick = () => draw(b.dataset.mode));
  draw('chart');
  const rq = $('#sendReq', host);
  if (rq) rq.onclick = () => {
    state.requestSent = true;
    log(ME.name, 'Approved and sent data request to Ruth W. (Tarn Valley Q3 log)', 'O1-a, O3-a', 'Sent');
    toast('Request sent to Ruth W. with the log template. Logged in the Ledger.', 'send');
    renderNav('indicators');
    detail(host, id);
  };
  if (window.matchMedia('(max-width: 1000px)').matches) $('.det-grid', host).style.gridTemplateColumns = '1fr';
}

function requestBlock() {
  if (state.requestSent) return `<div class="callout" style="background:color-mix(in srgb,var(--on) 8%,transparent);border-color:color-mix(in srgb,var(--on) 30%,transparent)">${icon('check').replace('<svg', '<svg style="color:var(--on)"')}<div><strong>Request sent to Ruth W.</strong> Prism will update this chart when the Tarn Valley log arrives. Until then Q3 stays marked as three of four districts.</div></div>`;
  return `<div class="glass" style="margin-top:12px;padding:16px;border-radius:16px;border-style:dashed">
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="chip status status--watch">${icon('eye')}Data gap</span><span class="agentline">${mark('mk', 16)}Risk &amp; Performance Agent drafted this request</span></div>
    <p style="font-size:13.5px;margin-top:10px"><strong>To Ruth W.</strong> <span class="muted">Hi Ruth, the Q3 hearing log for Tarn Valley is 23 days past due. It feeds two indicators in the donor report due 15 November. The template is attached. Could you upload it by 8 November, or tell us what is blocking it?</span></p>
    <div class="btnrow" style="margin-top:12px"><button class="btn btn--primary btn--sm" id="sendReq">${icon('send')}Approve and send</button><span class="faint" style="font-size:12px">Nothing is sent until you approve.</span></div>
  </div>`;
}

function observedLine(i) {
  if (i.harvest) return `${i.harvest.substantiated} outcomes substantiated, ${i.harvest.pending} pending substantiation, ${i.harvest.notSubstantiated} rejected (single source).`;
  if (i.annualSeries) return `${i.annualSeries.join('%, ')}% across FY24 to FY26. Target ${i.target}% by FY27.`;
  if (i.rubric) return `Programme-wide level: ${i.rubric[i.current - 1]} (${i.current} of 4), up from ${i.rubric[i.baseline - 1]}. Kessa has reached ${i.rubric[2]}.`;
  const last = i.series.filter((x) => x != null).slice(-1)[0];
  const partial = i.partial ? ' Latest value covers three of four districts.' : '';
  const over = i.overdue ? ' The Q3 report is overdue.' : '';
  return `${fmtVal(i, last)} now, from ${fmtVal(i, i.baseline)} at baseline. Target ${fmtVal(i, i.target)} by ${i.targetBy}.${partial}${over}`;
}
function interpretLine(i) {
  const map = {
    'IMP-1': 'Change is real but slow: four points in a year, just outside the survey margin. At this pace the target is reached around 2029, not 2027. Perception follows funded priorities, so watch Outcome 2.',
    'O1-a': 'On pace for the 2027 target. The rise is steepest in Kessa and Oru Coast. Speaker share measures voice, not influence; the participation rubric is the better test of Outcome 1.',
    'O1-b': 'Participation has moved from tokenistic to consultative. Only Kessa is influential, and it is also the one council that moved money. That pattern supports the v4 proposal.',
    'O2-a': 'Off track. Three points in two cycles against a 21-point gap. Interviews point to ceilings set by the regional treasury before hearings, which training cannot change.',
    'O2-b': 'Four substantiated changes, mostly about transparency (publishing responses) rather than money. Useful, but not yet evidence of budget responsiveness.',
    'O3-a': 'Five of twelve reports. Pace is fine if Tarn Valley publishes. Nobody yet knows whether citizens read them (assumption A4 is untested).',
  };
  return map[i.id] ?? 'Output is on pace. Output progress shows delivery, not change in council behaviour.';
}

function chartFor(el, i) {
  if (i.harvest) {
    const h = i.harvest; const tot = h.substantiated + h.pending + h.notSubstantiated;
    el.innerHTML = `<div style="padding:24px 0 8px"><div style="display:flex;height:44px;border-radius:14px;overflow:hidden;gap:3px">
      <div style="flex:${h.substantiated};background:var(--voice);display:grid;place-items:center;color:#1b1b1b;font-weight:600;font-size:13px">${h.substantiated} substantiated</div>
      <div style="flex:${h.pending};background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--voice) 45%,transparent) 0 5px,transparent 5px 10px);border:1px dashed var(--voice);display:grid;place-items:center;font-size:12px">${h.pending} pending</div>
      <div style="flex:${h.notSubstantiated};background:var(--glass-3);display:grid;place-items:center;font-size:12px" class="faint">${h.notSubstantiated} rejected</div></div>
      <div class="faint" style="font-size:12px;margin-top:10px">${tot} outcomes harvested since Jan 2025. Each needs two independent sources.</div></div>`;
    return;
  }
  if (i.annualSeries) return annualBars(el, { labels: i.labels, values: i.annualSeries, target: i.target, baseline: i.baseline, title: i.title });
  const gap = {};
  if (i.partial) Object.assign(gap, {});
  if (i.overdue) Object.assign(gap, i.overdue);
  const lastIdx = PERIODS.length - 1;
  trendChart(el, {
    title: i.title, labels: PERIODS, values: i.series, target: i.target, baseline: i.baseline, unit: i.unit, band: i.band,
    colorVar: i.type === 'qual' ? '--voice' : '--obs', gapNotes: Object.keys(gap).length ? gap : null, partial: i.partial,
    rubric: i.rubric, yMax: i.rubric ? 4 : undefined, cadence: i.cadence, targetLabel: i.targetBy ? `by ${i.targetBy}` : '',
    paceTo: i.target != null && !i.rubric && i.status !== 'on' ? lastIdx + 0.001 : null,
  });
}

function tableFor(el, i) {
  const rows = i.annualSeries ? i.labels.map((l, k) => [l, `${i.annualSeries[k]}%`, '']) :
    i.harvest ? Object.entries(i.harvest).map(([k, n]) => [k, n, '']) :
    PERIODS.map((p, k) => [p, i.series[k] == null ? ((i.overdue && i.overdue[k]) ? 'No report (overdue)' : 'Not collected') : fmtVal(i, i.series[k]), (i.partial && i.partial[k]) ?? '']);
  el.innerHTML = `<div class="tablewrap"><table class="data"><caption class="sr-only">${esc(i.title)}</caption><thead><tr><th>Period</th><th class="num">Value</th><th>Note</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="mono" style="font-size:12px">${esc(r[0])}</td><td class="num">${esc(r[1])}</td><td class="faint" style="font-size:12.5px">${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>`;
}

function library(host) {
  const draw = () => {
    const ql = state.libQuery.toLowerCase();
    const items = LIBRARY.filter((l) => (state.libLevel === 'All' || l.level === state.libLevel) && (!ql || `${l.title} ${l.tags.join(' ')} ${l.definition}`.toLowerCase().includes(ql)));
    $('#libGrid', host).innerHTML = items.map((l) => `
      <article class="glass lib-card">
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="tag">${l.id}</span><span class="chip">${esc(l.level)}</span><span class="chip kind kind--${l.type === 'Qualitative' ? 'voice' : l.type === 'Mixed' ? 'document' : 'observed'}"><i></i>${esc(l.type)}</span></div>
        <h3 style="font-size:15.5px;font-weight:600;line-height:1.3">${esc(l.title)}</h3>
        <p class="muted" style="font-size:13px">${esc(l.definition)}</p>
        <p style="font-size:12.5px;color:var(--watch)">Limitation: ${esc(l.limits)}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${l.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:6px"><span class="faint" style="font-size:12px">${esc(l.source)} · used ${l.uses} times</span><span style="flex:1"></span>
          ${state.adapted.has(l.id) ? `<span class="chip status status--on">${icon('check')}Adapted</span>` : `<button class="btn btn--sm" data-adapt="${l.id}">${icon('copy')}Adapt</button>`}</div>
      </article>`).join('') || '<p class="faint">No indicators match. Try another word, or create a new indicator.</p>';
    $$('[data-adapt]', host).forEach((b) => b.onclick = () => {
      state.adapted.add(b.dataset.adapt);
      log(ME.name, `Adapted ${b.dataset.adapt} into Open Councils as a programme copy`, b.dataset.adapt, 'Draft');
      toast(`Programme copy of ${b.dataset.adapt} created as a draft. The shared original is unchanged.`, 'copy');
      draw();
    });
  };
  host.innerHTML = `
    <div class="btnrow" style="margin-bottom:16px">
      <label class="field">${icon('search')}<input id="libq" placeholder="Search 1,240 shared indicators (demo shows 7)" value="${esc(state.libQuery)}" aria-label="Search the library"></label>
      <div class="seg" role="group" aria-label="Result level">${['All', 'Impact', 'Outcome', 'Output'].map((l) => `<button aria-pressed="${state.libLevel === l}" data-lvl="${l}">${l}</button>`).join('')}</div>
    </div>
    <div class="lib" id="libGrid"></div>`;
  $('#libq', host).oninput = (e) => { state.libQuery = e.target.value; draw(); };
  $$('[data-lvl]', host).forEach((b) => b.onclick = () => { state.libLevel = b.dataset.lvl; $$('[data-lvl]', host).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); });
  draw();
}

/* ================================================================== EVIDENCE */
VIEWS.evidence = (v, q) => {
  $('#title').textContent = 'Evidence';
  const sel = q.id ?? 'EV-033';
  v.innerHTML = `
  <section class="glass card" aria-labelledby="mx-h">
    <div class="card__head" style="flex-wrap:wrap"><div style="flex:1;min-width:240px"><div class="card__title" id="mx-h">What people are telling us</div><div class="card__sub">Coded excerpts by theme and group, from 6 interviews and 4 focus groups. Colour shows whether the voices support or contradict the framework’s logic.</div></div>
      <span class="legend"><span style="--c:var(--on)"><i></i>Supports</span><span style="--c:var(--off)"><i></i>Contradicts</span><span style="--c:var(--watch)"><i></i>Mixed</span></span></div>
    <div class="tablewrap"><div class="matrix" role="table" aria-label="Themes by group">
      <div class="matrix__h" role="columnheader">Theme</div>${GROUPS.map((g, gi) => `<div class="matrix__h" role="columnheader"><span class="lg">${esc(g)}</span><span class="sh" aria-hidden="true">${['Women', 'Youth', 'Council', 'CSOs'][gi]}</span></div>`).join('')}
      ${THEMES.map((t) => `<div class="matrix__t" role="rowheader" title="${esc(t.desc)}">${esc(t.name)}<div class="faint m-desc" style="font-size:11.5px;font-weight:400">${esc(t.desc)}</div></div>${MATRIX[t.id].map(([n, s], gi) => `<div class="matrix__c" role="cell" data-s="${s}" style="--a:${Math.min(60, n * 6)}" aria-label="${esc(GROUPS[gi])}: ${n} excerpts${s ? `, ${s === '+' ? 'supports' : s === '-' ? 'contradicts' : 'mixed'}` : ''}">${n || '<span class="faint">·</span>'}${s ? `<small>${s}</small>` : ''}</div>`).join('')}`).join('')}
    </div></div>
    <div class="callout" style="margin-top:16px;background:color-mix(in srgb,var(--on) 7%,transparent);border-color:color-mix(in srgb,var(--on) 28%,transparent)">${icon('split').replace('<svg', '<svg style="color:var(--on)"')}<div><strong>Contrary case worth learning from.</strong> Only council officials and coalitions mention early engagement, and only in Kessa. It is the one place where a citizen priority was funded. <a href="#/evidence?id=EV-035">Open EV-035</a></div></div>
  </section>

  <div class="btnrow section-gap" style="margin:20px 0 12px">
    <div class="seg" role="group" aria-label="Filter evidence">${[['all', 'All'], ['observed', 'Data'], ['voice', 'Voice'], ['document', 'Documents']].map(([k, l]) => `<button aria-pressed="${state.evFilter === k}" data-f="${k}">${l}</button>`).join('')}</div>
    <span style="flex:1"></span><button class="btn btn--sm" id="addEv">${icon('plus')}Add evidence</button>
  </div>
  <div class="ev-layout">
    <section class="glass" style="padding:8px" aria-label="Evidence items"><div class="ev-list" id="evList"></div></section>
    <section class="glass card" id="evDetail" aria-live="polite" style="position:sticky;top:18px"></section>
  </div>`;
  const list = () => {
    const items = EVIDENCE.filter((e) => state.evFilter === 'all' || e.kind === state.evFilter);
    $('#evList', v).innerHTML = items.map((e) => `
      <button type="button" class="ev" data-id="${e.id}" aria-pressed="${e.id === sel}" style="--c:var(${KINDS[e.kind].var})">
        <span class="ev__ic">${icon(e.restricted ? 'lock' : e.kind === 'observed' ? 'data' : e.kind)}</span>
        <span><span class="ev__title">${esc(e.title)}</span><span class="ev__meta" style="display:block">${esc(e.meta)} · ${esc(e.district)}</span></span>
        <span style="display:grid;justify-items:end;gap:4px"><span class="ev__id">${e.id}</span>${e.restricted ? '<span class="chip status status--watch" style="height:20px;font-size:11px">Restricted</span>' : e.status === 'submitted' ? '<span class="chip" style="height:20px;font-size:11px">Submitted</span>' : e.contrary ? '<span class="chip status status--on" style="height:20px;font-size:11px">Contrary</span>' : ''}</span>
      </button>`).join('');
    $$('.ev', v).forEach((b) => b.onclick = () => {
      $$('.ev', v).forEach((x) => x.setAttribute('aria-pressed', x === b));
      history.replaceState(null, '', `#/evidence?id=${b.dataset.id}`);
      evDetail($('#evDetail', v), b.dataset.id);
      if (window.matchMedia('(max-width: 1180px)').matches) $('#evDetail', v).scrollIntoView({ behavior: 'smooth' });
    });
  };
  $$('[data-f]', v).forEach((b) => b.onclick = () => { state.evFilter = b.dataset.f; $$('[data-f]', v).forEach((x) => x.setAttribute('aria-pressed', x === b)); list(); });
  $('#addEv', v).onclick = () => toast('Field capture, Kobo and ODK sync come next. In this demo, evidence is pre-loaded.', 'upload');
  list();
  evDetail($('#evDetail', v), sel);
};

function evDetail(host, id) {
  const e = ev(id);
  if (!e) return;
  if (e.restricted) {
    host.innerHTML = `<div class="eyebrow">${e.id} · ${KINDS[e.kind].label}</div><h2 style="font-size:20px;margin:8px 0 16px">${esc(e.title)}</h2>
      <div class="restricted"><div style="display:flex;gap:8px;align-items:center">${icon('lock')}<strong>Restricted: protection</strong></div>
      <p class="muted" style="font-size:13.5px;margin-top:8px">This field note concerns the safety of named participants. It is visible only to the M&amp;E Lead and Programme Manager. Agents cannot read it, it is excluded from search and from every draft report, and each opening is logged.</p>
      <div class="btnrow" style="margin-top:14px"><button class="btn btn--sm" id="reveal">${icon('eye')}Open with reason</button></div></div>
      <dl class="kv" style="margin-top:18px"><dt>Filed by</dt><dd>${esc(e.by)}</dd><dt>Date</dt><dd>${fmtDate(e.date, { day: 'numeric', month: 'long', year: 'numeric' })}</dd><dt>Linked to</dt><dd>Assumption A1 (safety to speak)</dd></dl>`;
    $('#reveal', host).onclick = () => { log(ME.name, 'Opened restricted record EV-047. Reason: protection follow-up', 'EV-047', 'Access logged'); toast('Access logged in the Ledger. Content is not shown in this public demo.', 'lock'); };
    return;
  }
  host.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${kindChip(e.kind)}<span class="tag">${e.id}</span>${e.contrary ? '<span class="chip status status--on">Contrary case</span>' : ''}${e.status === 'submitted' ? '<span class="chip">Submitted · awaiting approval</span>' : ''}</div>
    <h2 style="font-size:20px;margin:12px 0 4px;line-height:1.3">${esc(e.title)}</h2>
    <div class="faint" style="font-size:13px">${esc(e.meta)}</div>
    ${e.quote ? `<blockquote class="quote" style="margin:22px 0 6px">${esc(e.quote)}</blockquote><div class="faint mono" style="font-size:11.5px">${e.kind === 'document' ? '' : 'Transcript '}${esc(e.at ?? '')}${e.kind === 'voice' ? ' · pseudonymised, quoted with consent' : ''}</div>` : ''}
    ${e.themes ? `<div style="margin-top:18px"><div class="eyebrow" style="margin-bottom:8px">Coded themes</div><div style="display:flex;gap:6px;flex-wrap:wrap">${e.themes.map((t) => `<span class="chip">${esc(THEMES.find((x) => x.id === t).name)}</span>`).join('')}</div></div>` : ''}
    <dl class="kv" style="margin-top:20px">
      <dt>District</dt><dd>${esc(e.district)}</dd>
      <dt>Collected</dt><dd>${fmtDate(e.date, { day: 'numeric', month: 'long', year: 'numeric' })} by ${esc(e.by)}</dd>
      <dt>Consent</dt><dd>${esc(e.consent)}</dd>
      <dt>Supports</dt><dd><div class="decision__srcs">${e.links.map(srcChip).join('')}</div></dd>
      <dt>Status</dt><dd>${e.status === 'approved' ? 'Approved for analysis and reporting' : 'Submitted. Not used in reports until approved.'}</dd>
    </dl>
    ${e.status === 'submitted' ? `<div class="btnrow" style="margin-top:16px"><button class="btn btn--primary btn--sm" id="approveEv">${icon('check')}Approve for analysis</button></div>` : ''}`;
  const ap = $('#approveEv', host);
  if (ap) ap.onclick = () => { e.status = 'approved'; log(ME.name, `Approved ${e.id} for analysis`, e.id, 'Approved'); toast(`${e.id} approved. Agents can now cite it.`); evDetail(host, id); };
}

/* ================================================================== REPORT */
VIEWS.report = (v, q) => {
  $('#title').textContent = 'Reports';
  const o1 = ind('O1-a'); const o2 = ind('O2-a');
  const C = (id, text) => `<span class="claim ${state.fixed.has(id) ? 'fixed' : ''}" data-claim="${id}" data-s="${state.fixed.has(id) ? 'supported' : REPORT_CLAIMS[id].status}" tabindex="0" role="button">${esc(state.fixed.has(id) ? REPORT_CLAIMS[id].fix : text)}</span><sup class="cite">${REPORT_CLAIMS[id].sources.length}</sup>`;
  v.innerHTML = `
  <div class="report-layout">
    <article class="paper ${state.check ? 'check-on' : ''}" id="paper" aria-label="Q3 2026 report draft">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:22px"><span class="draft-stamp">${icon('edit').replace('<svg', '<svg width="12" height="12"')} Draft · not for sharing</span><span class="faint mono" style="font-size:11px">Prepared ${fmtDate(TODAY, { day: 'numeric', month: 'long', year: 'numeric' })} from approved records only</span></div>
      <div class="eyebrow">${esc(PROGRAMME.full)}</div>
      <h1 style="margin-top:10px">Q3 2026 progress report</h1>
      <p class="muted" style="margin-top:12px">Reporting period July to September 2026 · Framework ${state.v4 ? 'v4' : 'v3'} · For the ${esc(PROGRAMME.funder)}</p>

      <h2>Key takeaways</h2>
      <ol class="takeaways">
        <li><span>${C('c1', 'Residents who say their council acts on community input rose to 31%, from 27% six months earlier.')}</span></li>
        <li><span>${C('c2', 'Women’s and youth participation more than doubled.')}</span></li>
        <li><span>${C('c3', 'Councils funded 12% of citizen priorities in FY26, far short of the 30% target.')}</span></li>
        <li><span>${C('c4', 'The barrier is treasury ceilings set before hearings, not council unwillingness.')}</span></li>
      </ol>

      <h2>KPI summary</h2>
      <div class="tablewrap"><table class="data"><thead><tr><th>Indicator</th><th class="num c-base">Baseline</th><th class="num">Now</th><th class="num">Target</th><th>Status</th></tr></thead><tbody>
        ${['IMP-1', 'O1-a', 'O1-b', 'O2-a', 'O3-a'].map(ind).map((i) => `<tr><td style="font-size:13.5px">${esc(i.title)}</td><td class="num c-base">${fmtVal(i, i.baseline)}</td><td class="num">${fmtVal(i)}${i.partial ? '*' : ''}</td><td class="num">${fmtVal(i, i.target)}</td><td>${statusChip(i.status)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="faint" style="font-size:12.5px;margin-top:8px">* Three of four districts. Tarn Valley’s Q3 log had not arrived when this draft was prepared.</p>

      <h2>1. Are women and youth being heard?</h2>
      <div class="figure"><div id="rf1"></div><div class="figure__cap">Figure 1. Women and youth as a share of budget-hearing speakers, Q4 2024 to Q3 2026, percent. Source: hearing attendance logs (EV-021). Hollow point: partial coverage.</div></div>
      <p class="interp">Speaker share has risen every quarter and is on pace for 40% by the end of 2027. Speaking is not the same as influence: on our participation rubric, three councils are “consultative” and only Kessa is “influential”.</p>
      <blockquote class="pquote">“Now they call on us first. Last year we sat at the back and nobody asked.”<footer class="faint">Women’s caucus member, Oru Coast focus group (EV-041)</footer></blockquote>

      <h2>2. Are councils acting on what they hear?</h2>
      <div class="figure"><div id="rf2"></div><div class="figure__cap">Figure 2. Citizen priorities that appear as funded lines in adopted budgets, FY24 to FY26, percent. Source: hearing register matched to adopted budgets.</div></div>
      <p class="interp">${C('c3', 'Councils funded 12% of citizen priorities in FY26, far short of the 30% target.')} ${C('c4', 'Interviews show that the regional treasury fixes each council’s ceiling in January, before any hearing.')} ${C('c5', 'Kessa is the exception: its mayor approached the treasury in February and the water allocation rose 18%.')}</p>
      <blockquote class="pquote">“We hear the priorities, but by the time the hearing happens the treasury has already set our ceilings.”<footer class="faint">Finance officer, Lowmarsh council (EV-033)</footer></blockquote>
      <h3>A warning sign</h3>
      <p>${C('c6', 'Young people are giving up on hearings because nothing changes.')}</p>

      <h2>3. What we are changing</h2>
      <div class="tablewrap"><table class="data"><thead><tr><th>Action</th><th>Owner</th><th>Due</th></tr></thead><tbody>
        <tr><td>${state.v4 ? 'Start pre-ceiling treasury dialogues in all four districts (framework v4, Output 2.3)' : 'Decide on adding Output 2.3: treasury ceilings set after hearings (proposed v4)'}</td><td>Daniel O.</td><td class="mono" style="font-size:12px">${state.v4 ? '14 Jan 2027' : '15 Nov 2026'}</td></tr>
        <tr><td>Interview regional treasury officials to test the ceiling finding</td><td>Joseph M.</td><td class="mono" style="font-size:12px">30 Nov 2026</td></tr>
        <tr><td>Check participation fatigue in the next round of youth forums</td><td>Amina K.</td><td class="mono" style="font-size:12px">15 Dec 2026</td></tr>
        <tr><td>Collect the Tarn Valley Q3 hearing log</td><td>Ruth W.</td><td class="mono" style="font-size:12px">8 Nov 2026</td></tr>
      </tbody></table></div>

      <h2>Appendix: definitions, methods and limits</h2>
      <p style="font-size:14px"><strong>Speaker share</strong> counts speakers who are women or aged 18 to 35 in signed hearing logs, 10% audited against recordings. <strong>Funded priorities</strong> are hearing priorities matched line by line to the adopted budget, double-coded. <strong>Perception</strong> comes from a stratified household survey of about 1,200 adults per wave, margin ±2.8 points.</p>
      <p style="font-size:14px"><strong>Limits.</strong> Q3 participation covers three of four districts. All interviews on budget ceilings are with council staff; treasury officials have not been interviewed. One restricted protection record was excluded from drafting by policy. Contribution, not attribution: other actors also influence councils.</p>
    </article>

    <aside class="side-rail" aria-label="Defensibility check">
      <section class="glass card refract">
        <div class="card__head"><div><div class="card__title">Defensibility check</div><div class="card__sub">Every claim traced to its evidence</div></div><span class="spacer"></span>
          <label style="display:inline-flex;gap:8px;align-items:center;font-size:12.5px;cursor:pointer"><input type="checkbox" id="chk" ${state.check ? 'checked' : ''} style="accent-color:var(--ink)"> Show</label></div>
        <div id="meter"></div>
        <div id="claimBox" style="margin-top:16px"></div>
      </section>
      <section class="glass card">
        <div class="eyebrow" style="margin-bottom:10px">Before this can be shared</div>
        <div id="gate"></div>
        <div class="btnrow" style="margin-top:14px"><button class="btn btn--primary" id="sendReview">${icon('send')}Send to Daniel O. for review</button><button class="btn btn--ghost" onclick="window.print()">${icon('print')}Print or PDF</button></div>
      </section>
    </aside>
  </div>`;

  trendChart($('#rf1', v), { title: o1.title, labels: PERIODS, values: o1.series, target: o1.target, baseline: o1.baseline, unit: '%', colorVar: '--obs', partial: o1.partial, targetLabel: 'by Q4 27', height: 240 });
  annualBars($('#rf2', v), { labels: o2.labels, values: o2.annualSeries, target: o2.target, baseline: o2.baseline });

  const refresh = () => {
    const counts = { supported: 0, context: 0, misleading: 0 };
    Object.keys(REPORT_CLAIMS).forEach((k) => { counts[state.fixed.has(k) ? 'supported' : REPORT_CLAIMS[k].status]++; });
    const tot = Object.keys(REPORT_CLAIMS).length;
    $('#meter', v).innerHTML = `<div class="meter">${[['supported', '--on'], ['context', '--watch'], ['misleading', '--off']].map(([k, c]) => counts[k] ? `<span style="flex:${counts[k]};background:var(${c})"></span>` : '').join('')}</div>
      <div class="legend" style="margin-top:10px"><span style="--c:var(--on)"><i></i>${counts.supported} supported</span><span style="--c:var(--watch)"><i></i>${counts.context} need context</span><span style="--c:var(--off)"><i></i>${counts.misleading} misleading</span></div>
      <p class="faint" style="font-size:12px;margin-top:8px">${tot} claims checked against approved records. Select an underlined sentence.</p>`;
    $('#gate', v).innerHTML = [
      [counts.misleading === 0, counts.misleading ? `${counts.misleading} misleading claim to fix` : 'No misleading claims'],
      [counts.context === 0, counts.context ? `${counts.context} claims need context (recommended)` : 'Every claim has context'],
      [true, 'Restricted evidence excluded'],
      [true, 'Every figure has a source note'],
    ].map(([ok, t]) => `<div style="display:flex;gap:10px;align-items:center;font-size:13.5px;padding:5px 0;color:${ok ? 'var(--ink-2)' : 'var(--ink)'}">${icon(ok ? 'check' : 'alert').replace('<svg', `<svg width="16" height="16" style="color:var(${ok ? '--on' : '--off'})"`)}${t}</div>`).join('');
    $('#sendReview', v).disabled = counts.misleading > 0;
  };
  const showClaim = (id) => {
    $$('.claim', v).forEach((c) => c.classList.toggle('active', c.dataset.claim === id));
    const c = REPORT_CLAIMS[id];
    const st = state.fixed.has(id) ? 'supported' : c.status;
    const label = { supported: ['on', 'Supported'], context: ['watch', 'Needs context'], misleading: ['off', 'Misleading'] }[st];
    $('#claimBox', v).innerHTML = `<div class="glass" style="padding:14px;border-radius:16px;animation:in .3s var(--ease) both">
      <span class="chip status status--${label[0]}">${icon(label[0] === 'on' ? 'check' : label[0] === 'watch' ? 'eye' : 'alert')}${label[1]}</span>
      <p style="font-size:13.5px;margin-top:10px">${esc(state.fixed.has(id) ? 'Rewritten. The claim now matches the evidence.' : c.note)}</p>
      <div class="decision__srcs" style="margin-top:10px">${c.sources.map(srcChip).join('')}</div>
      ${c.fix && !state.fixed.has(id) ? `<div style="margin-top:12px;padding:12px;border-radius:12px;border:1px dashed var(--line-2)"><span class="chip kind kind--agent" style="height:20px;font-size:11px"><i></i>Suggested rewrite</span><p style="font-size:13.5px;margin-top:8px">${esc(c.fix)}</p><div class="btnrow" style="margin-top:10px"><button class="btn btn--sm btn--primary" id="applyFix">Accept rewrite</button><button class="btn btn--sm btn--ghost" id="editFix">Edit</button></div></div>` : ''}
    </div>`;
    const ap = $('#applyFix', v);
    if (ap) ap.onclick = () => {
      state.fixed.add(id);
      log(ME.name, `Accepted Reporting Agent rewrite for claim ${id}`, 'Report Q3 2026', 'Accepted');
      toast('Rewrite accepted. The draft and Ledger are updated.');
      VIEWS.report(v, { claim: id });
      renderNav('report');
    };
    const ed = $('#editFix', v);
    if (ed) ed.onclick = () => { const p = ed.closest('div').previousElementSibling; p.contentEditable = 'true'; p.focus(); };
  };
  $$('.claim', v).forEach((c) => { c.onclick = () => showClaim(c.dataset.claim); c.onkeydown = (e) => { if (e.key === 'Enter') showClaim(c.dataset.claim); }; });
  $('#chk', v).onchange = (e) => { state.check = e.target.checked; $('#paper', v).classList.toggle('check-on', state.check); };
  $('#sendReview', v).onclick = () => { log(ME.name, 'Sent Q3 2026 report draft to Daniel O. for review', 'Report Q3 2026', 'In review'); toast('Sent to Daniel O. for review. It cannot be shared externally until he approves.', 'send'); };
  refresh();
  showClaim(q.claim && REPORT_CLAIMS[q.claim] ? q.claim : 'c2');
  if (q.claim) setTimeout(() => $(`[data-claim="${q.claim}"]`, v)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
};

/* ================================================================== LEDGER */
VIEWS.ledger = (v) => {
  $('#title').textContent = 'Ledger';
  let agentsOnly = false;
  const draw = () => {
    const rows = state.ledger.filter((l) => !agentsOnly || l.agent);
    $('#ledgerList', v).innerHTML = rows.map((l) => `
      <div class="ledger__row"><span class="ledger__t">${esc(l.t)}</span>
        <span class="avatar" style="width:30px;height:30px">${l.agent ? mark('mk', 18) : esc(l.who.split(' ').map((x) => x[0]).join('').slice(0, 2))}</span>
        <div><div class="ledger__what">${esc(l.what)}</div><div class="ledger__who">${esc(l.who)}${l.agent ? ' · agent v1.4 · provider adapter' : ''} · <span class="mono" style="font-size:11.5px">${esc(l.obj)}</span></div></div>
        <span class="chip">${esc(l.state)}</span></div>`).join('');
  };
  v.innerHTML = `<div class="lower lower--ledger">
    <section class="glass card">
      <div class="card__head"><div><div class="card__title">Every change, who made it and why</div><div class="card__sub">People and agents, in one append-only record</div></div><span class="spacer"></span>
        <div class="seg" role="group" aria-label="Filter"><button aria-pressed="true" data-a="0">All</button><button aria-pressed="false" data-a="1">Agents</button></div></div>
      <div class="ledger" id="ledgerList"></div>
    </section>
    <section class="glass card">
      <div class="card__head"><div><div class="card__title">Framework versions</div><div class="card__sub">Approved versions never change. New thinking makes a new version.</div></div></div>
      <div style="display:grid;gap:12px">${VERSIONS.map((x) => `<a href="#/framework" class="glass" data-ver="${x.v}" style="text-decoration:none;padding:14px 16px;border-radius:16px;display:grid;gap:6px;${x.proposed && !state.v4 ? 'border-style:dashed;border-color:var(--obs)' : ''}">
        <div style="display:flex;gap:8px;align-items:center"><span class="tag" style="color:var(--ink)">${x.v}</span><span class="faint" style="font-size:12.5px">${esc(x.date)}</span><span style="flex:1"></span>${x.approved ? `<span class="chip status status--on">${icon('check')}Approved</span>` : '<span class="chip" style="color:var(--obs)">Awaiting approval</span>'}</div>
        <div style="font-size:13.5px">${esc(x.note)}</div><div class="faint" style="font-size:12px">By ${esc(x.by)}${x.approved ? ` · approved by ${esc(x.approved)}` : ''}</div></a>`).join('')}</div>
    </section></div>`;
  $$('[data-a]', v).forEach((b) => b.onclick = () => { agentsOnly = b.dataset.a === '1'; $$('[data-a]', v).forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); });
  $$('[data-ver]', v).forEach((a) => a.onclick = () => { state.version = a.dataset.ver === 'v4' && !state.v4 ? 'v4' : a.dataset.ver; });
  draw();
};

/* ================================================================== AGENT DOCK */
const TASKS = {
  brief: [
    { id: 'week', icon: 'layers', t: 'Summarise what changed this week', d: 'From approved records only' },
    { id: 'risks', icon: 'alert', t: 'Flag emerging risks', d: 'Patterns across indicators and voices' },
  ],
  framework: [
    { id: 'gaps', icon: 'framework', t: 'Check this framework for gaps', d: 'Orphans, missing indicators, untested links' },
    { id: 'suggest', icon: 'indicators', t: 'Suggest an indicator for Output 2.3', d: 'From the shared library' },
  ],
  indicators: [
    { id: 'suggest', icon: 'indicators', t: 'Suggest an indicator for Output 2.3', d: 'From the shared library' },
    { id: 'gaps', icon: 'framework', t: 'Which results have no evidence?', d: 'Gaps in the evidence spectrum' },
  ],
  evidence: [
    { id: 'contrary', icon: 'split', t: 'Find cases that contradict our logic', d: 'Across interviews and focus groups' },
    { id: 'risks', icon: 'alert', t: 'Flag emerging risks', d: 'Patterns across indicators and voices' },
  ],
  report: [
    { id: 'check', icon: 'check', t: 'Check every claim in this draft', d: 'Against approved evidence' },
    { id: 'week', icon: 'layers', t: 'Draft talking points for Daniel', d: 'Three points, each sourced' },
  ],
  ledger: [
    { id: 'history', icon: 'ledger', t: 'Explain how the framework changed', d: 'v1 to today, with reasons' },
  ],
};

const RUNS = {
  week: {
    agent: 'Reporting Agent',
    trace: ['Scope: Open Councils, records you can see', 'Read 9 ledger events since 26 Oct', 'Skipped EV-047 (restricted)', 'Linked each point to a record'],
    title: 'This week in three points',
    body: '<ol style="margin:0;padding-left:18px;display:grid;gap:8px;font-size:13.5px"><li>Q3 hearing logs arrived from three districts; women and youth reached 34% of speakers. <a class="srcchip" href="#/evidence?id=EV-021" style="--c:var(--obs)"><i></i>EV-021</a></li><li>The learning review agreed to test early treasury engagement in Lowmarsh. <span class="srcchip">Ledger 25 Oct</span></li><li>A new Oru Coast interview repeats the ceiling finding, still awaiting approval. <a class="srcchip" href="#/evidence?id=EV-066" style="--c:var(--voice)"><i></i>EV-066</a></li></ol>',
    limits: 'Summary of records only. No new analysis.',
  },
  risks: {
    agent: 'Risk & Performance Agent',
    trace: ['Compared output and outcome trends', 'Scanned 47 coded excerpts', 'Weighted by source independence'],
    title: 'Two risks are emerging',
    body: '<div style="display:grid;gap:10px;font-size:13.5px"><div><strong>Participation fatigue.</strong> 7 of 11 youth excerpts in Lowmarsh contradict the logic. If attendance drops, O1-a will stall next quarter. <a class="srcchip" href="#/evidence?id=EV-042" style="--c:var(--voice)"><i></i>EV-042</a></div><div><strong>Perception lag.</strong> At four points a year, IMP-1 reaches 45% around 2029, not 2027. <a class="srcchip" href="#/indicators?id=IMP-1"><i></i>IMP-1</a></div></div>',
    limits: 'Fatigue rests on one focus group. Treat as a signal to check, not a finding.',
  },
  gaps: {
    agent: 'M&E Guidance Agent',
    trace: ['Walked 16 links in framework ' + 'v3', 'Checked each result for indicators and evidence kinds'],
    title: 'Three gaps in the framework',
    body: '<div style="display:grid;gap:10px;font-size:13.5px"><div><strong>A4 is untested.</strong> Nothing measures whether citizens read coalition reports, yet Outcome 3 depends on it.</div><div><strong>Impact has no participant voice.</strong> IMP-1 is survey-only. Add two questions to the next focus groups.</div><div><strong>Output 2.3 (proposed) has no indicator.</strong> I can suggest one.</div></div>',
    limits: 'Structural check only. Whether a link is plausible is your judgement.',
  },
  suggest: {
    agent: 'Indicator Agent',
    trace: ['Searched shared library for "budget ceilings"', '3 candidates; LIB-322 fits the result level', 'Adapted wording for Open Councils'],
    title: 'Ceilings issued after citizen hearings',
    body: '<p style="font-size:13.5px">Number of councils whose final ceiling is issued after that year’s citizen hearings, verified by treasury circulars. Mixed method: document check plus one interview per council. Baseline 0 of 4 (FY26 circular, p. 4). <a class="srcchip" href="#/evidence?id=EV-052" style="--c:var(--doc)"><i></i>EV-052</a></p><p class="faint" style="font-size:12.5px;margin-top:8px">Adapted from LIB-322. The shared original stays unchanged.</p>',
    limits: 'LIB-322 is still under curation review in the shared library.',
    accept: () => { state.agentIndicator = true; state.adapted.add('LIB-322'); log(ME.name, 'Accepted Indicator Agent suggestion P23-a (from LIB-322) as draft', 'P23-a', 'Draft'); toast('Added P23-a as a draft indicator. It joins the plan when v4 is approved.'); if (current.view === 'indicators') go(); },
  },
  contrary: {
    agent: 'Qualitative Research Agent',
    trace: ['Compared stances across 4 groups', 'Kessa diverges on theme T5', 'Checked budget document for corroboration'],
    title: 'Kessa breaks the pattern, and it is corroborated',
    body: '<p style="font-size:13.5px">Kessa’s planning officer credits an early approach to the treasury for an 18% water increase. The adopted budget confirms the increase on p. 31. This is the one funded priority in the programme. <a class="srcchip" href="#/evidence?id=EV-035" style="--c:var(--voice)"><i></i>EV-035</a> <a class="srcchip" href="#/evidence?id=EV-055" style="--c:var(--doc)"><i></i>EV-055</a></p>',
    limits: 'One case. It shows something is possible, not that it will work everywhere.',
  },
  check: {
    agent: 'Reporting Agent',
    trace: ['Extracted 6 claims from the draft', 'Recomputed every figure from records', 'Checked coverage and comparison periods'],
    title: 'One claim is misleading',
    body: '<p style="font-size:13.5px">“More than doubled” is wrong (18% to 34%) and hides that Q3 covers three districts. Two more claims need a limit stated. Everything else matches the records.</p>',
    limits: 'Arithmetic, coverage and source checks. Tone and framing remain your call.',
    acceptLabel: 'Show me', accept: () => { location.hash = '#/report?claim=c2'; toggleDock(false); },
  },
  history: {
    agent: 'M&E Guidance Agent',
    trace: ['Read 3 approved versions and 1 proposal'],
    title: 'From proposal to evidence-led framework',
    body: '<ol style="margin:0;padding-left:18px;display:grid;gap:8px;font-size:13.5px"><li><strong>v1</strong>: the funded proposal.</li><li><strong>v2</strong>: added a rubric because counting speakers measured voice, not influence.</li><li><strong>v3</strong>: added outcome harvesting and logged A4 as untested.</li><li><strong>v4 (proposed)</strong>: responds to interviews showing the treasury, not councils, sets the limits.</li></ol>',
    limits: 'Taken from version notes written by the approvers.',
  },
};

let dockOpen = false;
function toggleDock(force) {
  dockOpen = force ?? !dockOpen;
  $('#dock').classList.toggle('open', dockOpen);
  $('#orb').setAttribute('aria-expanded', dockOpen);
  if (dockOpen) setTimeout(() => $('#dock .task')?.focus(), 80);
}
function renderDock() {
  const view = current?.view ?? 'brief';
  const tasks = TASKS[view] ?? TASKS.brief;
  const page = NAV.find((n) => n.id === view)?.label ?? 'Brief';
  $('#dock').innerHTML = `
    <div class="dock__head">${mark('mk', 30)}<div style="flex:1"><div style="font-weight:600">Prism agents</div><div class="dock__ctx">${PROGRAMME.name} · ${page} · your permissions</div></div><button class="iconbtn" aria-label="Close agents" id="dockClose">${icon('close')}</button></div>
    <div class="dock__body" id="dockBody">
      <div class="eyebrow">Suggested for this page</div>
      ${tasks.map((t) => `<button class="task" data-run="${t.id}"><span class="task__ic">${icon(t.icon)}</span><span><span class="task__t">${esc(t.t)}</span><span class="task__d" style="display:block">${esc(t.d)}</span></span></button>`).join('')}
      <p class="faint" style="font-size:12px;margin-top:4px">Agents read only what you can see. They prepare; you decide. Restricted records are never read.</p>
    </div>
    <form class="dock__input" id="dockForm"><input id="dockQ" placeholder="Ask about Open Councils…" aria-label="Ask the agents"><button class="iconbtn" aria-label="Send">${icon('send')}</button></form>`;
  $('#dockClose').onclick = () => toggleDock(false);
  $$('[data-run]', $('#dock')).forEach((b) => b.onclick = () => run(b.dataset.run));
  $('#dockForm').onsubmit = (e) => {
    e.preventDefault();
    const qv = $('#dockQ').value.toLowerCase();
    const pick = /risk|worr|problem/.test(qv) ? 'risks' : /indicator|measure/.test(qv) ? 'suggest' : /claim|report|check/.test(qv) ? 'check' : /contra|differ|kessa/.test(qv) ? 'contrary' : /gap|missing/.test(qv) ? 'gaps' : /change|history|version/.test(qv) ? 'history' : 'week';
    run(pick, $('#dockQ').value);
  };
}
function run(id, asked) {
  const r = RUNS[id];
  const body = $('#dockBody');
  body.innerHTML = `${asked ? `<div style="align-self:flex-end;max-width:85%;padding:10px 14px;border-radius:16px 16px 4px 16px;background:var(--glass-3);font-size:13.5px">${esc(asked)}</div>` : ''}
    <div class="agentline">${mark('mk', 18)}${esc(r.agent)} is working</div><div class="trace" id="dtr"></div><div id="dout"></div>`;
  r.trace.forEach((t, i) => setTimeout(() => $('#dtr')?.insertAdjacentHTML('beforeend', `<div class="${/Skipped|restricted/.test(t) ? 'warn' : ''}">${esc(t)}</div>`), 260 * i));
  setTimeout(() => {
    const out = $('#dout');
    if (!out) return;
    out.innerHTML = `<div class="suggest">
      <div style="display:flex;gap:8px;align-items:center"><span class="chip kind kind--agent"><i></i>Agent output · draft</span></div>
      <div style="font-weight:600;font-size:15px">${esc(r.title)}</div>${r.body}
      <div class="faint" style="font-size:12px">Limits: ${esc(r.limits)}</div>
      <div class="btnrow"><button class="btn btn--sm btn--primary" id="dAccept">${esc(r.acceptLabel ?? 'Accept')}</button><button class="btn btn--sm btn--ghost" id="dEdit">Edit</button><button class="btn btn--sm btn--ghost" id="dDismiss">Dismiss</button></div>
    </div><button class="btn btn--sm btn--ghost" id="dBack" style="align-self:flex-start">${icon('left')}Other tasks</button>`;
    log(r.agent, `Ran "${r.title}"`, PROGRAMME.name, 'Awaiting review', true);
    $('#dAccept').onclick = () => { if (r.accept) r.accept(); else { log(ME.name, `Accepted agent output: ${r.title}`, PROGRAMME.name, 'Accepted'); toast('Saved to your notes with its sources. No programme record was changed.'); } };
    $('#dEdit').onclick = () => { const s = $('.suggest'); s.contentEditable = 'true'; s.focus(); };
    $('#dDismiss').onclick = () => { log(ME.name, `Dismissed agent output: ${r.title}`, PROGRAMME.name, 'Dismissed'); renderDock(); };
    $('#dBack').onclick = renderDock;
  }, 260 * r.trace.length + 200);
}

/* ================================================================== PALETTE */
function paletteItems() {
  return [
    ...NAV.map((n) => ({ label: n.label, tag: 'Page', href: `#/${n.id}` })),
    { label: 'Indicator Library', tag: 'Page', href: '#/indicators?tab=library' },
    { label: 'Draft a framework from a concept note', tag: 'Action', href: '#/framework?tab=studio' },
    ...RESULTS.filter((r) => r.level !== 'activity').map((r) => ({ label: `${r.code}: ${r.title}`, tag: 'Result', href: '#/framework?tab=list' })),
    ...INDICATORS.map((i) => ({ label: i.title, tag: i.id, href: `#/indicators?id=${i.id}` })),
    ...EVIDENCE.map((e) => ({ label: e.restricted ? `${e.id} · Restricted record` : e.title, tag: e.id, href: `#/evidence?id=${e.id}` })),
    ...THEMES.map((t) => ({ label: `Theme: ${t.name}`, tag: 'Theme', href: '#/evidence' })),
  ];
}
let palSel = 0;
function openPalette() {
  $('#paletteScrim').classList.add('open');
  const inp = $('#paletteInput');
  inp.value = ''; palSel = 0; drawPalette('');
  inp.focus();
  inp.oninput = () => { palSel = 0; drawPalette(inp.value); };
  inp.onkeydown = (e) => {
    const items = $$('.palette__item');
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(items.length - 1, palSel + 1); drawPalette(inp.value); }
    if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); drawPalette(inp.value); }
    if (e.key === 'Enter') { items[palSel]?.click(); }
  };
}
function drawPalette(qv) {
  const ql = qv.toLowerCase().trim();
  const items = paletteItems().filter((x) => !ql || `${x.label} ${x.tag}`.toLowerCase().includes(ql)).slice(0, 12);
  $('#paletteList').innerHTML = items.map((x, k) => `<button class="palette__item" role="option" aria-selected="${k === palSel}" data-href="${x.href}">${esc(x.label)}<span class="tag">${esc(x.tag)}</span></button>`).join('') || '<div class="faint" style="padding:16px">Nothing found in records you can see.</div>';
  $$('.palette__item').forEach((b) => b.onclick = () => { closePalette(); location.hash = b.dataset.href; });
}
function closePalette() { $('#paletteScrim')?.classList.remove('open'); }

/* ================================================================== boot */
shell();
window.addEventListener('hashchange', go);
go();
