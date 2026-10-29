/* Family Dentistry tooth mascots: soft clay teeth in pastel circles.
   Teeth.svg({ tint, mood, acc }) returns an SVG string; Teeth.mount(root) fills every [data-tooth] element.
   tint: lilac | sage | mint | peach | lemon | sky | rose
   mood: happy | calm | sleepy | wink | wow | proud | wince | sad
   acc:  none | crown | bandage | sparkle | zzz | badge */
(function (g) {
  'use strict';
  var TINTS = {
    lilac: ['#F1E7FD', '#D8C1F6', '#B994EA'],
    sage: ['#E5F1DA', '#BFDBA6', '#8DBB6A'],
    mint: ['#DDF4EA', '#AEE3CB', '#6CC59E'],
    peach: ['#FFE9DC', '#FBC6A8', '#F29A6D'],
    lemon: ['#FFF4CF', '#F9DE85', '#EDBE3A'],
    sky: ['#E3EFFF', '#B9D5FA', '#7FAEEE'],
    rose: ['#FFE4EA', '#F7B9C7', '#EC8199']
  };
  var n = 0;
  var BODY = 'M30 37C28 24 38 18 47 22c2 1 4 1 6 0 9-4 19 2 17 15-1 8-4 13-5 21-1 9-1 17-5 21-3 3-6 0-7-5-1-5-2-9-3-9s-2 4-3 9c-1 5-4 8-7 5-4-4-4-12-5-21-1-8-4-13-5-21z';

  function eyes(mood) {
    var L = 42, R = 58, Y = 44;
    var dot = function (x) { return '<ellipse cx="' + x + '" cy="' + Y + '" rx="2.5" ry="3" fill="#2A2730"/><circle cx="' + (x + 0.9) + '" cy="' + (Y - 1.1) + '" r=".8" fill="#fff"/>'; };
    var arc = function (x) { return '<path d="M' + (x - 3) + ' ' + Y + 'q3 2.6 6 0" fill="none" stroke="#2A2730" stroke-width="1.8" stroke-linecap="round"/>'; };
    var up = function (x) { return '<path d="M' + (x - 3) + ' ' + (Y + 1) + 'q3-3 6 0" fill="none" stroke="#2A2730" stroke-width="1.8" stroke-linecap="round"/>'; };
    var squint = function (x, s) { return '<path d="M' + (x - 3) + ' ' + (Y - 1.5) + 'l' + (3 * s) + ' 1.6l' + (-3 * s) + ' 1.6" fill="none" stroke="#2A2730" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'; };
    switch (mood) {
      case 'sleepy': return arc(L) + arc(R);
      case 'calm': return arc(L) + arc(R);
      case 'proud': return up(L) + up(R);
      case 'wink': return dot(L) + up(R);
      case 'wince': return squint(L + 1.5, 1) + squint(R - 1.5, -1);
      default: return '<g class="tt-eyes">' + dot(L) + dot(R) + '</g>';
    }
  }
  function mouth(mood) {
    switch (mood) {
      case 'wow': return '<ellipse cx="50" cy="52.5" rx="2.6" ry="3.2" fill="#2A2730"/><ellipse cx="50" cy="53.6" rx="1.6" ry="1.4" fill="#F27C93"/>';
      case 'sleepy': return '<path d="M47.5 52.5q2.5 1.4 5 0" fill="none" stroke="#2A2730" stroke-width="1.6" stroke-linecap="round"/>';
      case 'calm': return '<path d="M46.5 51.5q3.5 2.6 7 0" fill="none" stroke="#2A2730" stroke-width="1.7" stroke-linecap="round"/>';
      case 'wince': return '<path d="M46 53.5q2-1.6 4 0t4 0" fill="none" stroke="#2A2730" stroke-width="1.6" stroke-linecap="round"/>';
      case 'sad': return '<path d="M46.5 54q3.5-2.6 7 0" fill="none" stroke="#2A2730" stroke-width="1.7" stroke-linecap="round"/>';
      case 'proud': return '<path d="M45 50.5q5 5.5 10 0z" fill="#2A2730"/><path d="M47.5 53.2q2.5 1.4 5 0" fill="#F27C93"/>';
      default: return '<path d="M45.5 50.5q4.5 4.6 9 0" fill="none" stroke="#2A2730" stroke-width="1.8" stroke-linecap="round"/>';
    }
  }
  function acc(a, id) {
    switch (a) {
      case 'crown':
        return '<g class="tt-crown"><path d="M38 23l3-9 6 6 3-8 3 8 6-6 3 9c-7 3-17 3-24 0z" fill="url(#gd' + id + ')" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/><circle cx="50" cy="12" r="1.6" fill="#fff6d6"/></g>';
      case 'bandage':
        return '<g transform="rotate(-24 64 54)"><rect x="57" y="51" width="15" height="6" rx="3" fill="#F6D9B8" stroke="#fff" stroke-width="1"/><rect x="62.5" y="51.6" width="4" height="4.8" rx="1" fill="#EBC294"/></g>';
      case 'sparkle':
        return '<g class="tt-spark"><path d="M74 20l1.6 4.4L80 26l-4.4 1.6L74 32l-1.6-4.4L68 26l4.4-1.6z" fill="#fff"/></g>';
      case 'zzz':
        return '<g class="tt-zzz" font-family="Inter,system-ui,sans-serif" font-weight="700" fill="#8E8AA0"><text x="66" y="28" font-size="9">z</text><text x="72" y="20" font-size="7">z</text><text x="77" y="13" font-size="5.5">z</text></g>';
      case 'badge':
        return '<g transform="translate(66 64)"><path d="M8 0l2.3 1.7 2.8-.2.9 2.7 2.3 1.6-.8 2.7.8 2.7-2.3 1.6-.9 2.7-2.8-.2L8 16l-2.3-1.7-2.8.2-.9-2.7L-.3 10.2l.8-2.7-.8-2.7L2 3.2l.9-2.7 2.8.2z" fill="#3D9BF0" stroke="#fff" stroke-width="1.4"/><path d="M4.8 8l2.2 2.2 4.2-4.4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>';
      default: return '';
    }
  }
  function svg(o) {
    o = o || {};
    var t = TINTS[o.tint] || TINTS.lilac, id = (++n) + '' + Math.floor(Math.random() * 1e4);
    var mood = o.mood || 'happy';
    var circle = o.bare ? '' : '<circle cx="50" cy="50" r="50" fill="url(#bg' + id + ')"/>';
    return '<svg class="tt tt-' + mood + '" viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="bg' + id + '" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="' + t[0] + '"/><stop offset="1" stop-color="' + t[1] + '"/></radialGradient>' +
      '<radialGradient id="bd' + id + '" cx="34%" cy="24%" r="85%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FBF8F6"/><stop offset="1" stop-color="' + t[1] + '"/></radialGradient>' +
      '<linearGradient id="gd' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE08A"/><stop offset="1" stop-color="#E9A93A"/></linearGradient>' +
      '<filter id="bl' + id + '" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '</defs>' + circle +
      '<ellipse cx="50" cy="90" rx="19" ry="3.8" fill="' + t[2] + '" opacity=".45" filter="url(#bl' + id + ')"/>' +
      '<g transform="translate(50 54) scale(1.16) translate(-50 -54)"><g class="tt-body">' +
      '<path d="' + BODY + '" fill="url(#bd' + id + ')"/>' +
      '<path d="' + BODY + '" fill="none" stroke="' + t[2] + '" stroke-opacity=".28" stroke-width="1"/>' +
      '<ellipse cx="39" cy="29" rx="6.5" ry="3.6" fill="#fff" opacity=".9" transform="rotate(-24 39 29)" filter="url(#bl' + id + ')"/>' +
      '<ellipse cx="37" cy="50.5" rx="4" ry="2.4" fill="#FF9DB2" opacity=".55"/><ellipse cx="63" cy="50.5" rx="4" ry="2.4" fill="#FF9DB2" opacity=".55"/>' +
      eyes(mood) + mouth(mood) + acc(o.acc, id) +
      '</g></g></svg>';
  }
  function mount(root) {
    (root || document).querySelectorAll('[data-tooth]').forEach(function (el) {
      if (el.dataset.done === el.dataset.tooth) return;
      var p = el.dataset.tooth.split(' ');
      el.innerHTML = svg({ tint: p[0], mood: p[1], acc: p[2], bare: el.hasAttribute('data-bare') });
      el.dataset.done = el.dataset.tooth;
    });
  }
  var css = '.tt .tt-body{transform-box:fill-box;transform-origin:50% 100%;animation:ttBob 3.6s ease-in-out infinite}' +
    '.tt .tt-eyes{transform-box:fill-box;transform-origin:center;animation:ttBlink 4.8s infinite}' +
    '.tt .tt-zzz{animation:ttZ 2.6s ease-in-out infinite}' +
    '.tt .tt-spark{transform-box:fill-box;transform-origin:center;animation:ttSpark 2.2s ease-in-out infinite}' +
    '.tt-sleepy .tt-body{animation-duration:5.5s}' +
    '[data-tooth]:active .tt-body,.tt-squish .tt-body{animation:ttSquish .5s cubic-bezier(.3,.7,.3,1)}' +
    '@keyframes ttBob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2.5px) rotate(1.5deg)}}' +
    '@keyframes ttBlink{0%,93%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
    '@keyframes ttZ{0%,100%{opacity:.35;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}' +
    '@keyframes ttSpark{0%,100%{transform:scale(.6) rotate(0);opacity:.6}50%{transform:scale(1.1) rotate(20deg);opacity:1}}' +
    '@keyframes ttSquish{0%{transform:scale(1)}35%{transform:scale(1.12,.86)}65%{transform:scale(.94,1.08)}100%{transform:scale(1)}}' +
    '@media (prefers-reduced-motion:reduce){.tt *{animation:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  g.Teeth = { svg: svg, mount: mount, TINTS: TINTS };
})(window);
