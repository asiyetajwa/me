// Everhome dollhouse: a scanned single-storey home with fall risks today and the fixes after.
// mountHouse(container, { mode, autoRotate, labels, interactive, onReady }) returns { setMode, focus, destroy }.
import * as THREE from './three.module.min.js';

const C = {
  wall: 0xf7f5fb, wallTop: 0xd9d0ea, floorA: 0xece7f4, floorB: 0xe3dcef, floorBath: 0xdde7f2, floorKit: 0xeee6dc,
  wood: 0xc9a98a, fabric: 0x9d8cc8, rug: 0xc76d7e, white: 0xffffff, steel: 0xc8ccd6, risk: 0xff4d6a, good: 0x37c88a, orb: 0x6f7bff,
};

// Each hazard: where it sits, what it is, and what it becomes after the fix.
export const HAZARDS = [
  { id: 'tub', room: 'Bathroom', pos: [5.6, 0.9, 6.3], risk: 'Tub rim 17 in, no grab bars', fix: 'Walk-in shower, grab bars at 34 in', sev: 'must' },
  { id: 'stairs', room: 'Stairs', pos: [8.3, 1.25, 5.5], risk: 'Handrail on one side only', fix: 'Second handrail, 34 in', sev: 'must' },
  { id: 'rug', room: 'Living room', pos: [4.6, 0.45, 2.1], risk: 'Loose rug on the walk to the kitchen', fix: 'Rug removed, clear path', sev: 'must' },
  { id: 'night', room: 'Bedroom to bathroom', pos: [1.5, 0.75, 4.7], risk: 'Dark path at night', fix: 'Motion path lights', sev: 'soon' },
  { id: 'step', room: 'Front door', pos: [1.2, 0.5, -0.2], risk: 'Step at the door, 1.2 in', fix: 'Threshold ramp, 1:12', sev: 'soon' },
];

export function mountHouse(container, opts = {}) {
  const o = { mode: 'today', autoRotate: true, labels: true, interactive: true, zoom: 1, ...opts };
  const W = () => container.clientWidth, H = () => container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, W() / H(), 0.1, 100);
  const target = new THREE.Vector3(5, 0.3, 3.5);

  scene.add(new THREE.HemisphereLight(0xf6f2ff, 0x8d7fb8, 2.0));
  const sun = new THREE.DirectionalLight(0xfff1f6, 2.2);
  sun.position.set(9, 13, -7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
  sun.shadow.radius = 6;
  sun.target.position.copy(target);
  scene.add(sun, sun.target);

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });
  const box = (w, h, d, color, x, y, z, parent = scene, extra) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };

  // Ground plinth, like a model on a table
  const plinth = box(11.6, 0.3, 8.6, 0xd6cde6, 5, -0.16, 3.5);
  plinth.castShadow = false;

  // Floors per room
  const floors = [
    [0, 0, 2.6, 4, C.floorA], [2.6, 0, 7, 4, C.floorB], [7, 0, 10, 4, C.floorKit],
    [0, 4, 4, 7, C.floorA], [4, 4, 6.6, 7, C.floorBath], [6.6, 4, 10, 7, C.floorB],
  ];
  floors.forEach(([x0, z0, x1, z1, c]) => { const f = box(x1 - x0 - 0.02, 0.04, z1 - z0 - 0.02, c, (x0 + x1) / 2, 0.02, (z0 + z1) / 2); f.castShadow = false; });

  // Walls (cutaway height so the inside reads from above). Gaps are doorways.
  const WH = 1.15, T = 0.12;
  const wallMat = mat(C.wall, { emissive: 0xece6f6, emissiveIntensity: 0.35 });
  const walls = new THREE.Group(); scene.add(walls);
  const wall = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len + T, WH, T), wallMat);
    m.position.set((x0 + x1) / 2, WH / 2, (z0 + z1) / 2);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    m.castShadow = true; m.receiveShadow = true; walls.add(m);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(len + T, 0.02, T + 0.01), mat(C.wallTop));
    cap.position.copy(m.position); cap.position.y = WH + 0.01; cap.rotation.y = m.rotation.y; walls.add(cap);
  };
  // outer walls, front wall low with the front door gap at x 0.6-1.8
  wall(0, 0, 0.6, 0); wall(1.8, 0, 10, 0); wall(10, 0, 10, 7); wall(10, 7, 0, 7); wall(0, 7, 0, 0);
  // interior
  wall(2.6, 0, 2.6, 1.4); wall(2.6, 2.4, 2.6, 4);
  wall(0, 4, 1.2, 4); wall(2.1, 4, 4.6, 4); wall(5.5, 4, 7.4, 4); wall(8.4, 4, 10, 4);
  wall(4, 4, 4, 7); wall(6.6, 4, 6.6, 7);
  wall(7, 0, 7, 1.2); wall(7, 2.4, 7, 4);

  // Furniture
  const furn = new THREE.Group(); scene.add(furn);
  box(2.0, 0.42, 1.6, C.white, 1.5, 0.25, 5.8, furn); // bed
  box(2.0, 0.12, 1.6, C.fabric, 1.5, 0.52, 5.8, furn);
  box(0.5, 0.5, 0.45, C.wood, 0.4, 0.27, 4.6, furn); // nightstand
  box(2.4, 0.45, 0.9, C.fabric, 4.6, 0.25, 0.7, furn); // sofa
  box(2.4, 0.4, 0.25, C.fabric, 4.6, 0.55, 0.32, furn);
  box(1.0, 0.36, 0.6, C.wood, 4.6, 0.2, 3.3, furn); // coffee table
  box(0.6, 0.9, 2.6, C.white, 9.6, 0.47, 2.0, furn); // kitchen counter
  box(1.2, 0.75, 0.8, C.wood, 8.2, 0.4, 2.2, furn); // table
  box(0.45, 0.42, 0.55, C.white, 6.2, 0.23, 6.5, furn); // toilet
  box(0.8, 0.8, 0.5, C.white, 4.5, 0.42, 4.35, furn); // sink
  box(0.9, 0.42, 0.9, C.wood, 0.7, 0.23, 0.9, furn); // entry bench

  // Stairs: steps rising toward the back wall
  const stairs = new THREE.Group(); scene.add(stairs);
  for (let i = 0; i < 8; i++) box(1.4, 0.16 * (i + 1), 0.33, 0xe9e2f4, 8.3, 0.08 * (i + 1), 4.3 + i * 0.33, stairs);
  const rail = (x) => { const g = new THREE.Group(); const r = box(0.06, 0.06, 2.9, C.wood, x, 1.15, 5.6, g); r.rotation.x = -Math.atan2(1.28, 2.64); [4.4, 5.6, 6.8].forEach((z, k) => box(0.05, 0.9, 0.05, C.wood, x, 0.55 + k * 0.5, z, g)); return g; };
  stairs.add(rail(9.05));

  // ----- Today-only objects -----
  const today = new THREE.Group(); scene.add(today);
  const rug = box(1.9, 0.03, 1.3, C.rug, 4.6, 0.055, 2.1, today); rug.rotation.y = 0.18;
  const corner = box(0.4, 0.06, 0.3, C.rug, 5.55, 0.08, 2.75, today); corner.rotation.set(0.25, 0.18, 0); // the curled corner
  const tub = new THREE.Group(); today.add(tub);
  box(0.85, 0.5, 1.75, C.white, 5.6, 0.27, 5.85, tub);
  box(0.65, 0.05, 1.5, 0xbfd7f0, 5.6, 0.5, 5.85, tub);
  box(0.95, 0.05, 0.5, 0x8f86a8, 1.2, 0.03, -0.25, today); // the step at the door

  // ----- After-only objects -----
  const after = new THREE.Group(); scene.add(after);
  box(1.0, 0.03, 1.8, 0xd3e6f6, 5.6, 0.06, 5.85, after); // roll-in shower floor, flush
  const glass = box(0.03, 1.0, 1.0, 0xcfe6ff, 5.08, 0.55, 6.2, after, { transparent: true, opacity: 0.35, roughness: 0.1 });
  glass.castShadow = false;
  const bar = (x, y, z, len, rotY = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 16), mat(C.steel, { metalness: 0.8, roughness: 0.25 })); m.rotation.z = Math.PI / 2; m.rotation.y = rotY; m.position.set(x, y, z); m.castShadow = true; after.add(m); };
  bar(5.6, 0.86, 6.92, 0.9); bar(6.48, 0.86, 5.85, 0.9, Math.PI / 2); bar(6.52, 0.7, 6.5, 0.5, Math.PI / 2);
  box(0.4, 0.06, 0.4, 0xeaeef6, 6.2, 0.55, 6.5, after); // raised seat
  after.add(rail(7.55));
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.9), mat(0xb7b0cc)); ramp.position.set(1.2, 0.05, -0.45); ramp.rotation.x = 0.09; ramp.receiveShadow = true; after.add(ramp);
  // turning circle (60 in) in the bathroom and path lights to it
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.76, 64), new THREE.MeshBasicMaterial({ color: C.orb, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(5.2, 0.07, 5.0); after.add(ring);
  const lights = [];
  [[2.6, 5.0], [3.1, 5.0], [3.6, 5.0], [4.1, 5.0], [4.6, 4.7]].forEach(([x, z]) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfff0b8 }));
    l.position.set(x, 0.08, z); after.add(l); lights.push(l);
    const g = new THREE.PointLight(0xffe6a8, 0.6, 1.2); g.position.set(x, 0.2, z); after.add(g);
  });

  // ----- Hazard markers -----
  const markers = HAZARDS.map((h) => {
    const g = new THREE.Group(); g.position.set(...h.pos);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), new THREE.MeshBasicMaterial({ color: C.risk }));
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 48), new THREE.MeshBasicMaterial({ color: C.risk, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    g.add(core, halo); scene.add(g);
    return { h, g, core, halo };
  });

  // Labels in HTML, positioned each frame
  const labelLayer = document.createElement('div');
  labelLayer.className = 'h3d-labels';
  Object.assign(labelLayer.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.appendChild(labelLayer);
  const labelEls = markers.map((m) => {
    const el = document.createElement('div'); el.className = 'h3d-label'; labelLayer.appendChild(el); return el;
  });
  if (!o.labels) labelLayer.style.display = 'none';

  let mode = o.mode, mix = mode === 'after' ? 1 : 0, focusId = null;
  const setLabels = () => markers.forEach((m, i) => {
    const after = mode === 'after';
    labelEls[i].dataset.state = after ? 'fixed' : m.h.sev;
    labelEls[i].innerHTML = `<b>${after ? '&#10003; ' : ''}${m.h.room}</b><span>${after ? m.h.fix : m.h.risk}</span>`;
  });
  setLabels();

  // Camera orbit
  let theta = o.theta ?? -0.75, phi = o.phi ?? 0.95, radius = (o.radius ?? 17.5) / o.zoom, dragging = false, lx = 0, ly = 0, idle = 0;
  const camFocus = target.clone();
  function placeCamera() {
    camera.position.set(camFocus.x + radius * Math.sin(phi) * Math.cos(theta), camFocus.y + radius * Math.cos(phi), camFocus.z + radius * Math.sin(phi) * Math.sin(theta));
    camera.lookAt(camFocus);
  }
  if (o.interactive) {
    const el = renderer.domElement; el.style.touchAction = 'pan-y'; el.style.cursor = 'grab';
    el.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; });
    el.addEventListener('pointermove', (e) => { if (!dragging) return; theta += (e.clientX - lx) * 0.006; phi = Math.min(1.35, Math.max(0.45, phi - (e.clientY - ly) * 0.004)); lx = e.clientX; ly = e.clientY; idle = 0; });
    el.addEventListener('pointerup', () => { dragging = false; el.style.cursor = 'grab'; });
  }

  const v = new THREE.Vector3();
  const clock = new THREE.Clock();
  let raf = 0, running = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    idle += dt;
    if (o.autoRotate && !dragging && idle > 1.5 && !reduced) theta += dt * 0.12;
    const goal = mode === 'after' ? 1 : 0; mix += (goal - mix) * Math.min(1, dt * 4);
    today.visible = mix < 0.5; after.visible = mix >= 0.5;
    today.scale.y = 1; after.position.y = (1 - mix) * -0.4;
    lights.forEach((l, i) => { l.material.color.setHSL(0.13, 1, 0.75 + 0.15 * Math.sin(t * 3 + i)); });
    // focus easing
    const want = focusId ? new THREE.Vector3(...HAZARDS.find((h) => h.id === focusId).pos).setY(0.4) : target;
    camFocus.lerp(want, Math.min(1, dt * 2.5));
    const wantR = (focusId ? (o.focusRadius ?? 8.5) : (o.radius ?? 17.5)) / o.zoom; radius += (wantR - radius) * Math.min(1, dt * 2.5);
    placeCamera();
    markers.forEach((m, i) => {
      const fixed = mix >= 0.5;
      const col = fixed ? C.good : (m.h.sev === 'must' ? C.risk : 0xffa24d);
      m.core.material.color.setHex(col); m.halo.material.color.setHex(col);
      m.g.position.y = m.h.pos[1] + Math.sin(t * 2 + i) * 0.05;
      const pulse = fixed ? 1 : 1 + ((t * 0.9 + i * 0.3) % 1) * 1.4;
      m.halo.scale.setScalar(pulse); m.halo.material.opacity = fixed ? 0.9 : 1 - ((t * 0.9 + i * 0.3) % 1);
      m.halo.lookAt(camera.position);
      v.copy(m.g.position); v.y += 0.18; v.project(camera);
      const x = (v.x * 0.5 + 0.5) * W(), y = (-v.y * 0.5 + 0.5) * H();
      const el = labelEls[i]; el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      el.style.opacity = focusId && focusId !== m.h.id ? '0.25' : '1';
    });
    if (!o.visible || o.visible()) renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
  ro.observe(container);
  frame();
  o.onReady?.();

  return {
    setMode(m) { mode = m; setLabels(); },
    focus(id) { focusId = id; },
    destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); container.innerHTML = ''; },
  };
}

// Shared label styles, injected once
const css = `.h3d-label{position:absolute;left:0;top:0;padding:7px 12px 8px;border-radius:14px;background:rgba(30,26,46,.78);color:#f4f1fa;font:600 13px/1.25 'Atkinson',system-ui,sans-serif;white-space:nowrap;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.18);transition:opacity .4s;margin-top:-14px;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.h3d-label b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.75;font-weight:700}
.h3d-label span{display:block;font-size:14px}
.h3d-label[data-state=must]{border-color:rgba(255,77,106,.7)}
.h3d-label[data-state=soon]{border-color:rgba(255,162,77,.7)}
.h3d-label[data-state=fixed]{background:rgba(22,70,52,.82);border-color:rgba(55,200,138,.7)}`;
if (!document.getElementById('h3d-css')) { const s = document.createElement('style'); s.id = 'h3d-css'; s.textContent = css; document.head.appendChild(s); }
