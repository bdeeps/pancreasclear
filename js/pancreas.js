// PancreasClear's shared models and helpers: a lumpy, flattened organ tube, the pancreas in the
// upper abdomen with its neighbours, ducts and vessels, an islet of Langerhans, the glucose chart,
// labels and small layout helpers.
//
// Orientation: we look at the patient from the front (anterior view), as in an anatomy atlas, so
// the patient's RIGHT is on YOUR LEFT. Axes: +x = patient's left, +y = up (towards the head),
// +z = forwards (towards you). Origin ≈ the neck of the pancreas, at about the level of the first
// lumbar vertebra (L1, the transpyloric plane). One model unit ≈ 2 cm.
// Anatomy (Gray's Anatomy, 42nd ed.; NIDDK "The pancreas"; Kenhub/TeachMeAnatomy summaries;
// Longnecker, "Anatomy and histology of the pancreas", Pancreapedia 2021):
//  - the pancreas lies across the back of the abdomen, behind the stomach (retroperitoneal), about
//    12–15 cm long and 70–100 g (≈ 80 g) in adults;
//  - the HEAD sits in the C-shaped curve of the duodenum, with the hook-like UNCINATE PROCESS
//    tucked behind the superior mesenteric vein; the NECK lies in front of the portal vein; the BODY
//    crosses the aorta and spine; the TAIL rises to the hilum of the spleen;
//  - the main pancreatic duct (of Wirsung) runs the whole length and, in most people, joins the
//    common bile duct at the hepatopancreatic ampulla (of Vater), which opens on the major duodenal
//    papilla in the second (descending) part of the duodenum; an accessory duct (of Santorini)
//    often opens a little higher, at the minor papilla;
//  - the splenic artery winds along the upper border; the splenic vein runs behind the body and
//    joins the superior mesenteric vein behind the neck to form the portal vein; the superior
//    mesenteric artery comes off the aorta behind the neck and passes in front of the uncinate
//    process and the third part of the duodenum.
// Tissue: about 98–99% exocrine (acini and ducts) and 1–2% endocrine islets of Langerhans; an adult
// pancreas holds roughly a million islets, with estimates ranging from about 1 to 3 million
// (Da Silva Xavier, J Clin Med 7:54, 2018; Ionescu-Tirgoviste et al., Sci Rep 5:14634, 2015).
import { THREE, M, clamp, lerp, smooth } from './kit.js';

// ---------------------------------------------------------------- colours
export const C = {
  pancreas: 0xe9c07e, pancreasDeep: 0xd9a560, duodenum: 0xe39a86, stomach: 0xe6a39a, liver: 0x8a3b2e, gall: 0x55a85c,
  spleen: 0x8e3a5a, artery: 0xe8434f, vein: 0x4f7cff, portal: 0x7a6cff, bile: 0x8fd35a, duct: 0x8fd0ff,
  islet: 0xfff1a8, beta: 0x5ce1a9, alpha: 0xff7a8a, delta: 0x8fb0ff, glucose: 0xffffff, insulin: 0x5ce1a9, glucagon: 0xff7a8a,
  enzyme: 0xffb547, trypsin: 0xff4d4d, bicarb: 0x6fb7ff, acid: 0xff6a3d, secretin: 0x8ef0ff, cck: 0xd78bff, calcium: 0xffd166,
  atp: 0xffe066, nucleus: 0x7c5aa8,
};

// Label tints.
const TINT = { side: '#8ef0ff', gold: '#ffd166', red: '#ff8a94', green: '#9be37a', blue: '#8fb0ff', pink: '#ffb3c1', violet: '#d7a8ff', brown: '#e0b08a', mint: '#7ff0c8' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export function sideLabels(stage, parent, y, x, z = 1.2) {
  return [
    tint(stage.label("← Patient's right", [-x, y, z], parent), 'side'),
    tint(stage.label("Patient's left →", [x, y, z], parent), 'side'),
  ];
}

// Deterministic "random" numbers so every run (and every video frame) looks the same.
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// On phones, jump straight to a wider framing (unless recording or the viewer has orbited).
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !document.body.classList.contains('gb-reel')) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// Views that change with a "scene" control: jump there on phones too.
export function sceneView(stage, views, narrowViews) {
  let last = null;
  return (scene) => {
    if (scene === last) return;
    const narrow = stage.host.clientWidth < 560 && !document.body.classList.contains('gb-reel');
    const v = (narrow && narrowViews?.[scene]) || views[scene];
    if (last !== null) stage.setView(v.pos, v.target, 0.9);
    last = scene;
  };
}

// On phones the readout would cover the model, so keep only its headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}

// A glossy, living-tissue material that can fade for the X-ray view.
export const tissue = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.4, transparent: true, opacity: 1, side: THREE.DoubleSide, ...o });
export function setOpacity(mat, a) { mat.opacity = a; mat.depthWrite = a > 0.95; mat.visible = a > 0.01; }

// A group whose materials can all fade together (for zoom transitions).
export function fader(group) {
  const mats = [];
  group.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; ms.forEach((m) => { if (!mats.find((x) => x[0] === m)) mats.push([m, m.opacity ?? 1, m.transparent]); }); });
  return (a) => {
    group.visible = a > 0.01;
    mats.forEach(([m, o0, tr]) => { m.transparent = tr || a < 0.99; m.opacity = o0 * a; if (!tr) m.depthWrite = a > 0.99; });
  };
}

// Many instanced dots, hidden until placed.
export function dots(n, geo, mat, parent) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false;
  const o = new THREE.Object3D();
  m.put = (i, x, y, z, s = 1, rx = 0, ry = 0) => { o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.scale.setScalar(s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); };
  m.hide = (i) => m.put(i, 0, -999, 0, 0);
  m.done = () => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; };
  for (let i = 0; i < n; i++) m.hide(i);
  m.done();
  if (parent) parent.add(m);
  return m;
}

export function pathOf(points) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), false, 'centripetal');
  return { curve, at: (u, t = new THREE.Vector3()) => curve.getPointAt(clamp(u, 0, 1), t), length: curve.getLength() };
}

// ---------------------------------------------------------------- an organ tube
// A tube along a smooth curve whose radius depends on the fraction u along it and the angle a
// around it (for lumpy lobules), squashed front-to-back by `squash`, with rounded ends.
export function organ(points, radius, mat, { segs = 160, radial = 32, squash = 1 } = {}) {
  const P = pathOf(points), curve = P.curve;
  const fr = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [];
  const ring = (i) => {
    const u = i / segs, c = curve.getPointAt(u), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2, r = radius(u, a);
      const off = N.clone().multiplyScalar(Math.cos(a) * r).add(B.clone().multiplyScalar(Math.sin(a) * r));
      off.z *= squash;
      pos.push(c.x + off.x, c.y + off.y, c.z + off.z);
    }
  };
  for (let i = 0; i <= segs; i++) ring(i);
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = a + radial, d = b + radial;
    idx.push(a, c, b, b, c, d);
  }
  // Rounded caps: a fan to a point pushed out along the tangent.
  [[0, -1], [segs, 1]].forEach(([i, dir]) => {
    const u = i / segs, c = curve.getPointAt(u), T = curve.getTangentAt(u).multiplyScalar(dir * radius(u, 0) * 0.8);
    const k = pos.length / 3; pos.push(c.x + T.x, c.y + T.y, c.z + T.z * squash);
    for (let j = 0; j < radial; j++) { const a = i * radial + j, b = i * radial + ((j + 1) % radial); if (dir < 0) idx.push(k, a, b); else idx.push(k, b, a); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true;
  // A point inside the organ: fraction u along, angle a, fraction f of the radius out.
  mesh.userData.inside = (u, a, f, t = new THREE.Vector3()) => {
    const i = Math.round(clamp(u, 0, 1) * segs), c = curve.getPointAt(i / segs), N = fr.normals[i], B = fr.binormals[i], r = radius(i / segs, a) * f;
    const off = N.clone().multiplyScalar(Math.cos(a) * r).add(B.clone().multiplyScalar(Math.sin(a) * r)); off.z *= squash;
    return t.copy(c).add(off);
  };
  mesh.userData.path = P;
  return mesh;
}
export const lumpy = (r0) => (u, a) => r0(u) * (1 + 0.07 * Math.sin(a * 7 + u * 53) * Math.sin(u * 97 + a * 3) + 0.04 * Math.sin(u * 211 + a * 11));
export function blob(mat, pos, scale, rot = [0, 0, 0], seg = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg * 0.66), mat); m.position.set(...pos); m.scale.set(...scale); m.rotation.set(...rot); return m;
}
export function pipe(points, r, mat, seg = 80) {
  const P = pathOf(points);
  const m = new THREE.Mesh(new THREE.TubeGeometry(P.curve, seg, r, 10, false), mat); m.castShadow = true; m.userData.path = P; return m;
}

// ---------------------------------------------------------------- the pancreas and its neighbours
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const PATHS = {
  pancreas: [V(-2.75, -1.1, 0.0), V(-2.85, -0.2, 0.05), V(-2.5, 0.65, 0.15), V(-1.6, 1.0, 0.35), V(-0.6, 1.1, 0.45), V(0.8, 1.35, 0.3), V(2.4, 1.8, -0.2), V(3.7, 2.4, -0.9), V(4.7, 3.0, -1.5)],
  uncinate: [V(-2.5, -1.5, -0.1), V(-1.8, -2.05, -0.4), V(-0.95, -1.95, -0.7)],
  duodenum: [V(0.0, 2.55, 1.5), V(-1.5, 2.7, 0.95), V(-3.1, 2.5, 0.25), V(-4.2, 1.4, -0.1), V(-4.3, -0.4, -0.1), V(-4.0, -2.3, 0.0), V(-2.7, -3.35, 0.1), V(-1.0, -3.45, 0.25), V(0.6, -3.1, 0.1), V(1.35, -2.25, -0.1), V(1.5, -1.35, 0.0), V(2.3, -1.6, 0.7), V(2.9, -2.5, 1.1)],
  mainDuct: [V(4.5, 2.9, -1.4), V(3.6, 2.35, -0.85), V(2.3, 1.75, -0.2), V(0.8, 1.32, 0.3), V(-0.6, 1.08, 0.45), V(-1.6, 0.85, 0.3), V(-2.4, 0.05, 0.1), V(-3.0, -0.45, 0.0), V(-3.8, -0.55, -0.05)],
  accessory: [V(-1.6, 0.85, 0.3), V(-2.6, 0.6, 0.15), V(-3.8, 0.45, -0.05)],
  bileDuct: [V(-2.7, 5.4, -0.3), V(-2.6, 3.7, -0.5), V(-3.05, 1.8, -0.55), V(-3.4, 0.4, -0.4), V(-3.6, -0.3, -0.2), V(-3.8, -0.55, -0.05)],
  stomach: [V(3.0, 6.3, -0.4), V(3.8, 5.0, 0.7), V(3.1, 3.4, 1.9), V(1.6, 2.6, 2.3), V(0.4, 2.5, 2.0), V(0.0, 2.55, 1.5)],
  aorta: [V(0.4, 7, -2.5), V(0.4, 0, -2.5), V(0.4, -5.5, -2.4)],
  ivc: [V(-1.6, 7, -2.2), V(-1.6, 0, -2.2), V(-1.6, -5.5, -2.1)],
  sma: [V(0.4, 1.4, -2.1), V(0.3, 0.7, -1.2), V(0.25, -0.9, -0.45), V(0.15, -2.6, 0.55), V(0.05, -3.5, 1.05), V(0.2, -5.2, 1.3)],
  smv: [V(-0.55, -5.2, 1.4), V(-0.55, -3.5, 1.15), V(-0.55, -1.7, 0.1), V(-0.6, 0.35, -0.75)],
  portal: [V(-0.6, 0.35, -0.75), V(-1.5, 2.3, -0.65), V(-2.4, 4.8, -0.4)],
  splenicV: [V(5.0, 3.1, -1.95), V(3.7, 2.35, -1.35), V(2.0, 1.55, -0.85), V(0.6, 0.95, -0.75), V(-0.6, 0.35, -0.75)],
  coeliac: [V(0.4, 2.6, -2.2), V(0.4, 2.75, -1.5)],
  hepaticA: [V(0.4, 2.75, -1.5), V(-1.4, 3.05, -0.9), V(-2.2, 4.6, -0.5)],
};
export const AMPULLA = V(-3.8, -0.55, -0.05);
// Where along the pancreas path each part lies (worked out from the points above).
export const PARTS = { head: [0, 0.3], neck: [0.3, 0.42], body: [0.42, 0.75], tail: [0.75, 1] };
const pancR = (u) => {
  // Head ≈ 4–5 cm, neck ≈ 2 cm, body ≈ 2.5–3 cm, tail ≈ 2 cm, tip rounded (the head's lower part
  // is a separate lumpy blob, and the uncinate process a short hook).
  if (u < 0.2) return lerp(1.0, 1.05, u / 0.2);
  if (u < 0.36) return lerp(1.05, 0.55, smooth((u - 0.2) / 0.16));
  if (u < 0.55) return lerp(0.55, 0.72, smooth((u - 0.36) / 0.19));
  if (u < 0.93) return lerp(0.72, 0.5, (u - 0.55) / 0.38);
  return lerp(0.5, 0.3, (u - 0.93) / 0.07);
};
// A sphere with a bumpy, lobulated surface.
export function lumpyBlob(mat, pos, scale, amp = 0.06, seed = 1) {
  const g = new THREE.SphereGeometry(1, 48, 32), a = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i); const k = 1 + amp * Math.sin(v.x * 9 + seed) * Math.sin(v.y * 11 + v.z * 7) + amp * 0.6 * Math.sin(v.z * 19 + v.x * 5); v.multiplyScalar(k); a.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.position.set(...pos); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; return m;
}
export const PANC_R = pancR;

// Builds the pancreas in the abdomen. Returns groups (for exploding and fading) and helpers.
export function makeAbdomen(stage, { neighbours = true, vessels = true, ducts = true, islets = true } = {}) {
  const root = new THREE.Group();
  const g = { pancreas: new THREE.Group(), ducts: new THREE.Group(), duodenum: new THREE.Group(), upper: new THREE.Group(), spleen: new THREE.Group(), vessels: new THREE.Group(), islets: new THREE.Group() };
  Object.values(g).forEach((x) => root.add(x));
  const mats = { panc: tissue(C.pancreas, { roughness: 0.6 }), duo: tissue(C.duodenum) };
  const panc = organ(PATHS.pancreas, lumpy(pancR), mats.panc, { segs: 200, radial: 40, squash: 0.58 });
  const headLow = lumpyBlob(mats.panc, [-2.72, -0.95, 0.0], [1.08, 1.3, 0.62]);
  const unc = organ(PATHS.uncinate, lumpy((u) => lerp(0.62, 0.3, u)), mats.panc, { segs: 40, radial: 24, squash: 0.7 });
  g.pancreas.add(panc, headLow, unc);
  const duo = organ(PATHS.duodenum, (u) => (u > 0.85 ? 0.5 : 0.56), mats.duo, { segs: 160, radial: 24 });
  g.duodenum.add(duo);
  // Pylorus: the ring of muscle where the stomach ends.
  const pyl = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.14, 10, 28), tissue(0xd66a60)); pyl.position.copy(PATHS.duodenum[0]); pyl.lookAt(PATHS.duodenum[1].clone().add(V(0, 0, 0))); g.duodenum.add(pyl);
  // The papillae on the inside wall of the duodenum.
  const pap = blob(M.glow(0xffffff), AMPULLA.toArray(), [0.13, 0.13, 0.13]); g.ducts.add(pap);
  const pap2 = blob(M.glow(0xcfe8ff), [-3.8, 0.45, -0.05], [0.08, 0.08, 0.08]); g.ducts.add(pap2);

  const ductMats = { main: tissue(C.duct, { emissive: new THREE.Color(0x1d4d6e) }), bile: tissue(C.bile, { emissive: new THREE.Color(0x284d12) }) };
  const mainDuct = pipe(PATHS.mainDuct, 0.1, ductMats.main, 120), acc = pipe(PATHS.accessory, 0.06, ductMats.main, 30);
  const bile = pipe(PATHS.bileDuct, 0.13, ductMats.bile, 80);
  g.ducts.add(mainDuct, acc, bile);
  // Side branches of the main duct, like a herringbone.
  for (let k = 0; k < 16; k++) {
    const u = 0.04 + k * 0.058, a = mainDuct.userData.path.at(u), side = k % 2 ? 1 : -1;
    const tip = a.clone().add(V(0.12, side * 0.42, 0.12 * side));
    g.ducts.add(pipe([a, a.clone().lerp(tip, 0.5).add(V(0.08, 0, 0)), tip], 0.035, ductMats.main, 8));
  }

  const ghostMats = [];
  const gm = (c, o) => { const m = tissue(c, { opacity: o, depthWrite: false, transparent: true }); ghostMats.push([m, o]); return m; };
  let stomach = null, liver = null, gb = null, spleen = null;
  if (neighbours) {
    stomach = organ(PATHS.stomach, (u) => lerp(1.55, 0.62, smooth(u)), gm(0xf2b8ae, 0.2), { segs: 60, radial: 28 });
    liver = blob(gm(0xb0584a, 0.2), [-3.1, 6.9, 0.2], [4.3, 1.7, 2.6], [0, 0, -0.18]);
    const lobe = blob(liver.material, [1.2, 7.1, 0.9], [2.4, 0.8, 1.8], [0, 0, 0.2]);
    gb = blob(gm(C.gall, 0.5), [-4.6, 4.3, 1.3], [0.55, 1.0, 0.55], [0, 0, 0.45]);
    const cystic = pipe([[-4.35, 3.5, 1.0], [-3.4, 3.8, 0.3], [-2.62, 3.9, -0.45]], 0.07, ductMats.bile, 20);
    g.upper.add(stomach, liver, lobe, gb, cystic);
    spleen = blob(gm(C.spleen, 0.55), [5.7, 3.8, -2.1], [0.95, 1.7, 0.7], [0.2, 0.4, -0.5]);
    g.spleen.add(spleen);
  }
  const vesselMats = { art: tissue(C.artery), vein: tissue(C.vein), portal: tissue(C.portal) };
  if (vessels) {
    g.vessels.add(pipe(PATHS.aorta, 0.5, vesselMats.art, 20), pipe(PATHS.ivc, 0.55, vesselMats.vein, 20));
    g.vessels.add(pipe(PATHS.sma, 0.2, vesselMats.art, 50), pipe(PATHS.smv, 0.24, vesselMats.vein, 50));
    g.vessels.add(pipe(PATHS.portal, 0.3, vesselMats.portal, 40), pipe(PATHS.splenicV, 0.2, vesselMats.vein, 60));
    g.vessels.add(pipe(PATHS.coeliac, 0.2, vesselMats.art, 6), pipe(PATHS.hepaticA, 0.14, vesselMats.art, 30));
    // The splenic artery is famously wiggly, running along the top edge of the pancreas.
    const sa = []; for (let k = 0; k <= 24; k++) { const x = lerp(0.4, 5.0, k / 24); sa.push(V(x, 2.75 + (x / 5) * 0.75 + 0.22 * Math.sin(x * 3.2) - (k === 0 ? 0 : 0.2), -1.5 + (x / 5) * -0.4 + 0.25 * Math.cos(x * 2.1))); }
    g.vessels.add(pipe(sa, 0.13, vesselMats.art, 120));
  }
  // Islets, drawn hugely enlarged (real ones are 0.05–0.5 mm), a little denser in the tail
  // (Wang et al., PLoS One 8:e67454, 2013).
  const NI = 300;
  const isl = dots(NI, new THREE.SphereGeometry(0.07, 8, 6), M.glow(C.islet), g.islets);
  const p = V(0, 0, 0);
  for (let i = 0; i < NI - 40; i++) {
    const u = Math.pow(rnd(i * 3 + 1), 0.8) * 0.97 + 0.015, a = rnd(i * 3 + 2) * Math.PI * 2, f = Math.sqrt(rnd(i * 3 + 3)) * 0.8;
    panc.userData.inside(u, a, f, p); isl.put(i, p.x, p.y, p.z, 0.7 + rnd(i + 77) * 0.8);
  }
  // A few more in the lower head.
  for (let i = 0; i < 40; i++) {
    const a = rnd(i * 7 + 500) * 6.283, b = Math.acos(2 * rnd(i * 7 + 501) - 1), f = Math.cbrt(rnd(i * 7 + 502)) * 0.8;
    isl.put(NI - 40 + i, headLow.position.x + Math.sin(b) * Math.cos(a) * f * 1.08, headLow.position.y + Math.cos(b) * f * 1.3, headLow.position.z + Math.sin(b) * Math.sin(a) * f * 0.62, 0.7 + rnd(i + 900) * 0.8);
  }
  isl.done();
  g.islets.visible = false;

  const parts = [
    { obj: g.upper, off: [0, 3.2, 3.2] }, { obj: g.duodenum, off: [-2.2, -0.4, 1.2] }, { obj: g.vessels, off: [0, 0, -3.2] },
    { obj: g.spleen, off: [2.2, 0.4, -0.6] },
  ];
  parts.forEach((q) => { q.home = q.obj.position.clone(); });
  const api = {
    root, groups: g, panc, duo, mats, ghostMats, mainDuct, bile, acc,
    setExplode(k) { const e = smooth(k); parts.forEach((q) => q.obj.position.copy(q.home).add(V(...q.off).multiplyScalar(e))); },
    setXray(k) {
      setOpacity(mats.panc, lerp(1, 0.3, k));
      setOpacity(mats.duo, lerp(1, 0.35, k));
      g.islets.visible = k > 0.05;
      isl.material.transparent = true; isl.material.opacity = k;
    },
    ghosts(a) { ghostMats.forEach(([m, o]) => { m.opacity = o * a; m.visible = a > 0.02; }); },
  };
  return api;
}

// ---------------------------------------------------------------- an islet of Langerhans
// A human islet is a ball of about 1,000–3,000 cells, ~0.05–0.5 mm across (typical ~0.15 mm).
// In human islets the cell types are mixed together rather than in a core and mantle as in mice:
// about 55–60% beta cells (insulin), 30–40% alpha cells (glucagon) and ≤10% delta cells
// (somatostatin), plus a few PP and epsilon cells, threaded by capillaries that carry hormones
// away (Cabrera et al., PNAS 103:2334, 2006; Brissova et al., J Histochem Cytochem 53:1087, 2005).
export const ISLET_MIX = { beta: 0.57, alpha: 0.35, delta: 0.08 };
export function makeIslet({ n = 420, R = 2.2 } = {}) {
  const grp = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.2, 1);
  const kinds = { beta: [], alpha: [], delta: [] };
  // Fibonacci sphere-filling: points on nested shells, then a type chosen by a fixed hash.
  const pts = [];
  for (let i = 0; i < n; i++) {
    const f = Math.cbrt((i + 0.5) / n), y = 1 - 2 * rnd(i * 5 + 1), th = i * 2.39996;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    pts.push(V(Math.cos(th) * rr * f * R, y * f * R * 0.92, Math.sin(th) * rr * f * R));
  }
  pts.forEach((pt, i) => { const h = rnd(i * 13 + 7); kinds[h < ISLET_MIX.beta ? 'beta' : h < ISLET_MIX.beta + ISLET_MIX.alpha ? 'alpha' : 'delta'].push(pt); });
  const meshes = {};
  Object.entries(kinds).forEach(([k, list]) => {
    const mat = new THREE.MeshPhysicalMaterial({ color: C[k], roughness: 0.4, clearcoat: 0.4, transparent: true, opacity: 1 });
    const m = new THREE.InstancedMesh(geo, mat, list.length); m.frustumCulled = false;
    const o = new THREE.Object3D();
    list.forEach((pt, i) => { o.position.copy(pt); o.rotation.set(i, i * 0.7, 0); o.scale.setScalar(0.9 + rnd(i + 3) * 0.35); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.userData.pts = list; grp.add(m); meshes[k] = m;
  });
  // Capillaries weaving through.
  const capMat = tissue(C.artery, { opacity: 0.85, emissive: new THREE.Color(0x3a0a10) });
  const caps = [];
  for (let k = 0; k < 5; k++) {
    const a = k * 1.3, b = a + 2.4, y0 = (rnd(k) - 0.5) * 1.6;
    const pts2 = [V(Math.cos(a) * R * 1.35, y0, Math.sin(a) * R * 1.35), V(Math.cos(a + 0.9) * R * 0.4, y0 * 0.3 + 0.3, Math.sin(a + 0.9) * R * 0.4), V(Math.cos(b) * R * 1.35, -y0, Math.sin(b) * R * 1.35)];
    const c = pipe(pts2, 0.09, capMat, 40); grp.add(c); caps.push(c);
  }
  return { grp, meshes, kinds, caps, R };
}

// ---------------------------------------------------------------- the glucose chart
// Draws a day of blood glucose. curves: [{ G, color, label, width }], cursor: minutes after 06:00.
export function drawDay(g, w, h, { curves = [], cursor = 0, walk = true, title = 'Blood glucose over a day', meals = [], band = true, hi = 400 } = {}) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(7,8,12,0.86)'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
  const x0 = 96, x1 = w - 28, y0 = 70, y1 = h - 56;
  const X = (m) => x0 + (x1 - x0) * (m / 1440), Y = (v) => y1 - (y1 - y0) * (clamp(v, 40, hi) - 40) / (hi - 40);
  g.fillStyle = '#e8ecf4'; g.font = '600 30px Geist, sans-serif'; g.fillText(title, 26, 44);
  g.font = '21px Geist, sans-serif'; g.fillStyle = '#8a93a6'; g.textAlign = 'right'; g.fillText('mg/dL', w - 28, 44); g.textAlign = 'left';
  // Night shading and the walk.
  g.fillStyle = 'rgba(120,130,255,0.10)'; g.fillRect(X(990), y0, X(1440) - X(990), y1 - y0);
  if (walk) { g.fillStyle = 'rgba(92,225,169,0.14)'; g.fillRect(X(900), y0, X(940) - X(900), y1 - y0); }
  // The typical range: 70 to 140 mg/dL (fasting 70–99, after meals below ~140; ADA).
  if (band) { g.fillStyle = 'rgba(92,225,169,0.13)'; g.fillRect(x0, Y(140), x1 - x0, Y(70) - Y(140)); }
  g.strokeStyle = '#2c3344'; g.lineWidth = 2; g.font = '20px Geist, sans-serif'; g.fillStyle = '#8a93a6';
  const ticks = hi > 300 ? [70, 140, 200, 300, 400] : [70, 100, 140, 200];
  ticks.forEach((v) => { g.beginPath(); g.moveTo(x0, Y(v)); g.lineTo(x1, Y(v)); g.stroke(); g.fillText(String(v), 30, Y(v) + 7); });
  [0, 360, 720, 1080, 1440].forEach((m) => { g.fillText(['06:00', '12:00', '18:00', '00:00', '06:00'][m / 360], X(m) - 28, h - 20); });
  meals.forEach((ml) => { g.fillStyle = '#ffd166'; g.beginPath(); g.moveTo(X(ml.t), y1 + 2); g.lineTo(X(ml.t) - 8, y1 + 16); g.lineTo(X(ml.t) + 8, y1 + 16); g.fill(); });
  curves.forEach((c) => {
    g.strokeStyle = c.color; g.lineWidth = c.width || 5; g.globalAlpha = c.alpha ?? 1; g.beginPath();
    const end = c.full ? 1440 : Math.min(1440, Math.floor(cursor) + 1);
    for (let m = 0; m < end; m += 4) { const x = X(m), y = Y(c.G[m]); if (m === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke(); g.globalAlpha = 1;
  });
  // Cursor.
  const c0 = curves.find((c) => !c.full) || curves[0];
  if (c0) { const m = Math.min(1439, Math.floor(cursor)); g.fillStyle = '#fff'; g.beginPath(); g.arc(X(m), Y(c0.G[m]), 9, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(m), y0); g.lineTo(X(m), y1); g.stroke(); }
  // Legend.
  let lx = 26; g.font = '21px Geist, sans-serif';
  curves.filter((c) => c.label).forEach((c) => { g.fillStyle = c.color; g.fillRect(lx + 300, 30, 26, 8); g.fillStyle = '#c8cfdd'; g.fillText(c.label, lx + 334, 42); lx += 60 + g.measureText(c.label).width; });
  return { X, Y };
}
