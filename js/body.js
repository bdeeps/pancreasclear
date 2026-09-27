// A stylised "whole body" loop for the glucose and diabetes chapters: the blood circulates past
// the gut (glucose in from food), the liver (stores glucose as glycogen when insulin is high,
// releases it when insulin is low and glucagon is high), muscle and fat (take glucose in when
// insulin opens their GLUT4 "doors"; working muscle also takes it in without insulin), the brain
// (uses ~100–120 g of glucose a day whatever the insulin level) and the kidneys (spill glucose into
// urine above ~180 mg/dL). The pancreas's islets sit in the middle, reading the blood.
// Sources: NIDDK "What is diabetes?"; Guyton & Hall ch. 79; Gerich, Diabetes Care 16 S3:9, 1993;
// Richter & Hargreaves, Physiol Rev 93:993, 2013. Not to scale: organs are placed for clarity.
// The flows come from the state of glucose.js at the current minute.
import { THREE, M, clamp, lerp } from './kit.js';
import { C, tint, rnd, dots, pathOf, organ, lumpy, lumpyBlob, blob, tissue, makeIslet } from './pancreas.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function makeBody(stage, { kidney = false, islet = false } = {}) {
  const root = new THREE.Group();
  const L = (h, p, cls) => tint(stage.label(h, p, root), cls);
  // Organs.
  const brain = lumpyBlob(tissue(0xf0a8b8), [0, 2.5, -0.2], [1.1, 0.75, 0.8], 0.08, 3);
  const liver = lumpyBlob(tissue(0x9a3f30), [-3.3, 0.9, -0.2], [1.7, 1.0, 0.9], 0.05, 5);
  const panc = organ([[-1.3, -0.7, 0], [-0.5, -0.45, 0.2], [0.7, -0.3, 0.1], [1.6, 0.05, -0.2]], lumpy((u) => lerp(0.42, 0.22, u)), tissue(C.pancreas, { roughness: 0.6 }), { segs: 60, radial: 24, squash: 0.7 });
  const muscle = new THREE.Group(); muscle.position.set(3.4, 0.9, -0.2);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, r = i === 0 ? 0 : 0.38; const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 1.6, 6, 12), tissue(0xc8424f)); m.rotation.z = Math.PI / 2; m.position.set(0, Math.cos(a) * r * (i ? 1 : 0), Math.sin(a) * r * (i ? 1 : 0)); muscle.add(m); }
  const fat = new THREE.Group(); fat.position.set(2.9, -1.6, 0);
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.3 + rnd(i) * 0.12, 16, 12), tissue(0xffe08a, { roughness: 0.35 })); m.position.set((rnd(i + 1) - 0.5) * 1.5, (rnd(i + 2) - 0.5) * 0.8, (rnd(i + 3) - 0.5) * 0.7); fat.add(m); }
  const gutPts = []; for (let k = 0; k <= 40; k++) { const u = k / 40; gutPts.push(V(-3.2 + u * 1.9 + 0.3 * Math.sin(u * 19), -1.7 + 0.45 * Math.cos(u * 13), 0.2 * Math.sin(u * 9))); }
  const gut = organ(gutPts, () => 0.2, tissue(0xe0837f), { segs: 160, radial: 14 });
  root.add(brain, liver, panc, muscle, fat, gut);
  let kid = null;
  if (kidney) { kid = new THREE.Group(); kid.position.set(-0.2, -2.6, -0.6); [-0.7, 0.7].forEach((x) => { const k = blob(tissue(0xa0463f), [x, 0, 0], [0.34, 0.55, 0.3], [0, 0, x > 0 ? -0.3 : 0.3]); kid.add(k); }); root.add(kid); }
  let isl = null;
  if (islet) { isl = makeIslet({ n: 150, R: 0.62 }); isl.grp.position.set(0.1, -1.55, 0.9); root.add(isl.grp); }
  // The blood loop.
  const loopPts = [V(0, 1.75, 0.6), V(-2.2, 1.6, 0.6), V(-3.7, -0.2, 0.6), V(-2.2, -2.3, 0.6), V(0, -2.2, 0.8), V(2.4, -2.4, 0.6), V(4.0, -0.4, 0.6), V(2.3, 1.7, 0.6)];
  const loop = pathOf(loopPts.concat([loopPts[0]]));
  const loopMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loopPts, true), 160, 0.16, 10, true), tissue(C.artery, { opacity: 0.35, depthWrite: false }));
  root.add(loopMesh);
  const loopC = new THREE.CatmullRomCurve3(loopPts, true);
  const NGl = 120, glu = dots(NGl, new THREE.CylinderGeometry(0.1, 0.1, 0.05, 6), M.glow(0xffffff), root);
  const NH = 50, ins = dots(NH, new THREE.SphereGeometry(0.075, 8, 6), M.glow(C.insulin), root), glg = dots(30, new THREE.SphereGeometry(0.075, 8, 6), M.glow(C.glucagon), root);
  // Side streams between the loop and each organ.
  const mkStream = (from, to, n, color) => ({ from: V(...from), to: V(...to), m: dots(n, new THREE.SphereGeometry(0.075, 8, 6), M.glow(color), root), n });
  const streams = {
    gut: mkStream([-2.4, -1.6, 0.2], [-2.6, -2.2, 0.6], 16, 0xffffff),
    muscle: mkStream([2.8, 1.6, 0.6], [3.2, 1.0, 0.1], 22, 0xffffff),
    fat: mkStream([2.9, -2.3, 0.6], [2.9, -1.6, 0.2], 16, 0xffffff),
    liverIn: mkStream([-2.5, 1.4, 0.6], [-3.1, 0.9, 0.1], 18, 0xffffff),
    liverOut: mkStream([-3.6, 0.3, 0.1], [-3.7, -0.3, 0.6], 18, 0xffe08a),
    brain: mkStream([0.2, 1.75, 0.6], [0.1, 2.3, 0.1], 10, 0xffffff),
    urine: mkStream([-0.2, -2.25, 0.8], [-0.2, -3.6, -0.2], 16, 0xffe066),
  };
  const labs = {
    brain: L('Brain: uses glucose all day', [0, 3.55, 0], 'pink'),
    liver: L('Liver (LiverClear)', [-3.6, 2.2, 0], 'brown'),
    muscle: L('Muscle', [3.6, 1.95, 0], 'red'),
    fat: L('Fat', [3.9, -1.3, 0], 'gold'),
    gut: L('Gut: glucose from food', [-4.4, -2.3, 0.4], 'pink'),
    panc: L('Pancreas', [1.5, 0.55, 0], 'gold'),
    kid: kidney ? L('Kidneys', [1.5, -2.7, -0.6], 'brown') : null,
    isl: islet ? L('Its islets', [-1.3, -1.0, 1.0], 'mint') : null,
  };
  const liverMat = liver.material, liverBase = new THREE.Color(0x9a3f30), liverStore = new THREE.Color(0xc27a4a);
  const p = new THREE.Vector3();
  let t = 0;
  const runStream = (st, rate, speed = 0.8) => {
    const k = clamp(rate, 0, 1);
    for (let i = 0; i < st.n; i++) {
      if (i / st.n >= k) { st.m.hide(i); continue; }
      const ph = (t * speed + i / st.n) % 1; p.lerpVectors(st.from, st.to, ph);
      st.m.put(i, p.x + (rnd(i) - 0.5) * 0.18, p.y + (rnd(i + 1) - 0.5) * 0.18, p.z, 1, Math.PI / 2);
    }
    st.m.done();
  };
  return {
    root, labs, isl,
    // st: { G, I, gluc, ra, uptake, liver, urine, walking, beta (0..1 beta-cell health), attack (0..1) }
    update(dt, st) {
      t += dt;
      // Glucose on the loop: the number of dots follows blood glucose.
      const nG = Math.round(NGl * clamp(st.G / 400, 0.05, 1));
      for (let i = 0; i < NGl; i++) {
        if (i >= nG) { glu.hide(i); continue; }
        const u = (t * 0.06 + i / nG) % 1; loopC.getPointAt(u, p);
        glu.put(i, p.x + (rnd(i) - 0.5) * 0.2, p.y + (rnd(i + 5) - 0.5) * 0.2, p.z + (rnd(i + 9) - 0.5) * 0.2, 1, Math.PI / 2, i);
      }
      glu.done();
      const nI = Math.round(NH * clamp(st.I / 60, 0, 1));
      for (let i = 0; i < NH; i++) {
        if (i >= nI) { ins.hide(i); continue; }
        const u = (t * 0.06 + (i + 0.5) / Math.max(1, nI)) % 1; loopC.getPointAt(u, p);
        ins.put(i, p.x + (rnd(i + 3) - 0.5) * 0.24, p.y + 0.12, p.z + 0.15);
      }
      ins.done();
      const nC = Math.round(30 * clamp((st.gluc - 0.8) / 1.5, 0, 1));
      for (let i = 0; i < 30; i++) {
        if (i >= nC) { glg.hide(i); continue; }
        const u = (t * 0.06 + (i + 0.3) / Math.max(1, nC)) % 1; loopC.getPointAt(u, p);
        glg.put(i, p.x, p.y - 0.14, p.z + 0.1);
      }
      glg.done();
      // Flows (mg/dL per minute) scaled to 0..1 for the streams.
      const store = clamp(-(st.liver - 1.05) / 1.0, 0, 1), release = clamp((st.liver - 0.35) / 1.6, 0, 1);
      runStream(streams.gut, st.ra / 3.5);
      runStream(streams.muscle, st.uptake / 2.4 + (st.walking ? 0.5 : 0), st.walking ? 1.4 : 0.8);
      runStream(streams.fat, st.uptake / 4);
      runStream(streams.liverIn, store);
      runStream(streams.liverOut, release);
      runStream(streams.brain, 0.5);
      runStream(streams.urine, st.urine / 250);
      liverMat.color.copy(liverBase).lerp(liverStore, store * 0.6);
      muscle.children.forEach((m, i) => { m.scale.y = st.walking ? 1 + 0.12 * Math.sin(t * 8 + i) : 1; });
      if (isl) {
        const bm = isl.meshes.beta.material; bm.opacity = clamp(st.beta ?? 1, 0.06, 1); bm.transparent = true;
        bm.emissive = bm.emissive || new THREE.Color(); bm.emissive.set(C.beta).multiplyScalar(0.5 * clamp(st.I / 60, 0, 1) * (st.beta ?? 1));
      }
    },
  };
}

// Side by side on wide screens (board lower left, body right, clear of the readout); stacked on
// tall ones (phones and vertical videos), with the board under the body.
export function layout(stage, body, board, extra = null) {
  const stacked = stage.host.clientWidth < 560 || stage.host.clientWidth / Math.max(1, stage.host.clientHeight) < 0.9;
  if (stacked) { body.root.position.set(0.8, 6.3, 0); body.root.scale.setScalar(0.74); board.position.set(0.8, 2.0, 1.0); }
  else { body.root.position.set(3.85, 4.8, 0); body.root.scale.setScalar(0.66); board.position.set(-1.6, 2.1, 1.0); }
  if (extra) extra(stacked);
  return stacked;
}
