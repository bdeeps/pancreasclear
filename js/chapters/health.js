// Chapter 6: keeping the pancreas healthy, and what goes wrong. General facts only, never advice.
// Pancreatitis: NIDDK "Pancreatitis" (2023) and NHS "Acute pancreatitis": enzymes become active
// inside the pancreas and inflame it; gallstones (blocking the shared opening at the ampulla) and
// heavy alcohol use are the most common causes; the typical sign is sudden, severe pain in the upper
// belly that may spread to the back, which needs urgent medical care; most mild cases improve in
// about a week with hospital treatment. Protective trypsin inhibitor SPINK1 (see enzymes.js).
// Pancreatic cancer: NHS "Pancreatic cancer"; NCI "Pancreatic Cancer Treatment (PDQ)–Patient
// Version"; American Cancer Society "Key statistics for pancreatic cancer" (2025): about 9 in 10
// start in the cells lining the ducts (ductal adenocarcinoma); it lies deep behind the stomach and
// often causes no symptoms early, so it is often found late; possible signs include yellow skin or
// eyes (jaundice, when a tumour in the head squeezes the bile duct), belly or back pain, and
// weight loss; risk rises with age and smoking, and is linked with long-standing diabetes and
// chronic pancreatitis.
// Risk reduction for type 2 diabetes (lifestyle, not treatment advice):
//  - US Diabetes Prevention Program (Knowler et al., NEJM 346:393, 2002): in adults with raised
//    glucose, new type 2 over ~3 years was 28.9% with placebo vs 14.4% with an intensive lifestyle
//    programme (≥150 min/week activity, ~7% weight loss): 58% lower.
//  - Indian Diabetes Prevention Programme (Ramachandran et al., Diabetologia 49:289, 2006): 3-year
//    incidence 55.0% in the control group vs 39.3% with lifestyle advice: ~28.5% lower.
//  - WHO guidelines on physical activity (2020): adults at least 150–300 min of moderate activity
//    a week. ADA Standards of Care 2025 also list activity and healthy eating for prevention.
//  - Type 1 diabetes cannot currently be prevented this way (NIDDK).
import { THREE, M, clamp, lerp, smooth, canvasTexture } from '../kit.js';
import { makeAbdomen, PATHS, AMPULLA, C, tint, fitNarrow, compactReadout, rnd, dots, pathOf, lumpyBlob, tissue, sceneView } from '../pancreas.js';

const VIEWS = {
  pancreatitis: { pos: [-2.6, 6.9, 14.4], target: [-2.4, 6.1, 0] },
  cancer: { pos: [-4.2, 7.0, 13.2], target: [-3.3, 6.2, 0] },
  risk: { pos: [0.8, 5.0, 12.8], target: [0.8, 4.4, 0] },
};
const NARROW = { pancreatitis: { pos: [0.6, 5.2, 15], target: [0.6, 5.6, 0] }, cancer: { pos: [0.0, 5.2, 15], target: [0.0, 5.6, 0] }, risk: { pos: [0.4, 4.4, 15], target: [0.4, 4.8, 0] } };

function drawRisk(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(7,8,12,0.86)'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
  g.fillStyle = '#e8ecf4'; g.font = '600 30px Geist, sans-serif'; g.fillText('Two famous studies: lifestyle and type 2', 26, 44);
  g.fillStyle = '#8a93a6'; g.font = '21px Geist, sans-serif'; g.fillText('Adults with raised glucose: how many developed type 2 in about 3 years?', 26, 78);
  const rows = [
    ['USA, DPP (2002)', 'usual care', 28.9, '#8a93a6'], ['', 'lifestyle programme', 14.4, '#5ce1a9'],
    ['India, IDPP (2006)', 'usual care', 55.0, '#8a93a6'], ['', 'lifestyle advice', 39.3, '#5ce1a9'],
  ];
  const x0 = 430, x1 = w - 120, X = (v) => x0 + (x1 - x0) * v / 60;
  rows.forEach(([study, arm, v, c], i) => {
    const y = 104 + i * 58 + (i >= 2 ? 22 : 0);
    g.fillStyle = '#c8cfdd'; g.font = '600 22px Geist, sans-serif'; if (study) g.fillText(study, 26, y + 28);
    g.font = '21px Geist, sans-serif'; g.fillStyle = '#aab2c2'; g.fillText(arm, 230, y + 28);
    g.fillStyle = c; g.fillRect(x0, y + 6, X(v) - x0, 34);
    g.fillStyle = '#e8ecf4'; g.font = '600 23px Geist, sans-serif'; g.fillText(`${v}%`, X(v) + 10, y + 32);
  });
  g.fillStyle = '#8a93a6'; g.font = '19px Geist, sans-serif';
  g.fillText('Knowler et al., NEJM 2002; Ramachandran et al., Diabetologia 2006. Group averages, not a promise for anyone.', 26, h - 22);
}

export default {
  id: 'health',
  short: 'Healthy pancreas',
  title: 'Keeping it healthy, and what goes wrong',
  subtitle: 'Pancreatitis, pancreatic cancer, and what research says lowers the risk of type 2.',
  view: VIEWS.pancreatitis,
  learn: `<p>This chapter shares general facts, not medical advice. If you are worried about your own health, <b>talk to a doctor</b>.</p>
    <p><b>Pancreatitis</b> means an inflamed pancreas. It happens when digestive enzymes switch on <b>inside</b> the pancreas instead of in the gut, so the gland starts to digest itself. The two most common causes are <b>gallstones</b>, which can block the shared opening at the ampulla, and <b>heavy alcohol use</b>. The typical sign is sudden, severe pain in the upper belly that may spread to the back. That needs <b>urgent medical care</b>. Most mild cases get better in about a week in hospital.</p>
    <p><b>Pancreatic cancer</b> usually starts in the cells lining the ducts. Because the pancreas lies so deep, behind the stomach, it often causes no signs early and is hard to find. Possible signs include yellow skin or eyes (<b>jaundice</b>, when a growth in the head squeezes the bile duct), belly or back pain, and losing weight without trying. Risk rises with age and smoking. Anyone with such signs should see a doctor.</p>
    <p><b>Type 2 diabetes risk</b> can often be lowered. In two famous studies, one in the USA and one in India, adults with raised glucose who were supported to be more active and eat more healthily were much less likely to develop type 2 over three years. The WHO suggests adults get at least <b>150 minutes</b> of moderate activity, like brisk walking, a week. Type 1 diabetes cannot be prevented this way.</p>
    <p class="tip"><b>Try it:</b> drop a gallstone into the ampulla and watch the enzymes back up and switch on. Then grow a small tumour in the head of the pancreas and see why jaundice can be an early clue.</p>`,
  terms: [
    { t: 'Pancreatitis', d: 'Inflammation of the pancreas, often from gallstones or heavy alcohol use, in which enzymes switch on inside the gland.' },
    { t: 'Gallstone', d: 'A hard lump that forms in the gallbladder. One stuck at the ampulla can block pancreatic juice and bile.' },
    { t: 'Jaundice', d: 'Yellowing of the skin and eyes when bile cannot drain properly. A reason to see a doctor.' },
    { t: 'Ductal adenocarcinoma', d: 'The most common pancreatic cancer, starting in the cells that line the ducts.' },
    { t: 'Prediabetes', d: 'Glucose above the typical range but below the diabetes range. Lifestyle programmes lowered the chance of it becoming type 2.' },
  ],
  defaults: { scene: 'pancreatitis', stone: true, tumour: 0.6 },
  controls: [
    { key: 'scene', type: 'seg', label: 'Show', options: [{ v: 'pancreatitis', label: 'Pancreatitis' }, { v: 'cancer', label: 'Cancer' }, { v: 'risk', label: 'Type 2 risk' }] },
    { key: 'stone', type: 'toggle', label: 'Gallstone stuck at the ampulla' },
    { key: 'tumour', type: 'range', label: 'Growth in the head of the pancreas', min: 0, max: 1, step: 0.01, ends: ['none', 'large'], fmt: (v) => (v < 0.05 ? 'none' : `about ${(v * 3).toFixed(1)} cm`) },
  ],
  quiz: [
    { q: 'What happens inside the pancreas in pancreatitis?', options: ['It makes too much insulin', 'Digestive enzymes switch on too early and inflame the gland', 'It shrinks to nothing overnight', 'It fills with air'], answer: 1, why: 'Enzymes that should wait until the gut switch on inside the pancreas, and it starts to digest itself.' },
    { q: 'What are the two most common causes of acute pancreatitis?', options: ['Gallstones and heavy alcohol use', 'Cold weather and stress', 'Sugar and salt', 'Exercise and sleep'], answer: 0, why: 'A gallstone blocking the ampulla, or heavy alcohol use, cause most cases. Severe belly pain needs a doctor urgently.' },
    { q: 'Why is pancreatic cancer often found late?', options: ['It grows on the skin', 'The pancreas lies deep behind the stomach and early stages often cause no signs', 'It always causes pain on day one', 'Doctors never look for it'], answer: 1, why: 'Its deep position hides small growths, so signs like jaundice may appear only when the bile duct gets squeezed.' },
  ],
  reel: [
    { ms: 5400, caption: 'If a gallstone blocks the exit, enzymes can switch on inside the pancreas: that is pancreatitis.', set: { scene: 'pancreatitis', tumour: 0 }, anim: { stone: [false, true] }, view: { pos: [-1.4, 5.8, 12.4], target: [-0.4, 5.1, 0] }, spin: 0.2 },
  ],

  build({ stage }) {
    const L = (h, p, parent, cls) => tint(stage.label(h, p, parent), cls);
    const root = new THREE.Group(); root.position.set(0, 4.8, 0); root.scale.setScalar(0.62); stage.root.add(root);
    const ab = makeAbdomen(stage, { vessels: false }); root.add(ab.root);
    const G = ab.groups;
    const pancBase = new THREE.Color(C.pancreas), pancHot = new THREE.Color(0xff5a4a);
    ab.mats.panc.emissive = new THREE.Color(0, 0, 0);
    // A gallstone that can lodge at the ampulla.
    const stone = lumpyBlob(new THREE.MeshStandardMaterial({ color: 0x9a7a3a, roughness: 0.8 }), [AMPULLA.x - 0.12, AMPULLA.y, AMPULLA.z + 0.1], [0.4, 0.36, 0.36], 0.15, 7);
    stone.material.emissive = new THREE.Color(0x3a2a08);
    G.ducts.add(stone);
    // Active trypsin inside the gland (red), and juice/bile flows.
    const tryp = dots(160, new THREE.SphereGeometry(0.07, 8, 6), M.glow(C.trypsin), G.pancreas);
    const tp = new THREE.Vector3();
    for (let i = 0; i < 160; i++) { ab.panc.userData.inside(rnd(i + 3), rnd(i + 5) * 6.28, Math.sqrt(rnd(i + 7)) * 0.8, tp); tryp.put(i, tp.x, tp.y, tp.z); }
    tryp.done();
    const mainP = pathOf(PATHS.mainDuct), bileP = pathOf(PATHS.bileDuct);
    const juice = dots(40, new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), G.ducts);
    const bileD = dots(40, new THREE.SphereGeometry(0.08, 8, 6), M.glow(C.bile), G.ducts);
    // A tumour in the head, pressing on the bile duct.
    const tum = lumpyBlob(new THREE.MeshStandardMaterial({ color: 0xcdb8e0, roughness: 0.75 }), [-3.0, 0.3, 0.15], [1, 1, 1], 0.18, 11);
    tum.material.emissive = new THREE.Color(0x2a2622);
    G.pancreas.add(tum);
    // Risk board.
    const board = canvasTexture(1000, 420, drawRisk);
    const boardM = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.11), new THREE.MeshBasicMaterial({ map: board.tex, transparent: true, toneMapped: false }));
    boardM.position.set(-1.6, 2.1, 1.0); stage.root.add(boardM);

    const labs = {
      p1: L('Enzymes switched on inside: inflamed, swollen', [2.4, 2.6, 0.6], G.pancreas, 'red'),
      p2: L('Gallstone blocks the shared exit', [-6.2, -1.4, 0.3], G.ducts, 'gold'),
      p3: L('Gallbladder, where stones form', [-6.3, 5.2, 1.3], G.upper, 'green'),
      c1: L('Growth in the head', [-4.6, 1.9, 0.9], G.pancreas, ''),
      c2: L('Bile backs up → jaundice', [-1.2, 4.4, 0.1], G.ducts, 'green'),
      c3: L('Deep behind the stomach', [1.6, 4.9, 2.4], G.upper, 'pink'),
    };
    const cB = new THREE.Color(C.bicarb), cT = new THREE.Color(C.trypsin), cE = new THREE.Color(C.enzyme), col = new THREE.Color();
    let t = 0, inf = 0, tm = 0.6;
    const view = sceneView(stage, VIEWS, NARROW), fit = fitNarrow(stage, NARROW.pancreatitis);
    const p = new THREE.Vector3();
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        view(s.scene); const narrow = fit();
        const sc = s.scene;
        boardM.visible = sc === 'risk';
        root.position.x = sc === 'risk' ? 3.6 : 0; root.scale.setScalar(sc === 'risk' ? 0.5 : 0.62);
        const blocked = sc === 'pancreatitis' && s.stone;
        inf += ((blocked ? 1 : 0) - inf) * Math.min(1, dt * 1.2);
        tm += ((sc === 'cancer' ? s.tumour : 0) - tm) * Math.min(1, dt * 3);
        stone.visible = sc === 'pancreatitis' && s.stone;
        ab.mats.panc.color.copy(pancBase).lerp(pancHot, inf * (0.6 + 0.2 * Math.sin(t * 4)));
        ab.mats.panc.emissive.setRGB(0.3 * inf, 0.02 * inf, 0);
        G.pancreas.scale.setScalar(1 + 0.08 * inf);
        ab.setXray(sc === 'risk' ? 0 : sc === 'cancer' ? 0.8 : 0.55);
        ab.ghosts(sc === 'cancer' ? 1 : sc === 'pancreatitis' ? 0.7 : 0);
        G.islets.visible = false;
        tryp.visible = inf > 0.05; tryp.material.transparent = true; tryp.material.opacity = inf;
        const r = tm * 1.0; tum.visible = r > 0.03; tum.scale.set(r, r, r * 0.8);
        // Juice: flows freely, or stalls and turns red behind a stone.
        for (let i = 0; i < 40; i++) {
          const isEnz = i % 2 === 0, ph = (t * (blocked ? 0.03 : 0.12) + i / 40) % 1;
          const u = blocked ? 0.35 + ph * 0.55 : ph; mainP.at(u, p); juice.put(i, p.x, p.y, p.z);
          col.copy(isEnz ? (blocked ? cT : cE) : cB); juice.setColorAt(i, col);
        }
        juice.done();
        // Bile: flows, or piles up above a growth that squeezes the duct.
        const squeeze = sc === 'cancer' ? smooth((tm - 0.35) / 0.4) : 0;
        for (let i = 0; i < 40; i++) {
          const ph = (t * lerp(0.12, 0.02, squeeze) + i / 40) % 1; bileP.at(lerp(ph, ph * 0.55, squeeze), p); bileD.put(i, p.x, p.y, p.z, lerp(1, 1.3, squeeze));
        }
        bileD.done();
        juice.visible = bileD.visible = sc !== 'risk';
        const show = { p1: sc === 'pancreatitis' && inf > 0.5, p2: sc === 'pancreatitis' && s.stone, p3: sc === 'pancreatitis', c1: sc === 'cancer' && tm > 0.05, c2: sc === 'cancer' && squeeze > 0.3, c3: sc === 'cancer' };
        Object.entries(labs).forEach(([k, l]) => { l.visible = show[k] && (!narrow || k === 'p2' || k === 'c1'); });
      },
      readout: (s) => {
        if (s.scene === 'cancer') return `<div class="big">Pancreatic cancer: hard to find early</div>
          <div class="row"><span>Where it usually starts</span><b>the duct lining (about 9 in 10)</b></div>
          <div class="row"><span>Early on</span><b>often no signs at all</b></div>
          <div class="row"><span>Possible signs</span><b>jaundice, belly or back pain, weight loss</b></div>
          <small>${s.tumour > 0.5 ? 'A growth in the head can squeeze the bile duct, so bile backs up and skin and eyes turn yellow. ' : ''}Risk rises with age and smoking. Anyone with these signs should see a doctor.</small>`;
        if (s.scene === 'risk') return `<div class="big">Type 2 risk can often be lowered</div>
          <div class="row"><span>USA, DPP: new type 2 in 3 years</span><b>28.9% → 14.4%</b></div>
          <div class="row"><span>India, IDPP: new type 2 in 3 years</span><b>55.0% → 39.3%</b></div>
          <div class="row"><span>WHO: adult activity</span><b>150+ minutes a week</b></div>
          <small>Both studies supported people with raised glucose to move more and eat more healthily. Type 1 cannot be prevented this way. Talk to a doctor before big changes.</small>`;
        return `<div class="big">${s.stone ? 'Pancreatitis: the gland inflames' : 'Juice flowing freely'}</div>
          <div class="row"><span>Most common causes</span><b>gallstones, heavy alcohol use</b></div>
          <div class="row"><span>Typical sign</span><b>severe upper-belly pain</b></div>
          <div class="row"><span>What to do</span><b>urgent medical care</b></div>
          <small>${s.stone ? 'Red: trypsin switched on inside the pancreas, where it should never be active. ' : 'Orange: enzymes still switched off. Blue: bicarbonate. Green: bile. '}Most mild cases get better in about a week in hospital.</small>`;
      },
    });
  },
};
