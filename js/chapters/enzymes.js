// Chapter 2: the exocrine pancreas, the digestive-juice factory.
// Acinar cells (~98% of the gland's volume with the ducts) store enzymes in zymogen granules at the
// cell's tip and release them into the tiny central space of the acinus; duct cells add water and
// bicarbonate. About 1–1.5 L of juice a day, pH ≈ 8 (Guyton & Hall, 14th ed., ch. 65; Pandol,
// "The Exocrine Pancreas", Morgan & Claypool 2010, NCBI Bookshelf NBK54128).
// Enzymes: amylase (starch), lipase with colipase (fat), and proteases made as inactive
// precursors ("zymogens"): trypsinogen, chymotrypsinogen, procarboxypeptidase, proelastase.
// Trypsinogen is switched on only in the duodenum by enteropeptidase (enterokinase) on the brush
// border; trypsin then activates the rest. Inside the pancreas, a trypsin inhibitor (SPINK1) mops
// up any trypsin that switches on early (Guyton & Hall ch. 65; Whitcomb, NEJM 2006; NIDDK
// "Pancreatitis"). When this protection fails, enzymes activate inside the gland: pancreatitis.
// Hormones: when acid chyme (pH < ~4.5) enters the duodenum, S cells release SECRETIN, which tells
// duct cells to pour out bicarbonate-rich fluid; fat and protein make I cells release
// CHOLECYSTOKININ (CCK), which tells acinar cells to release enzymes and the gallbladder to squeeze
// (Bayliss & Starling 1902 discovered secretin; Guyton & Hall ch. 65). Nerves (the vagus) add a
// smaller push when you see, smell or taste food.
// Bicarbonate: at high flow, juice carries up to ~145 mmol/L of bicarbonate, about five times
// the level in plasma (~25 mmol/L), and at low flow much less (Guyton & Hall ch. 65;
// the curve is well known from secretin tests). Stomach chyme arrives at pH ≈ 2 and is brought
// close to neutral (pH ≈ 6–7) in the duodenum.
import { THREE, M, clamp, lerp, smooth } from '../kit.js';
import { makeAbdomen, PATHS, AMPULLA, C, tint, fitNarrow, compactReadout, tissue, rnd, dots, pathOf, pipe, sceneView } from '../pancreas.js';

const VIEWS = {
  acinus: { pos: [-0.4, 5.4, 14.2], target: [-0.9, 5.0, 0] },
  duodenum: { pos: [-2.8, 6.1, 14.5], target: [-2.6, 5.5, 0] },
};
const NARROW = { acinus: { pos: [1.2, 4.3, 17.5], target: [1.2, 4.5, 0] }, duodenum: { pos: [-0.8, 5.4, 16], target: [-0.8, 5.6, 0] } };
// Bicarbonate in the juice rises with flow (Guyton & Hall ch. 65): ~30 mmol/L at a trickle, ~145 at full flow.
export const bicarb = (flow) => Math.round(lerp(30, 145, clamp(flow, 0, 1)));

export default {
  id: 'enzymes',
  short: 'The juice factory',
  title: 'The digestive-juice factory',
  subtitle: 'Enzymes made safe, bicarbonate to kill the acid, and hormones that say "food is here".',
  view: VIEWS.acinus,
  learn: `<p>Almost all of the pancreas is made of tiny clusters of cells called <b>acini</b> (from the Latin for "grapes"). Each <b>acinar cell</b> is a busy factory. It builds digestive <b>enzymes</b>, packs them into little parcels called <b>zymogen granules</b> at its tip, and releases them into a tiny channel in the middle. Channels join into bigger ducts, like streams into a river, and end at the duodenum. You make about <b>1 to 1.5 litres</b> of pancreatic juice a day.</p>
    <p>The juice holds three main kinds of enzyme: <b>amylase</b> cuts starch, <b>lipase</b> cuts fats, and <b>proteases</b> such as <b>trypsin</b> cut proteins. Here is the clever part: the pancreas is made of protein too. So the proteases are made <b>switched off</b>, as <b>trypsinogen</b> and friends. Only in the duodenum does an enzyme on the gut lining, <b>enteropeptidase</b>, snip trypsinogen into active <b>trypsin</b>, which then switches on the others. The pancreas never digests itself, as long as the lock holds. You can watch these enzymes cut up a real meal in <a href="/intestineclear/#digest">IntestineClear</a>.</p>
    <p>The cells lining the ducts add water and <b>bicarbonate</b>, the same stuff as baking soda. Food arrives from the stomach (see <b>StomachClear</b>) as an acidic soup at about pH 2, and bicarbonate neutralises it.</p>
    <p>How does the pancreas know food has arrived? Hormones. Acid in the duodenum makes it release <b>secretin</b> into the blood, which says "send bicarbonate". Fat and protein make it release <b>cholecystokinin (CCK)</b>, which says "send enzymes", and also squeezes the gallbladder. Secretin, found in 1902, was the <b>first hormone ever discovered</b>.</p>
    <p class="tip"><b>Try it:</b> switch secretin and CCK on and off and watch what flows. Then open the duodenum and switch off the safety lock to see why early trypsin is dangerous.</p>`,
  terms: [
    { t: 'Acinus', d: 'A grape-like cluster of enzyme-making cells around a tiny central channel. Plural: acini.' },
    { t: 'Zymogen', d: 'An enzyme made in an inactive form, so it cannot do damage until it is switched on.' },
    { t: 'Trypsinogen and trypsin', d: 'Trypsinogen is the switched-off form. In the gut, enteropeptidase turns it into trypsin, which cuts proteins and switches on other enzymes.' },
    { t: 'Bicarbonate', d: 'A base, like baking soda, that neutralises stomach acid in the duodenum.' },
    { t: 'Secretin', d: 'A hormone released by the duodenum when acid arrives. It tells the pancreas to send bicarbonate. The first hormone ever discovered, in 1902.' },
    { t: 'CCK (cholecystokinin)', d: 'A hormone released by the duodenum when fat and protein arrive. It tells the pancreas to send enzymes and the gallbladder to squeeze out bile.' },
  ],
  defaults: { scene: 'acinus', meal: true, secretin: true, cck: true, lock: true },
  controls: [
    { key: 'scene', type: 'seg', label: 'Show', options: [{ v: 'acinus', label: 'Inside an acinus' }, { v: 'duodenum', label: 'Into the duodenum' }] },
    { key: 'meal', type: 'toggle', label: 'A meal has arrived' },
    { key: 'secretin', type: 'toggle', label: 'Secretin signal (acid → send bicarbonate)' },
    { key: 'cck', type: 'toggle', label: 'CCK signal (fat and protein → send enzymes)' },
    { key: 'lock', type: 'toggle', label: 'Safety lock: trypsin stays off until the gut' },
  ],
  quiz: [
    { q: 'Why is trypsin made as inactive trypsinogen?', options: ['It is cheaper to make', 'So it cannot digest the pancreas itself', 'Because it only works in the stomach', 'To make it smaller'], answer: 1, why: 'The pancreas is made of protein. Keeping protein-cutting enzymes switched off until they reach the gut protects it.' },
    { q: 'What switches on trypsinogen?', options: ['Stomach acid', 'Insulin', 'Enteropeptidase on the lining of the duodenum', 'Bile'], answer: 2, why: 'Enteropeptidase, fixed on the duodenum’s lining, snips trypsinogen into trypsin. Trypsin then switches on the other enzymes.' },
    { q: 'Acid chyme arrives in the duodenum. Which hormone tells the pancreas to send bicarbonate?', options: ['Secretin', 'Insulin', 'Glucagon', 'Adrenaline'], answer: 0, why: 'Acid makes the duodenum release secretin into the blood. The duct cells answer with bicarbonate-rich juice.' },
  ],
  reel: [
    { ms: 5200, caption: 'Grape-like clusters of cells pack digestive enzymes into tiny parcels, then release them into the ducts.', set: { scene: 'acinus', meal: true, secretin: true, cck: true, lock: true }, view: { pos: [2.5, 4.6, 12.0], target: [0.4, 3.9, 0] }, spin: 0.25 },
    { ms: 5600, caption: 'Trypsin leaves switched off. Only inside the gut is it switched on, so the pancreas never digests itself.', set: { scene: 'duodenum', meal: true, secretin: true, cck: true, lock: true }, view: { pos: [-1.2, 5.0, 11.8], target: [0.0, 4.3, 0] }, spin: 0.2 },
  ],

  build({ stage }) {
    const L = (h, p, parent, cls) => tint(stage.label(h, p, parent), cls);
    // ============================================== the acinus (a slice through one, ~0.04 mm across)
    const ag = new THREE.Group(); ag.position.set(-0.9, 3.9, 0); stage.root.add(ag);
    const NC = 11, r0 = 0.42, r1 = 2.1, depth = 1.6, cells = [];
    const cellMat = new THREE.MeshPhysicalMaterial({ color: 0xe8a6c4, roughness: 0.5, clearcoat: 0.3, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
    const cellRed = new THREE.Color(0xff5050), cellCol = new THREE.Color(0xe8a6c4);
    for (let i = 0; i < NC; i++) {
      if (i === 0) continue;                       // the gap where the duct leaves
      const a0 = (i - 0.5) / NC * Math.PI * 2 + 0.03, a1 = (i + 0.5) / NC * Math.PI * 2 - 0.03;
      const sh = new THREE.Shape();
      sh.moveTo(r0 * Math.cos(a0), r0 * Math.sin(a0)); sh.lineTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
      sh.absarc(0, 0, r1, a0, a1, false); sh.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1)); sh.absarc(0, 0, r0, a1, a0, true);
      const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 8 });
      geo.translate(0, 0, -depth / 2);
      const m = new THREE.Mesh(geo, cellMat); ag.add(m); cells.push({ m, a: (a0 + a1) / 2 });
      const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), M.matte(C.nucleus)); nuc.scale.set(1, 1, 1.3);
      nuc.position.set(1.62 * Math.cos((a0 + a1) / 2), 1.62 * Math.sin((a0 + a1) / 2), 0); ag.add(nuc);
    }
    // Zymogen granules packed at each cell's tip (apical end, next to the central channel).
    const NGc = 14, NG = (NC - 1) * NGc;
    const gran = dots(NG, new THREE.SphereGeometry(0.085, 10, 8), M.plastic(C.enzyme), ag);
    const granHome = [];
    cells.forEach((c, ci) => { for (let k = 0; k < NGc; k++) { const a = c.a + (rnd(ci * 50 + k) - 0.5) * 0.36, r = lerp(0.62, 1.2, rnd(ci * 50 + k + 20)), z = (rnd(ci * 50 + k + 40) - 0.5) * 1.2; granHome.push([r * Math.cos(a), r * Math.sin(a), z]); } });
    granHome.forEach((p, i) => gran.put(i, ...p)); gran.done();
    // The intercalated duct leaving through the gap, lined with small duct cells.
    const ductMat = tissue(0x9fd6ff, { opacity: 0.25, depthWrite: false });
    const duct = pipe([[0.25, 0, 0], [1.6, 0, 0], [3.2, 0.2, 0], [5.4, 0.6, 0]], 0.3, ductMat, 40); ag.add(duct);
    const dcMat = new THREE.MeshPhysicalMaterial({ color: 0x7fb8ff, roughness: 0.5, transparent: true, opacity: 0.5, depthWrite: false });
    const ductCells = [];
    for (let k = 0; k < 7; k++) for (let j = 0; j < 6; j++) {
      const u = 0.12 + k * 0.125, p = duct.userData.path.at(u), a = (j / 6) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.3), dcMat); b.position.set(p.x, p.y + Math.cos(a) * 0.46, p.z + Math.sin(a) * 0.46); b.rotation.x = a; ag.add(b); ductCells.push(b);
    }
    const cap = pipe([[-3.6, -2.7, -1.0], [-1.0, -2.55, -1.1], [1.8, -2.1, -0.9], [5.4, -1.3, -0.8]], 0.2, tissue(C.artery, { opacity: 0.75 }), 40); ag.add(cap);
    const lumenFlow = dots(90, new THREE.SphereGeometry(0.07, 8, 6), M.glow(C.enzyme), ag);
    const hco3 = dots(90, new THREE.SphereGeometry(0.06, 8, 6), M.glow(C.bicarb), ag);
    const horm = dots(40, new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), ag);
    for (let i = 0; i < 40; i++) horm.setColorAt(i, new THREE.Color(i % 2 ? C.secretin : C.cck));
    const aLabs = [
      L('Acinar cell', [-1.9, 1.9, 0.9], ag, 'pink'), L('Zymogen granules (enzymes, switched off)', [-2.3, -0.9, 1.0], ag, 'gold'),
      L('Nucleus', [0.2, 2.3, 0.9], ag, 'violet'), L('Duct cells add water + bicarbonate', [3.6, 1.35, 0.4], ag, 'blue'),
      L('Blood capillary: hormones arrive', [3.6, -2.25, -0.8], ag, 'red'), L('To the main duct →', [5.6, 0.95, 0], ag, 'side'),
      L('About 0.04 mm across', [-3.4, -1.9, 1.0], ag, ''),
    ];

    // ============================================== the duodenum: juice meets chyme
    const dg = new THREE.Group(); dg.position.set(0.2, 4.2, 0); dg.scale.setScalar(0.72); stage.root.add(dg);
    const ab = makeAbdomen(stage, { neighbours: false, vessels: false }); dg.add(ab.root);
    ab.mats.panc.opacity = 0.5; ab.mats.panc.depthWrite = false; ab.mats.duo.opacity = 0.42; ab.mats.duo.depthWrite = false;
    const duoP = pathOf(PATHS.duodenum), mainP = pathOf(PATHS.mainDuct), bileP = pathOf(PATHS.bileDuct);
    // Where the ampulla opens along the duodenum.
    let uAmp = 0, best = 1e9; for (let k = 0; k <= 200; k++) { const d = duoP.at(k / 200).distanceTo(AMPULLA); if (d < best) { best = d; uAmp = k / 200; } }
    const stomachStub = pipe([[2.2, 2.9, 2.3], [1.0, 2.55, 2.0], [0.0, 2.55, 1.5]], 0.75, tissue(C.stomach, { opacity: 0.3, depthWrite: false }), 20); dg.add(stomachStub);
    // Enteropeptidase on the lining just past the ampulla (drawn as green studs).
    const ep = dots(14, new THREE.SphereGeometry(0.1, 10, 8), M.glow(0x9be37a), dg);
    for (let k = 0; k < 14; k++) { const p = duoP.at(uAmp + 0.02 + k * 0.012); ep.put(k, p.x - 0.52 * (k % 2 ? 1 : 0.2), p.y, p.z + (k % 2 ? 0.1 : 0.5)); } ep.done();
    // Hormone route: from the duodenal wall into the blood, round to the pancreas.
    const hormP = pathOf([[-4.5, 1.9, 0.6], [-6.0, 3.2, 1.6], [-3.0, 4.3, 2.0], [0.8, 3.7, 1.4], [1.8, 2.4, 0.9], [1.2, 1.5, 0.5]]);
    const hormLine = new THREE.Mesh(new THREE.TubeGeometry(hormP.curve, 60, 0.05, 6), M.ghost(C.artery, 0.35)); dg.add(hormLine);
    const chyme = dots(110, new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), dg);
    const juice = dots(60, new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), dg);
    const bileD = dots(24, new THREE.SphereGeometry(0.07, 8, 6), M.glow(C.bile), dg);
    const hormD = dots(30, new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), dg);
    for (let i = 0; i < 30; i++) hormD.setColorAt(i, new THREE.Color(i % 2 ? C.secretin : C.cck));
    for (let i = 0; i < 110; i++) chyme.setColorAt(i, new THREE.Color(C.acid));
    for (let i = 0; i < 60; i++) juice.setColorAt(i, new THREE.Color(C.enzyme));
    const dLabs = [
      L('Acid chyme from the stomach', [1.8, 3.9, 2.2], dg, 'red'), L('Ampulla: juice and bile enter', [-6.4, -0.6, 0.2], dg, ''),
      L('Enteropeptidase switches trypsin on', [-6.0, -2.6, 0.6], dg, 'green'), L('Secretin + CCK travel in the blood', [-3.6, 4.8, 2.0], dg, 'side'),
      L('Pancreatic duct', [2.6, 1.2, 0.4], dg, 'blue'), L('Bile duct (from the liver)', [-2.6, 4.4, 0], dg, 'green'),
    ];
    const cAcid = new THREE.Color(C.acid), cNeut = new THREE.Color(0x9be37a), cOff = new THREE.Color(C.enzyme), cOn = new THREE.Color(C.trypsin), cB = new THREE.Color(C.bicarb), col = new THREE.Color();
    const pancBase = new THREE.Color(C.pancreas), pancHot = new THREE.Color(0xff5a4a);

    let t = 0, flowS = 0, enzS = 0, hot = 0;
    const view = sceneView(stage, VIEWS, NARROW);
    const fit = fitNarrow(stage, NARROW.acinus);
    const p = new THREE.Vector3();
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        view(s.scene);
        const narrow = fit();
        // Secretin drives the watery bicarbonate flow; CCK drives enzyme release.
        const flowT = 0.08 + (s.meal && s.secretin ? 0.92 : 0), enzT = 0.1 + (s.meal && s.cck ? 0.9 : 0);
        flowS += (flowT - flowS) * Math.min(1, dt * 1.5); enzS += (enzT - enzS) * Math.min(1, dt * 1.5);
        hot += ((s.lock ? 0 : 1) - hot) * Math.min(1, dt * 1.2);
        ag.visible = s.scene === 'acinus'; dg.visible = s.scene === 'duodenum';
        aLabs.forEach((l, i) => { l.visible = ag.visible && (!narrow || i === 1 || i === 3); });
        dLabs.forEach((l, i) => { l.visible = dg.visible && (!narrow || i === 1 || i === 2); });
        if (ag.visible) {
          cellMat.color.copy(cellCol).lerp(cellRed, hot * (0.6 + 0.4 * Math.sin(t * 5)));
          // Granules drift to the cell tip and are released; released ones flow out of the duct.
          for (let i = 0; i < NG; i++) {
            const [x, y, z] = granHome[i], ph = (t * 0.25 * enzS + rnd(i + 9)) % 1, pull = smooth(ph * 1.4 - 0.4) * 0.25;
            const k = 1 - pull; gran.put(i, x * k, y * k, z, 1);
          }
          gran.material.color.set(hot > 0.5 ? C.trypsin : C.enzyme);
          for (let i = 0; i < 90; i++) {
            const on = i < 90 * enzS, ph = (t * (0.12 + 0.28 * flowS) + i / 90) % 1;
            if (!on) { lumenFlow.hide(i); continue; }
            if (ph < 0.25) { const a = rnd(i) * 6.283, r = lerp(r0 * 0.9, 0.05, ph / 0.25); lumenFlow.put(i, r * Math.cos(a), r * Math.sin(a), (rnd(i + 5) - 0.5) * 1.2 * (1 - ph * 3)); }
            else { duct.userData.path.at((ph - 0.25) / 0.75, p); lumenFlow.put(i, p.x, p.y + (rnd(i + 3) - 0.5) * 0.3, p.z + (rnd(i + 4) - 0.5) * 0.3); }
          }
          lumenFlow.material.color.set(hot > 0.5 ? C.trypsin : C.enzyme);
          lumenFlow.done();
          for (let i = 0; i < 90; i++) {
            if (i > 90 * flowS) { hco3.hide(i); continue; }
            const u0 = 0.1 + rnd(i) * 0.8, ph = (t * (0.12 + 0.28 * flowS) + i / 90) % 1, u = clamp(u0 + ph * (1 - u0), 0, 1);
            duct.userData.path.at(u, p); const a = rnd(i + 8) * 6.283, r = 0.24 * Math.min(1, ph * 6);
            hco3.put(i, p.x, p.y + Math.cos(a) * r, p.z + Math.sin(a) * r);
          }
          hco3.done();
          ductCells.forEach((b, i) => { b.material.opacity = 0.35 + 0.35 * flowS * (0.5 + 0.5 * Math.sin(t * 4 + i)); });
          // Hormones in the capillary; some leave it to reach the cells.
          for (let i = 0; i < 40; i++) {
            const sec = i % 2 === 1, on = s.meal && (sec ? s.secretin : s.cck);
            if (!on) { horm.hide(i); continue; }
            const ph = (t * 0.18 + i / 40) % 1;
            if (ph < 0.7) { cap.userData.path.at(ph / 0.7 * 0.9, p); horm.put(i, p.x, p.y, p.z); }
            else { const k = (ph - 0.7) / 0.3, tx = sec ? 2.6 + rnd(i) * 1.8 : -1.8 + rnd(i) * 2.2, ty = sec ? -0.45 : -1.4, from = cap.userData.path.at(0.63); horm.put(i, lerp(from.x, tx, k), lerp(from.y, ty, k), lerp(from.z, 0.2, k), 1 - k * 0.5); }
          }
          horm.done();
        }
        if (dg.visible) {
          ab.mats.panc.color.copy(pancBase).lerp(pancHot, hot * (0.55 + 0.25 * Math.sin(t * 4)));
          ab.mats.panc.emissive = ab.mats.panc.emissive || new THREE.Color(); ab.mats.panc.emissive.setRGB(0.35 * hot, 0.02 * hot, 0);
          for (let i = 0; i < 110; i++) {
            if (!s.meal && i > 20) { chyme.hide(i); continue; }
            const u = (t * 0.045 + i / 110) % 1; duoP.at(u, p);
            const a = rnd(i) * 6.28, r = 0.3 * rnd(i + 7);
            chyme.put(i, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, p.z + Math.cos(a * 1.3) * r);
            const k = smooth((u - uAmp) / 0.15) * flowS;
            col.copy(cAcid).lerp(cNeut, k); chyme.setColorAt(i, col);
          }
          chyme.done();
          // Juice down the duct: bicarbonate (blue) and trypsinogen (orange), then into the gut.
          for (let i = 0; i < 60; i++) {
            const isEnz = i % 2 === 0, amt = isEnz ? enzS : flowS;
            if (i / 60 > amt) { juice.hide(i); continue; }
            const ph = (t * (0.08 + 0.12 * flowS) + i / 60) % 1;
            if (ph < 0.7) { mainP.at(ph / 0.7, p); juice.put(i, p.x, p.y, p.z); col.copy(isEnz ? (hot > 0.5 ? cOn : cOff) : cB); }
            else { const k = (ph - 0.7) / 0.3; duoP.at(uAmp + k * 0.3, p); juice.put(i, p.x + (rnd(i) - 0.5) * 0.4, p.y + (rnd(i + 1) - 0.5) * 0.4, p.z); col.copy(isEnz ? (k > 0.18 || hot > 0.5 ? cOn : cOff) : cB); }
            juice.setColorAt(i, col);
          }
          juice.done();
          for (let i = 0; i < 24; i++) {
            if (!(s.meal && s.cck)) { bileD.hide(i); continue; }
            const ph = (t * 0.15 + i / 24) % 1; bileP.at(ph, p); bileD.put(i, p.x, p.y, p.z);
          }
          bileD.done();
          for (let i = 0; i < 30; i++) {
            const sec = i % 2 === 1, on = s.meal && (sec ? s.secretin : s.cck);
            if (!on) { hormD.hide(i); continue; }
            const ph = (t * 0.12 + i / 30) % 1; hormP.at(ph, p); hormD.put(i, p.x, p.y, p.z);
          }
          hormD.done();
        }
      },
      readout: (s) => {
        const flow = s.meal && s.secretin ? 1 : 0.08, enz = s.meal && s.cck;
        if (!s.lock) return `<div class="big">Trypsin switched on too early</div>
          <div class="row"><span>Where</span><b>inside the pancreas</b></div>
          <div class="row"><span>What happens</span><b>the gland starts to digest itself</b></div>
          <small>This is what happens in pancreatitis. Normally a built-in trypsin blocker (SPINK1) mops up any early trypsin. Severe belly pain needs a doctor urgently.</small>`;
        return `<div class="big">${s.meal ? (flow > 0.5 ? 'Juice flowing strongly' : 'Juice: a trickle') : 'Between meals: a trickle'}</div>
          <div class="row"><span>Bicarbonate in the juice</span><b>about ${bicarb(flow)} mmol/L</b></div>
          <div class="row"><span>In blood plasma, for comparison</span><b>about 25 mmol/L</b></div>
          <div class="row"><span>Enzyme release</span><b>${enz ? 'high (CCK)' : 'low'}</b></div>
          <div class="row"><span>Chyme after the ampulla</span><b>${s.meal ? (flow > 0.5 ? 'pH about 6 to 7' : 'still acidic, pH about 2 to 3') : 'little to mix'}</b></div>
          <small>${s.scene === 'acinus' ? 'Orange: enzymes, still switched off. Blue: bicarbonate from the duct cells. Cyan and violet: secretin and CCK arriving in the blood.' : 'Orange dots: trypsinogen. They turn red (active trypsin) only after enteropeptidase on the gut lining.'}</small>`;
      },
    });
  },
};
