// Icons, the Prism mark and small DOM helpers.

const P = {
  brief: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
  framework: '<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 6h4l4 6M7 18h4l4-6"/>',
  indicators: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  evidence: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  report: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  ledger: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  library: '<path d="M4 19V5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 1-2-2zm0 0a2 2 0 0 1 2-2h11"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>',
  gap: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  data: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  voice: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  document: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  quote: '<path d="M7 7h4v4H8a1 1 0 0 0-1 1v3M14 7h4v4h-3a1 1 0 0 0-1 1v3"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  split: '<path d="M4 12h6M10 12l10-7M10 12l10 0M10 12l10 7"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
};

export function icon(name, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] ?? ''}</svg>`;
}

// The Prism mark: three lenses, one per evidence kind, converging on a clear core.
let markN = 0;
export function mark(cls = 'mk', size = 28) {
  const u = `m${++markN}`;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <radialGradient id="${u}a" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#d6f0ff"/><stop offset="1" stop-color="#5fb6ef"/></radialGradient>
      <radialGradient id="${u}b" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffe2cf"/><stop offset="1" stop-color="#ff9a66"/></radialGradient>
      <radialGradient id="${u}c" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ecdfff"/><stop offset="1" stop-color="#a07ef0"/></radialGradient>
    </defs>
    <g class="mk-blend">
      <circle cx="15" cy="15" r="10.5" fill="url(#${u}a)" opacity=".85"/>
      <circle cx="25" cy="15" r="10.5" fill="url(#${u}b)" opacity=".85"/>
      <circle cx="20" cy="24" r="10.5" fill="url(#${u}c)" opacity=".85"/>
    </g>
    <circle cx="20" cy="18" r="3.4" fill="#fff"/>
  </svg>`;
}

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmtDate(iso, opts = { day: 'numeric', month: 'short' }) {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('en-GB', opts);
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
}

export function toast(msg, ic = 'check') {
  const host = $('#toasts');
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = `${icon(ic)}<span>${msg}</span>`;
  host.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .4s, transform .4s'; t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; }, 4200);
  setTimeout(() => t.remove(), 4700);
}
