// Everhome film: scenes, their narration clips, and on-screen cues (seconds from scene start).
// Each scene lasts LEAD + clip + TAIL (+ extra). The renderer and the mixer both read this file.
const fs = require('fs');
const path = require('path');

const LEAD = 0.5, TAIL = 0.6, FPS = 30;
const VO = process.env.VO_DIR;
const dur = (id) => Number(require('child_process').execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(VO, `everhome-${id}.mp3`)]).toString().trim());

// tap(t, sel, action): glide the cursor to sel, press, then run action (or a real click)
const tap = (t, sel, action = null, ms = 900) => [
  [t, `EH.cursorTo(${JSON.stringify(sel)}, { ms: ${ms} })`],
  [t + ms / 1000 + 0.05, `document.querySelector('#cursor').classList.add('down')`],
  [t + ms / 1000 + 0.22, `document.querySelector('#cursor').classList.remove('down'); ${action ?? `document.querySelector(${JSON.stringify(sel)}).click()`}`],
];
const glide = (t, sel, ms = 900) => [[t, `EH.cursorTo(${JSON.stringify(sel)}, { ms: ${ms} })`]];

function scenes() {
  const S = [
    { id: 's01', page: 'landing', cues: [
      [0, `const h=document.querySelector('.hero'); h.style.transformOrigin='70% 50%'; h.style.transition='transform 11s cubic-bezier(.3,0,.3,1)'; requestAnimationFrame(()=>{h.style.transform='scale(1.045)'})`],
    ], extra: 0.4 },
    { id: 's02', page: 'app', cues: [
      [0, `EH.side(true); EH.go('lang'); EH.word('Talk', 'English, Somali or Spanish. Big buttons, or just call.'); EH.cursorHide(true)`],
      [5.0, `EH.cursorHide(false)`],
      ...tap(5.4, '.lang[data-lang="en"]', `EH.pickLang('en')`, 1100),
    ] },
    { id: 's03', page: 'app', cues: [
      [0, `EH.go('talk', { play: true }); EH.word('Talk', 'Ever fills in the booking as Amina speaks.')`],
      ...glide(8.2, '.dock .btn-primary'),
    ] },
    { id: 's04', page: 'app', cues: [
      [0, `EH.go('consent'); EH.word('Consent', 'Two separate choices, in plain words.')`],
      ...tap(2.4, '.toggle[data-t="photo"]', `EH.toggle('photo', true)`),
      ...tap(4.2, '.toggle[data-t="health"]', `EH.toggle('health', true)`, 700),
      [8.6, `EH.reveal('#vsign')`],
      ...glide(10.4, '#agree'),
    ] },
    { id: 's05', page: 'app', cues: [
      [0, `EH.go('plan'); EH.word('Choose', 'Every price is one-time. Switch any time.')`],
      ...glide(2.6, '.opt[data-opt="a"]'),
      ...tap(6.0, '.opt[data-opt="b"]'),
      ...tap(9.6, '.opt[data-opt="a"]'),
      ...glide(11.4, '#pay'),
    ] },
    { id: 's06', page: 'app', cues: [
      [0, `EH.go('scan', { play: true }); EH.word('Scan', 'About a minute a room. Measured and flagged live.'); EH.cursorHide(true)`],
    ] },
    { id: 's07', page: 'app', cues: [
      [0, `EH.word(''); EH.side(false); EH.console(true); EH.cursorHide(false)`],
      ...tap(1.6, '#turn-in', `EH.editTurning()`),
      ...tap(4.6, '#approve'),
    ] },
    { id: 's08', page: 'app', cues: [
      [0, `EH.console(false); EH.side(true); EH.go('home'); EH.word('See', 'Five fall risks, ranked and priced.'); EH.cursorHide(true)`],
      [3.2, `EH.focusHazard('tub')`], [4.8, `EH.focusHazard('stairs')`], [6.3, `EH.focusHazard('rug')`],
    ] },
    { id: 's09', page: 'app', cues: [
      [0, `EH.focusHazard(null); EH.word('Fix', 'The same home, after the work.'); EH.cursorHide(false)`],
      ...tap(0.0, '.seg [data-mode="after"]', null, 700),
      [3.2, `EH.focusHazard('tub')`], [5.4, `EH.focusHazard('stairs')`], [7.0, `EH.focusHazard('night')`], [8.8, `EH.focusHazard(null)`],
    ] },
    { id: 's10', page: 'app', cues: [
      [0, `EH.go('quotes', { play: true }); EH.word('Quotes', 'Three vetted local contractors. You hire them directly.')`],
      ...glide(2.6, '.q.best'),
      ...tap(8.8, '#choose', `void 0`),
    ] },
    { id: 's11', page: 'app', extraClips: [['so1', 'so'], ['es1', 'es'], ['en1', 'en']], cues: [
      [0, `EH.go('family'); EH.word('Family', 'Read aloud in English, Somali or Spanish.'); EH.cursorHide(true)`],
    ] },
    { id: 's12', page: 'app', cues: [[0, `EH.endcard()`]], extra: 2.2 },
  ];
  let t = 0;
  for (const s of S) {
    s.clipDur = dur(s.id);
    s.voAt = LEAD;
    let d = LEAD + s.clipDur;
    if (s.extraClips) {
      s.extras = [];
      for (const [i, [clip, lang]] of s.extraClips.entries()) {
        const at = d + (i === 0 ? 0.45 : 0.7), len = dur(clip);
        s.extras.push({ clip, at });
        s.cues.push([at - 0.55, `EH.speakSo(false); EH.listen('${lang}')`], [at - 0.05, `EH.speakSo(true)`]);
        d = at + len;
      }
      s.cues.push([d + 0.1, `EH.speakSo(false)`]);
    }
    s.dur = d + TAIL + (s.extra ?? 0);
    s.start = t; t += s.dur;
  }
  return { scenes: S, total: t, FPS };
}
module.exports = { scenes, FPS };
if (require.main === module) {
  const { scenes: S, total } = scenes();
  S.forEach((s) => console.log(s.id, s.page, s.start.toFixed(2), s.dur.toFixed(2)));
  console.log('total', total.toFixed(2), 'frames', Math.round(total * FPS));
  fs.writeFileSync(process.argv[2] ?? 'timeline.json', JSON.stringify(scenes(), null, 1));
}
