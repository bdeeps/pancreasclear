// Chapter 3: inside an islet of Langerhans, and inside a beta cell.
// Islet make-up in humans: beta ≈ 55–60%, alpha ≈ 30–40%, delta ≈ 5–10%, mixed together
// (Cabrera et al., PNAS 103:2334, 2006; see pancreas.js). Beta cells make insulin, alpha cells
// glucagon, delta cells somatostatin (which damps both).
// How a beta cell senses glucose ("stimulus–secretion coupling"; Rorsman & Ashcroft, Physiol Rev
// 98:117, 2018; NIDDK; Guyton & Hall ch. 79):
//  1. glucose enters through GLUT transporters (mostly GLUT1 in humans, GLUT2 in rodents);
//  2. glucokinase and the mitochondria burn it, raising the cell's ATP (to ADP) ratio;
//  3. ATP closes ATP-sensitive K⁺ channels (K_ATP), so K⁺ stops leaking out and the membrane
//     voltage rises from about −70 mV towards −50 mV, where the cell fires bursts of spikes;
//  4. voltage-gated Ca²⁺ channels open and Ca²⁺ rushes in;
//  5. Ca²⁺ makes insulin granules fuse with the membrane and release insulin into the blood.
// Glucokinase is half-saturated at ~8 mmol/L glucose with a Hill coefficient ~1.7 (Matschinsky,
// Diabetes 45:223, 1996). Insulin release starts near ~5 mmol/L (90 mg/dL) and is half-maximal
// near ~8 mmol/L (Henquin, Diabetologia 52:739, 2009); the same S-curve drives glucose.js.
// A beta cell holds roughly 10,000 insulin granules (Rorsman & Renström, Diabetologia 46:1029, 2003).
// The voltage numbers below are a smooth, simplified stand-in for the bursting.
import { THREE, M, clamp, lerp, smooth } from '../kit.js';
import { makeIslet, ISLET_MIX, C, tint, fitNarrow, compactReadout, tissue, rnd, dots, pathOf, pipe, sceneView, fader } from '../pancreas.js';

const VIEWS = {
  islet: { pos: [-0.2, 6.2, 12.8], target: [-1.3, 5.5, 0] },
  beta: { pos: [-0.6, 5.9, 14.0], target: [-1.7, 5.4, 0] },
};
const NARROW = { islet: { pos: [0.4, 5.2, 16.5], target: [0.4, 5.6, 0] }, beta: { pos: [0.4, 4.8, 17], target: [0.4, 5.2, 0] } };
export const mM = (mg) => mg / 18.016;
export function betaCell(mg) {
  const g = mM(mg);
  const gk = g ** 1.7 / (g ** 1.7 + 8 ** 1.7);                  // glucokinase flux, 0..1
  const atp = lerp(1, 6, gk);                                     // ATP:ADP ratio, rough
  const kOpen = 1 / (1 + (atp / 2.2) ** 4);                       // fraction of K_ATP open
  const v = lerp(-70, -45, 1 - kOpen);                            // average membrane voltage
  const ca = smooth((v + 60) / 15);                               // Ca²⁺ channels opening
  const ins = g ** 4 / (g ** 4 + 7.8 ** 4);                       // insulin release, 0..1
  const glucagon = clamp(1.6 - g / 5, 0.15, 1.6) / 1.6;           // alpha cells: more when glucose is low
  return { g, gk, atp, kOpen, v, ca, ins, glucagon, burst: v > -55 };
}

export default {
  id: 'islets',
  short: 'Inside an islet',
  title: 'The islets: tiny hormone islands',
  subtitle: 'How a beta cell tastes the sugar in your blood and answers with insulin.',
  view: VIEWS.islet,
  learn: `<p>An <b>islet of Langerhans</b> is a ball of about a thousand to a few thousand cells, smaller than a grain of salt, wrapped in tiny blood vessels. There are about a million of them, scattered through the pancreas like islands in a sea of juice-making cells. The German student <b>Paul Langerhans</b> first saw them in 1869, without knowing what they did.</p>
    <p>An islet holds three main kinds of cell. <b>Beta cells</b> (about 55 to 60% in people) make <b>insulin</b>, which lowers blood sugar. <b>Alpha cells</b> (about 30 to 40%) make <b>glucagon</b>, which raises it. <b>Delta cells</b> (under 10%) make <b>somatostatin</b>, which calms both down. In humans the cell types are mixed together, and every cell is close to a blood vessel so its hormone can leave quickly.</p>
    <p>A beta cell does not need a brain to decide. It <b>measures sugar by burning it</b>. Glucose flows in, the cell's power stations turn it into the energy molecule <b>ATP</b>, and ATP <b>closes potassium (K⁺) channels</b>. That changes the voltage across the cell's skin, which <b>opens calcium (Ca²⁺) channels</b>. Calcium rushing in is the signal for thousands of tiny <b>insulin granules</b> to fuse with the surface and pour insulin into the blood. More sugar, more ATP, more insulin.</p>
    <p class="tip"><b>Try it:</b> slide the blood glucose up and down. Watch the K⁺ gate close, calcium flood in and insulin granules empty. At low glucose, see the alpha cells take over with glucagon.</p>`,
  terms: [
    { t: 'Islet of Langerhans', d: 'A tiny cluster of hormone-making cells in the pancreas. About a million of them make up 1 to 2% of the organ.' },
    { t: 'Beta cell', d: 'An islet cell that senses blood sugar and releases insulin.' },
    { t: 'Alpha cell', d: 'An islet cell that releases glucagon when blood sugar is low.' },
    { t: 'Insulin', d: 'A hormone that lets cells take in glucose and tells the liver to store it, so blood sugar falls.' },
    { t: 'Glucagon', d: 'A hormone that tells the liver to release glucose, so blood sugar rises.' },
    { t: 'ATP', d: 'The small molecule cells use to carry energy. In a beta cell, more ATP is the signal that sugar is high.' },
  ],
  defaults: { scene: 'islet', glucose: 150, highlight: 'all' },
  controls: [
    { key: 'scene', type: 'seg', label: 'Show', options: [{ v: 'islet', label: 'A whole islet' }, { v: 'beta', label: 'Inside a beta cell' }] },
    { key: 'glucose', type: 'range', label: 'Blood glucose', min: 50, max: 300, step: 1, ends: ['low', 'very high'], fmt: (v) => `${Math.round(v)} mg/dL (${mM(v).toFixed(1)} mmol/L)` },
    { key: 'highlight', type: 'seg', label: 'Highlight (islet)', options: [{ v: 'all', label: 'All' }, { v: 'beta', label: 'Beta' }, { v: 'alpha', label: 'Alpha' }, { v: 'delta', label: 'Delta' }] },
  ],
  quiz: [
    { q: 'Which islet cells make insulin?', options: ['Alpha cells', 'Beta cells', 'Delta cells', 'Acinar cells'], answer: 1, why: 'Beta cells make insulin. Alpha cells make glucagon, and delta cells make somatostatin.' },
    { q: 'In a beta cell, what closes the K⁺ channels when sugar is high?', options: ['Insulin', 'ATP made from burning glucose', 'Calcium', 'Glucagon'], answer: 1, why: 'Burning glucose raises ATP. ATP shuts the K⁺ channels, the voltage rises, calcium flows in and insulin is released.' },
    { q: 'What finally triggers the insulin granules to release?', options: ['Calcium flowing into the cell', 'Potassium leaving the cell', 'A nerve from the brain only', 'Stomach acid'], answer: 0, why: 'Calcium entering through voltage-gated channels makes the granules fuse with the cell surface.' },
  ],
  reel: [
    { ms: 6000, caption: 'Sugar in, ATP up, potassium gates shut, calcium floods in, and insulin pours out.', set: { scene: 'beta', highlight: 'all' }, anim: { glucose: [70, 220] }, view: { pos: [0.9, 5.0, 11.6], target: [0.4, 4.6, 0] }, spin: 0.1 },
  ],

  build({ stage }) {
    const L = (h, p, parent, cls) => tint(stage.label(h, p, parent), cls);
    // ============================================== a whole islet among acinar tissue
    const ig = new THREE.Group(); ig.position.set(0.9, 4.8, 0); stage.root.add(ig);
    const isl = makeIslet({ n: 460, R: 2.2 }); ig.add(isl.grp);
    // Acinar tissue around it: pale grape-bunches, cut away at the front.
    const acMat = tissue(0xe8a6c4, { opacity: 0.2, depthWrite: false });
    for (let i = 0; i < 26; i++) {
      const a = rnd(i) * Math.PI * 2, b = (rnd(i + 40) - 0.5) * 2.4, r = 3.5 + rnd(i + 80) * 0.8;
      const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8; if (z > 1.6) continue;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 + rnd(i + 9) * 0.3, 1), acMat); m.position.set(x, b, z); ig.add(m);
    }
    const insD = dots(60, new THREE.SphereGeometry(0.08, 8, 6), M.glow(C.insulin), ig);
    const glgD = dots(40, new THREE.SphereGeometry(0.08, 8, 6), M.glow(C.glucagon), ig);
    const iLabs = [L('Beta cells: insulin', [-3.3, -1.5, 1.4], ig, 'mint'), L('Alpha cells: glucagon', [2.2, 2.7, 1.0], ig, 'red'), L('Delta cells: somatostatin', [2.9, -2.4, 1.0], ig, 'blue'),
      L('Capillaries carry hormones away', [-2.6, -3.0, 0.6], ig, 'red'), L('About 0.15 mm across', [0.2, -3.3, 1.6], ig, '')];
    const mixMats = { beta: isl.meshes.beta.material, alpha: isl.meshes.alpha.material, delta: isl.meshes.delta.material };

    // ============================================== inside one beta cell
    const bg = new THREE.Group(); bg.position.set(0.4, 4.9, 0); stage.root.add(bg);
    const R = 3;
    const memb = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshPhysicalMaterial({ color: C.beta, roughness: 0.3, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }));
    memb.scale.set(1, 0.92, 0.7); bg.add(memb);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 8, 96), M.glow(C.beta, { transparent: true, opacity: 0.6 })); rim.scale.set(1, 0.92, 1); bg.add(rim);
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 16), M.matte(C.nucleus, { transparent: true, opacity: 0.85 })); nuc.position.set(-0.9, 1.0, -0.6); bg.add(nuc);
    const mitoMat = new THREE.MeshStandardMaterial({ color: 0xff9f5a, roughness: 0.5, emissive: new THREE.Color(0xff7a2a), emissiveIntensity: 0.2 });
    const mitos = [[-0.4, -0.3, 0.3, 0.6], [0.6, 0.7, 0.2, -0.4], [0.9, -0.9, -0.3, 1.1]].map(([x, y, z, r]) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 12), mitoMat); m.position.set(x, y, z); m.rotation.z = r; bg.add(m); return m; });
    // Channels in the membrane: GLUT (left), K_ATP (top), Ca²⁺ (right). Gates are discs that close.
    const chan = (pos, color, rotZ) => {
      const g = new THREE.Group(); g.position.set(...pos); g.rotation.z = rotZ; bg.add(g);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.1, 10, 24), M.plastic(color)); ring.rotation.x = Math.PI / 2; g.add(ring);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.5, 20, 1, true), M.plastic(color, { side: THREE.DoubleSide, transparent: true, opacity: 0.7 })); g.add(body);
      const gate = new THREE.Mesh(new THREE.CircleGeometry(0.26, 20), M.glow(0xffffff, { side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); gate.rotation.x = Math.PI / 2; g.add(gate);
      return { g, gate };
    };
    const glut = chan([-R, 0.1, 0], 0xdfe7f5, Math.PI / 2), katp = chan([0.9, R * 0.92 - 0.05, 0], 0xb18cff, 0.1), cach = chan([R * 0.97, -0.9, 0], C.calcium, -Math.PI / 2 + 0.3);
    glut.gate.visible = false;
    const cap = pipe([[-5.2, -3.9, 0.2], [0, -3.7, 0.4], [5.2, -3.9, 0.2]], 0.42, tissue(C.artery, { opacity: 0.55, depthWrite: false }), 30); bg.add(cap);
    const NGr = 70, gr = dots(NGr, new THREE.SphereGeometry(0.13, 12, 8), M.plastic(C.insulin, { emissive: new THREE.Color(0x0f4a33) }), bg);
    const grHome = []; for (let i = 0; i < NGr; i++) { const a = rnd(i) * 6.283, r = 0.9 + rnd(i + 3) * 1.6, y = -rnd(i + 5) * 2.2 + 0.2; grHome.push([Math.cos(a) * r * 0.9, y, Math.sin(a) * r * 0.45]); }
    const glu = dots(24, new THREE.CylinderGeometry(0.14, 0.14, 0.06, 6), M.glow(0xffffff), bg);
    const atpD = dots(30, new THREE.SphereGeometry(0.07, 8, 6), M.glow(C.atp), bg);
    const kD = dots(18, new THREE.SphereGeometry(0.1, 8, 6), M.glow(0xb18cff), bg);
    const caD = dots(30, new THREE.SphereGeometry(0.09, 8, 6), M.glow(C.calcium), bg);
    const insOut = dots(60, new THREE.SphereGeometry(0.07, 8, 6), M.glow(C.insulin), bg);
    const bLabs = [
      L('<b>1</b> Glucose enters (GLUT)', [-R - 1.6, 0.8, 0.4], bg, ''), L('<b>2</b> Burned for ATP', [0.2, -0.35, 1.2], bg, 'gold'),
      L('<b>3</b> ATP shuts K⁺ channels', [1.4, R + 0.55, 0.3], bg, 'violet'), L('<b>4</b> Ca²⁺ rushes in', [R + 1.4, -0.1, 0.3], bg, 'gold'),
      L('<b>5</b> Insulin granules release', [2.6, -2.9, 0.8], bg, 'mint'), L('Nucleus', [-1.7, 1.9, 0.2], bg, 'violet'), L('Blood capillary', [-4.4, -3.3, 0.4], bg, 'red'),
    ];

    let t = 0, gS = 150, fade = { islet: 1, beta: 0 };
    const setI = fader(ig), setB = fader(bg);
    const view = sceneView(stage, VIEWS, NARROW), fit = fitNarrow(stage, NARROW.islet);
    const p = new THREE.Vector3();
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        view(s.scene); const narrow = fit();
        gS += (s.glucose - gS) * Math.min(1, dt * 3);
        const b = betaCell(gS);
        ['islet', 'beta'].forEach((k) => { fade[k] += ((s.scene === k ? 1 : 0) - fade[k]) * Math.min(1, dt * 6); });
        setI(fade.islet); setB(fade.beta);
        iLabs.forEach((l, i) => { l.visible = ig.visible && fade.islet > 0.5 && (!narrow || i < 2); });
        bLabs.forEach((l, i) => { l.visible = bg.visible && fade.beta > 0.5 && (!narrow || i === 2 || i === 4); });
        if (ig.visible) {
          ig.rotation.y = 0.15 * Math.sin(t * 0.2);
          Object.entries(mixMats).forEach(([k, m]) => {
            const on = s.highlight === 'all' || s.highlight === k;
            m.opacity = (on ? 1 : 0.12) * fade.islet; m.depthWrite = on && fade.islet > 0.99;
            const pulse = k === 'beta' ? b.ins : k === 'alpha' ? b.glucagon : 0.3;
            m.emissive = m.emissive || new THREE.Color(); m.emissive.set(C[k]).multiplyScalar(0.12 + 0.45 * pulse * (0.6 + 0.4 * Math.sin(t * 4)));
          });
          // Hormones leave through the capillaries: insulin (green) with sugar, glucagon (red) when low.
          for (let i = 0; i < 60; i++) {
            if (i / 60 > b.ins) { insD.hide(i); continue; }
            const c = isl.caps[i % isl.caps.length].userData.path, ph = (t * 0.2 + rnd(i)) % 1; c.at(ph, p); insD.put(i, p.x, p.y + 0.12, p.z);
          }
          for (let i = 0; i < 40; i++) {
            if (i / 40 > b.glucagon - 0.12) { glgD.hide(i); continue; }
            const c = isl.caps[(i + 2) % isl.caps.length].userData.path, ph = (t * 0.2 + rnd(i + 50)) % 1; c.at(ph, p); glgD.put(i, p.x, p.y - 0.12, p.z);
          }
          insD.done(); glgD.done();
        }
        if (bg.visible) {
          // 1: glucose in through GLUT to the mitochondria.
          const nG = Math.round(24 * clamp(b.g / 14, 0.05, 1));
          for (let i = 0; i < 24; i++) {
            if (i >= nG) { glu.hide(i); continue; }
            const ph = (t * 0.3 + i / 24) % 1, m = mitos[i % 3].position;
            if (ph < 0.4) glu.put(i, lerp(-R - 2.4, -R, ph / 0.4), 0.1 + (rnd(i) - 0.5) * 0.3, (rnd(i + 1) - 0.5) * 0.3, 1, Math.PI / 2);
            else glu.put(i, lerp(-R, m.x, (ph - 0.4) / 0.6), lerp(0.1, m.y, (ph - 0.4) / 0.6), lerp(0, m.z, (ph - 0.4) / 0.6), 1 - (ph - 0.4), Math.PI / 2);
          }
          glu.done();
          mitoMat.emissiveIntensity = 0.15 + 0.9 * b.gk;
          // 2: ATP drifts from mitochondria to the K_ATP channel.
          for (let i = 0; i < 30; i++) {
            if (i / 30 > b.gk * 1.1) { atpD.hide(i); continue; }
            const ph = (t * 0.35 + i / 30) % 1, m = mitos[i % 3].position, k = katp.g.position;
            atpD.put(i, lerp(m.x, k.x, ph) + Math.sin(i + t) * 0.1, lerp(m.y, k.y - 0.4, ph), lerp(m.z, 0, ph));
          }
          atpD.done();
          // 3: K⁺ leaks out while the channel is open; the gate closes as ATP rises.
          katp.gate.scale.setScalar(clamp(1 - b.kOpen, 0.05, 1));
          for (let i = 0; i < 18; i++) {
            if (i / 18 > b.kOpen) { kD.hide(i); continue; }
            const ph = (t * 0.6 + i / 18) % 1, k = katp.g.position; kD.put(i, k.x + (rnd(i) - 0.5) * 0.3, lerp(k.y - 0.8, k.y + 1.3, ph), (rnd(i + 2) - 0.5) * 0.3);
          }
          kD.done();
          // 4: Ca²⁺ in when the voltage rises.
          cach.gate.scale.setScalar(clamp(1 - b.ca, 0.05, 1));
          for (let i = 0; i < 30; i++) {
            if (i / 30 > b.ca) { caD.hide(i); continue; }
            const ph = (t * 0.5 + i / 30) % 1, c = cach.g.position; caD.put(i, lerp(c.x + 1.6, c.x - 1.6, ph), c.y + (rnd(i) - 0.5) * 0.5 - ph * 0.6, (rnd(i + 3) - 0.5) * 0.6);
          }
          caD.done();
          // 5: granules move to the bottom membrane and fuse, releasing insulin into the capillary.
          for (let i = 0; i < NGr; i++) {
            const [x, y, z] = grHome[i], moving = i / NGr < b.ins, ph = (t * 0.25 + rnd(i + 11)) % 1;
            if (!moving) { gr.put(i, x, y, z); continue; }
            const yy = lerp(y, -R * 0.9 + 0.15, smooth(ph * 1.6));
            gr.put(i, x * (1 - 0.3 * ph), yy, z, ph > 0.8 ? lerp(1, 0.2, (ph - 0.8) / 0.2) : 1);
          }
          gr.done();
          for (let i = 0; i < 60; i++) {
            if (i / 60 > b.ins) { insOut.hide(i); continue; }
            const ph = (t * 0.3 + rnd(i + 30)) % 1, x0 = (rnd(i) - 0.5) * 3.4;
            insOut.put(i, x0 + ph * 2.2, lerp(-R * 0.92, -3.75, Math.min(1, ph * 3)), 0.3 + (rnd(i + 2) - 0.5) * 0.4);
          }
          insOut.done();
          memb.material.emissive = memb.material.emissive || new THREE.Color(); memb.material.emissive.set(0xffd166).multiplyScalar(b.burst ? 0.25 * Math.max(0, Math.sin(t * 9)) : 0);
        }
      },
      readout: (s) => {
        const b = betaCell(s.glucose), mg = Math.round(s.glucose);
        const lvl = mg < 70 ? 'low' : mg < 100 ? 'normal fasting' : mg < 140 ? 'normal after a meal' : mg < 200 ? 'high' : 'very high';
        if (s.scene === 'islet') return `<div class="big">Glucose ${mg} mg/dL: ${lvl}</div>
          <div class="row"><span>Beta cells (insulin)</span><b>about ${Math.round(ISLET_MIX.beta * 100)}% of the islet</b></div>
          <div class="row"><span>Alpha cells (glucagon)</span><b>about ${Math.round(ISLET_MIX.alpha * 100)}%</b></div>
          <div class="row"><span>Insulin release</span><b>${Math.round(b.ins * 100)}% of maximum</b></div>
          <div class="row"><span>Glucagon release</span><b>${b.glucagon > 0.6 ? 'high' : b.glucagon > 0.3 ? 'medium' : 'low'}</b></div>
          <small>Green dots: insulin. Red dots: glucagon. A real islet is about 0.15 mm across, and an adult has roughly a million of them.</small>`;
        return `<div class="big">Glucose ${mg} mg/dL (${b.g.toFixed(1)} mmol/L)</div>
          <div class="row"><span>ATP : ADP (rough)</span><b>${b.atp.toFixed(1)}</b></div>
          <div class="row"><span>K⁺ channels open</span><b>${Math.round(b.kOpen * 100)}%</b></div>
          <div class="row"><span>Membrane voltage</span><b>about ${Math.round(b.v)} mV${b.burst ? ', firing' : ''}</b></div>
          <div class="row"><span>Insulin release</span><b>${Math.round(b.ins * 100)}% of maximum</b></div>
          <small>Simplified. A beta cell holds about 10,000 insulin granules. Real cells fire bursts of electrical spikes when glucose is high.</small>`;
      },
    });
  },
};
