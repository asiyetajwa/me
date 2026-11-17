// Renders Everhome film frames on a virtual clock (1536x864 @1.25 = 1920x1080, 30 fps).
// node render.js <baseUrl> <outDir> <fromScene> <toScene>
// Every page timer, rAF, CSS animation and transition runs on window.__vt, so the
// result is smooth however slowly a frame renders. Frames are named by global frame index.
const { chromium } = require('playwright');
const fs = require('fs');
const { scenes, FPS } = require('./timeline.js');

const [base, outDir, from = 's01', to = 's12'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const { scenes: S } = scenes();
const PAGES = { landing: `${base}/index.html`, app: `${base}/app/index.html?film` };

const SHIM = `(() => {
  let vt = 0; const base = Date.now(); let tid = 1; const timers = new Map(); let rafs = [];
  performance.now = () => vt; Date.now = () => base + vt;
  window.setTimeout = (fn, ms = 0, ...a) => { const id = tid++; timers.set(id, { at: vt + Math.max(0, +ms || 0), fn: () => fn(...a) }); return id; };
  window.clearTimeout = (id) => { timers.delete(id); };
  window.setInterval = (fn, ms = 0, ...a) => { const id = tid++; const e = { at: vt + ms, fn: () => { e.at += Math.max(1, ms); timers.set(id, e); fn(...a); } }; timers.set(id, e); return id; };
  window.clearInterval = window.clearTimeout;
  window.requestAnimationFrame = (cb) => { const id = tid++; rafs.push({ id, cb }); return id; };
  window.cancelAnimationFrame = (id) => { rafs = rafs.filter((r) => r.id !== id); };
  const sync = () => document.getAnimations().forEach((a) => { if (a.__t0 === undefined) { a.__t0 = vt; a.pause(); } a.currentTime = vt - a.__t0; });
  window.__advance = (dt) => {
    const target = vt + dt;
    for (;;) { let n = null; for (const [id, t] of timers) if (t.at <= target && (!n || t.at < n[1].at)) n = [id, t]; if (!n) break; vt = Math.max(vt, n[1].at); timers.delete(n[0]); try { n[1].fn(); } catch (e) { console.error('timer', e.message); } sync(); }
    vt = target;
    const r = rafs; rafs = []; r.forEach((x) => { try { x.cb(vt); } catch (e) { console.error('raf', e.message); } });
    sync();
  };
})();`;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-vsync'] });
  const iFrom = S.findIndex((s) => s.id === from), iTo = S.findIndex((s) => s.id === to);
  let page = null, pageKind = null, client = null;
  const t0 = Date.now();
  for (let i = 0; i <= iTo; i++) {
    const sc = S[i];
    const capture = i >= iFrom;
    if (sc.page !== pageKind) {
      if (!capture && sc.page !== S[iFrom].page) continue; // a different page we never film from here
      await page?.close();
      page = await browser.newPage({ viewport: { width: 1536, height: 864 }, deviceScaleFactor: 1.25 });
      page.on('pageerror', (e) => console.log('PAGEERR', e.message));
      page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
      await page.addInitScript(SHIM);
      await page.goto(PAGES[sc.page]);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      for (let k = 0; k < 10; k++) await page.evaluate(() => window.__advance(1000 / 30)); // settle
      client = await page.context().newCDPSession(page);
      pageKind = sc.page;
    }
    const f0 = Math.round(sc.start * FPS), n = Math.round((sc.start + sc.dur) * FPS) - f0; // contiguous across scenes
    const cues = [...sc.cues].sort((a, b) => a[0] - b[0]);
    let ci = 0;
    for (let f = 0; f < n; f++) {
      const t = f / FPS;
      while (ci < cues.length && cues[ci][0] <= t + 1e-6) { const code = cues[ci][1]; await page.evaluate((c) => { try { (0, eval)(c); } catch (e) { console.error('cue', e.message, c); } }, code); ci++; }
      await page.evaluate(() => window.__advance(1000 / 30));
      if (!capture) continue;
      const shot = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1536, height: 864, scale: 1.25 } });
      fs.writeFileSync(`${outDir}/f${String(f0 + f).padStart(6, '0')}.jpg`, Buffer.from(shot.data, 'base64'));
      if (f % 60 === 0) console.log(sc.id, f, '/', n, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  await browser.close();
  console.log('DONE', from, to, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
