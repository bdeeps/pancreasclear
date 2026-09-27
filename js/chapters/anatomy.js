// Chapter 1: the pancreas in the abdomen: head in the C of the duodenum, uncinate process, neck,
// body and tail reaching the spleen, lying behind the stomach, with its ducts and blood vessels.
// X-ray shows the duct system and the islets (drawn hugely enlarged). See pancreas.js for axes,
// placement and sources. Size: ≈ 12–15 cm long, ≈ 70–100 g (Gray's Anatomy; NIDDK). Exocrine
// tissue ≈ 98–99%, islets ≈ 1–2% by mass, roughly 1 million islets (estimates 1–3 million;
// Ionescu-Tirgoviste et al., Sci Rep 2015). Pancreatic juice ≈ 1–1.5 L a day (Guyton & Hall ch. 65;
// Pandol, "The Exocrine Pancreas", 2010).
import { THREE } from '../kit.js';
import { makeAbdomen, tint, sideLabels, fitNarrow, compactReadout } from '../pancreas.js';

const SC = 0.62;

export default {
  id: 'anatomy',
  short: 'Meet the pancreas',
  title: 'The pancreas, unpacked',
  subtitle: 'A soft, 15 cm organ tucked behind your stomach, doing two very different jobs.',
  view: { pos: [-3.0, 7.0, 16.2], target: [-2.7, 6.0, 0] },
  learn: `<p>Your <b>pancreas</b> is a soft, pale, bumpy organ about <b>15 cm</b> long and about <b>80 g</b>, roughly the weight of a small banana. It lies deep in the upper belly, <b>behind the stomach</b>, across the back wall. We are looking from the front, so the patient's <b>right</b> is on <b>your left</b>.</p>
    <p>It has four parts. The fat <b>head</b> sits snugly in the C-shaped curve of the <b>duodenum</b>, the first part of the small intestine (see <a href="/intestineclear/#digest">IntestineClear</a>). A little hook, the <b>uncinate process</b>, curls behind a big vein. Then come the <b>neck</b>, the <b>body</b>, which crosses in front of the aorta and spine, and the <b>tail</b>, which reaches up to the spleen.</p>
    <p>Down its middle runs the <b>main pancreatic duct</b>, like the spine of a leaf. In the head it meets the <b>common bile duct</b> from the liver and gallbladder, and they empty together through a tiny opening in the duodenum, the <b>ampulla of Vater</b>.</p>
    <p>The pancreas is really <b>two organs in one</b>. About <b>98%</b> of it is an <b>exocrine</b> factory that makes digestive juice and sends it down the ducts. Scattered through it, like islands, are about <b>a million</b> tiny <b>islets of Langerhans</b>, only 1 to 2% of its weight. They are <b>endocrine</b>: they release hormones such as <b>insulin</b> straight into the blood.</p>
    <p class="tip"><b>Try it:</b> take it apart to see what hides behind the stomach, then switch on X-ray to see the ducts and the glowing islets.</p>`,
  terms: [
    { t: 'Pancreas', d: 'A gland behind the stomach that makes digestive enzymes and blood-sugar hormones. From Greek for "all flesh".' },
    { t: 'Duodenum', d: 'The first 25 cm or so of the small intestine. It curls around the head of the pancreas.' },
    { t: 'Main pancreatic duct', d: 'The tube that runs the length of the pancreas and carries its juice to the duodenum.' },
    { t: 'Ampulla of Vater', d: 'The shared opening where the pancreatic duct and the common bile duct empty into the duodenum.' },
    { t: 'Exocrine', d: 'Releasing a product into a duct, like digestive juice into the gut.' },
    { t: 'Endocrine', d: 'Releasing hormones straight into the blood, like insulin from the islets.' },
  ],
  defaults: { explode: 0, xray: false, neighbours: true, labels: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['in the body', 'apart'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray: ducts and islets' },
    { key: 'neighbours', type: 'toggle', label: 'Show stomach, liver and spleen' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Where does the head of the pancreas sit?', options: ['Inside the stomach', 'In the C-shaped curve of the duodenum', 'Next to the heart', 'Below the bladder'], answer: 1, why: 'The duodenum wraps around the head of the pancreas like a C. The tail points the other way, towards the spleen.' },
    { q: 'About how much of the pancreas is made of islets?', options: ['About 1 to 2%', 'About half', 'About 90%', 'All of it'], answer: 0, why: 'Around a million islets make up only 1 to 2% of the pancreas. The rest is the exocrine factory that makes digestive juice.' },
    { q: 'What does "endocrine" mean?', options: ['Making juice for a duct', 'Releasing hormones straight into the blood', 'Filtering the blood', 'Storing fat'], answer: 1, why: 'Endocrine glands, like the islets, release hormones into the blood. Exocrine glands send their product down ducts.' },
  ],
  reel: [
    { ms: 5200, caption: 'Hidden behind your stomach is a soft, 15 cm organ: the pancreas.', set: { explode: 0, xray: false, neighbours: true, labels: false }, anim: { explode: [0, 0.85] }, view: { pos: [0.6, 5.0, 10.0], target: [0.3, 4.5, 0] }, spin: 0.35 },
    { ms: 5400, caption: 'It is two organs in one: a juice factory, dotted with a million islets that make hormones.', set: { explode: 0.85, xray: true, neighbours: false, labels: false }, view: { pos: [2.2, 5.0, 9.0], target: [0.3, 4.5, 0] }, spin: 0.3 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.set(0, 4.2, 0); root.scale.setScalar(SC); stage.root.add(root);
    const ab = makeAbdomen(stage);
    root.add(ab.root);
    const G = ab.groups, L = (h, p, parent, cls) => tint(stage.label(h, p, parent), cls);
    const labs = {
      head: L('Head', [-2.7, -0.3, 1.1], G.pancreas, 'gold'),
      unc: L('Uncinate process', [-1.1, -2.35, 0.4], G.pancreas, 'gold'),
      neck: L('Neck', [-0.9, 1.9, 0.8], G.pancreas, 'gold'),
      body: L('Body', [1.5, 2.3, 0.8], G.pancreas, 'gold'),
      tail: L('Tail', [4.3, 3.7, -1.0], G.pancreas, 'gold'),
      duo: L('Duodenum', [-5.2, -1.6, 0.3], G.duodenum, 'pink'),
      duct: L('Main pancreatic duct', [2.8, 1.0, 0.6], G.ducts, 'blue'),
      bile: L('Common bile duct', [-2.6, 4.6, 0.2], G.ducts, 'green'),
      amp: L('Ampulla of Vater', [-5.5, -0.4, 0.2], G.ducts, ''),
      sto: L('Stomach (StomachClear)', [3.7, 4.6, 2.2], G.upper, ''),
      liv: L('Liver (LiverClear)', [-6.4, 5.4, 1.4], G.upper, 'brown'),
      spl: L('Spleen', [6.6, 5.2, -2.0], G.spleen, 'violet'),
      aor: L('Aorta', [0.9, -4.6, -2.4], G.vessels, 'red'),
      sma: L('Superior mesenteric vessels', [1.9, -4.2, 1.3], G.vessels, 'red'),
      por: L('Portal vein (to the liver)', [-1.2, 3.2, -0.6], G.vessels, 'blue'),
      isl: L('Islets (hugely enlarged)', [3.4, 1.6, 0.4], G.islets, 'gold'),
    };
    const minimal = ['head', 'body', 'tail', 'duo'];
    const sides = sideLabels(stage, root, -5.6, 5.4);
    const fit = fitNarrow(stage, { pos: [0.3, 6.0, 12.5], target: [0.3, 5.9, 0] });
    let xr = 0, nb = 1;
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt);
        xr += ((s.xray ? 1 : 0) - xr) * Math.min(1, dt * 5);
        nb += ((s.neighbours ? 1 : 0) - nb) * Math.min(1, dt * 5);
        ab.setExplode(s.explode); ab.setXray(xr); ab.ghosts(nb);
        const narrow = fit();
        Object.entries(labs).forEach(([k, l]) => {
          const hidden = (['sto', 'liv', 'spl'].includes(k) && !s.neighbours) || (k === 'isl' && !s.xray) || (k === 'duct' && !s.xray);
          l.visible = s.labels && !hidden && (!narrow || minimal.includes(k));
        });
        sides.forEach((l) => { l.visible = s.labels && !narrow; });
      },
      readout: (s) => `<div class="big">Pancreas: about 15 cm, 80 g</div>
        <div class="row"><span>Exocrine (juice factory)</span><b>about 98% of it</b></div>
        <div class="row"><span>Islets (hormones)</span><b>about 1 million, 1 to 2%</b></div>
        <div class="row"><span>Juice made per day</span><b>about 1 to 1.5 litres</b></div>
        <small>${s.xray ? 'Blue: the pancreatic duct. Green: the bile duct. Gold dots: islets, drawn far bigger than life (real ones are about 0.1 mm).' : 'Front view: the patient’s right is on your left. It lies behind the stomach, near the back wall.'}</small>`,
    });
  },
};
