// Chapter 5: diabetes explained, as general facts only (never advice, never a diagnosis).
// Definitions: NIDDK "What is diabetes?" and "Symptoms & causes"; ADA Standards of Care 2025,
// section 2 "Diagnosis and classification of diabetes": diabetes if fasting plasma glucose
// ≥ 126 mg/dL, 2-h glucose ≥ 200 mg/dL in an oral glucose tolerance test, HbA1c ≥ 6.5%, or a random
// glucose ≥ 200 with classic symptoms; prediabetes HbA1c 5.7–6.4% or fasting 100–125; a diagnosis
// normally needs two abnormal results, and is made by a clinician.
//  - Type 1: the immune system destroys the beta cells, so the body makes little or no insulin;
//    people with type 1 need insulin every day. It is not caused by eating sugar or by lifestyle.
//    About 5–10% of diabetes. IDF Diabetes Atlas 11th ed. (2025): ~9.5 million people with type 1.
//  - Type 2: the body's cells respond less well to insulin (insulin resistance) and the beta cells
//    gradually cannot keep up. Genes, age, family history, body weight and activity all play a
//    part. About 90% or more of diabetes (IDF).
//  - HbA1c: glucose sticks to haemoglobin in red blood cells, which live ~120 days, so HbA1c
//    reflects roughly the average of the past 2–3 months. Average glucose → HbA1c from the ADAG
//    study (Nathan et al., Diabetes Care 31:1473, 2008): eAG = 28.7 × A1c − 46.7.
// Numbers:
//  - World: 589 million adults aged 20–79 (11.1%) living with diabetes in 2024, projected 853
//    million by 2050 (IDF Diabetes Atlas, 11th edition, 2025; diabetesatlas.org).
//  - India: ICMR–INDIAB national study (Anjana et al., Lancet Diabetes Endocrinol 11:474, 2023):
//    an estimated 101 million people with diabetes and 136 million with prediabetes in 2021;
//    weighted prevalence 11.4% and 15.3% of adults aged 20+.
// Kidney spill (madhumeha, "honey urine"): above ~180 mg/dL glucose appears in urine (glucose.js).
// The model curves are simplified pictures, not typical patients (see glucose.js).
import { THREE, M, clamp, canvasTexture } from '../kit.js';
import { tint, fitNarrow, compactReadout, drawDay, rnd, dots } from '../pancreas.js';
import { simulate, DAY, clock, PEOPLE } from '../glucose.js';
import { makeBody, layout } from '../body.js';

const VIEW = { pos: [0.8, 5.0, 12.8], target: [0.8, 4.4, 0] };
const BETA = { normal: 1, type2: 0.6, type1: 0.06 };

function drawA1c(g, w, h, { a1c, name }) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(7,8,12,0.86)'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
  g.fillStyle = '#e8ecf4'; g.font = '600 30px Geist, sans-serif'; g.fillText('HbA1c: sugar stuck to red blood cells', 26, 44);
  g.fillStyle = '#8a93a6'; g.font = '22px Geist, sans-serif'; g.fillText('It reflects roughly the average of the last 2 to 3 months.', 26, 80);
  const x0 = 60, x1 = w - 60, lo = 4, hi = 13, X = (v) => x0 + (x1 - x0) * (clamp(v, lo, hi) - lo) / (hi - lo), y = 180;
  [[lo, 5.7, '#5ce1a9', 'Typical: below 5.7%'], [5.7, 6.5, '#ffd166', 'Prediabetes: 5.7 to 6.4%'], [6.5, hi, '#ff7a8a', 'Diabetes range: 6.5% or more']].forEach(([a, b, c, t], i) => {
    g.fillStyle = c; g.globalAlpha = 0.35; g.fillRect(X(a), y, X(b) - X(a), 56); g.globalAlpha = 1;
    g.fillStyle = c; g.font = '21px Geist, sans-serif'; g.fillText(t, i === 2 ? X(a) + 12 : X(a) + 6, y + 94 + i * 0);
  });
  g.fillStyle = '#8a93a6'; g.font = '20px Geist, sans-serif';
  for (let v = 4; v <= 13; v++) g.fillText(v + '%', X(v) - 14, y - 12);
  const xv = X(a1c);
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(xv, y + 60); g.lineTo(xv - 14, y + 84); g.lineTo(xv + 14, y + 84); g.fill();
  g.fillRect(xv - 3, y - 4, 6, 64);
  g.font = '600 26px Geist, sans-serif'; g.textAlign = 'center'; g.fillText(`${name}: about ${a1c.toFixed(1)}%`, clamp(xv, 200, w - 200), y + 150); g.textAlign = 'left';
  g.fillStyle = '#8a93a6'; g.font = '20px Geist, sans-serif'; g.fillText('Thresholds from the ADA. Only doctors diagnose diabetes, usually with two tests.', 26, h - 24);
}

function drawNumbers(g, w, h) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(7,8,12,0.86)'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
  g.fillStyle = '#e8ecf4'; g.font = '600 30px Geist, sans-serif'; g.fillText('How many people live with diabetes?', 26, 44);
  const rows = [
    ['World, adults 20 to 79 (2024)', 589, '#8fb0ff', 'IDF Diabetes Atlas 2025'],
    ['World, projected for 2050', 853, 'rgba(143,176,255,0.45)', 'IDF projection'],
    ['India, with diabetes (2021)', 101, '#ff9f5a', 'ICMR-INDIAB, 2023'],
    ['India, with prediabetes (2021)', 136, 'rgba(255,209,102,0.7)', 'ICMR-INDIAB, 2023'],
  ];
  const x0 = 400, x1 = w - 40, X = (v) => x0 + (x1 - x0) * v / 900;
  rows.forEach(([t, v, c, src], i) => {
    const y = 90 + i * 72;
    g.fillStyle = '#c8cfdd'; g.font = '22px Geist, sans-serif'; g.fillText(t, 26, y + 30);
    g.fillStyle = '#6b7385'; g.font = '17px Geist, sans-serif'; g.fillText(src, 26, y + 54);
    g.fillStyle = c; g.fillRect(x0, y + 8, X(v) - x0, 36);
    g.fillStyle = '#e8ecf4'; g.font = '600 24px Geist, sans-serif'; g.fillText(`${v} million`, Math.min(X(v) + 10, x1 - 130), y + 35);
  });
  g.fillStyle = '#8a93a6'; g.font = '20px Geist, sans-serif'; g.fillText('About 1 adult in 9 worldwide. Many do not yet know they have it.', 26, h - 22);
}

export default {
  id: 'diabetes',
  short: 'Diabetes',
  title: 'Diabetes, explained',
  subtitle: 'What happens when the thermostat breaks: type 1, type 2 and the HbA1c test.',
  view: VIEW,
  learn: `<p>This chapter shares general facts, not medical advice. Only a doctor can diagnose diabetes. If you are worried, <b>talk to a doctor</b>.</p>
    <p><b>Diabetes</b> means blood glucose stays too high because the body makes too little insulin, or cannot use it well, or both. It is very common and nobody's fault. Around <b>589 million</b> adults live with it worldwide, and a large national study, <b>ICMR-INDIAB</b>, estimated about <b>101 million</b> people in India in 2021, with another 136 million who have <b>prediabetes</b>.</p>
    <p>In <b>type 1 diabetes</b>, the body's own immune system destroys the beta cells, so almost no insulin is made. It is most often found in children and young adults but can start at any age, and it is not caused by eating sugar or by anything a person did. People with type 1 need insulin every day, prescribed by their doctors.</p>
    <p><b>Type 2 diabetes</b> is the most common kind, about 9 in 10 cases. The body's cells respond less to insulin (<b>insulin resistance</b>), and over time the beta cells cannot keep up. Genes, family history, age, body weight and activity all play a part, and in South Asia it often appears at younger ages.</p>
    <p>High glucose can make people very thirsty, pass a lot of urine and feel tired. Above about 180 mg/dL the kidneys let sugar spill into urine: the "honey urine", <b>madhumeha</b>, that ancient Indian doctors described. Over years, high glucose can damage blood vessels in the eyes, kidneys, nerves and heart (see <a href="/eyeclear/">EyeClear</a> and <a href="/heartclear/">HeartClear</a>), which is why diagnosis and care matter.</p>
    <p>Doctors often use the <b>HbA1c</b> blood test. Glucose sticks to haemoglobin in red blood cells, which live about three months, so HbA1c shows the <b>average of the last 2 to 3 months</b>. By ADA thresholds, 6.5% or more is in the diabetes range, and 5.7 to 6.4% is prediabetes.</p>
    <p class="tip"><b>Try it:</b> switch between a typical body, type 1 and type 2, compare their curves over a day, then look at the HbA1c board. Watch the beta cells in the islet, and the kidneys spill sugar.</p>`,
  terms: [
    { t: 'Diabetes', d: 'A long-term condition in which blood glucose stays too high, because of too little insulin, insulin that works less well, or both.' },
    { t: 'Type 1 diabetes', d: 'The immune system destroys the beta cells, so the body makes little or no insulin. Not caused by diet or lifestyle.' },
    { t: 'Type 2 diabetes', d: 'The most common type: cells respond less to insulin and beta cells gradually cannot keep up.' },
    { t: 'Insulin resistance', d: 'When muscle, fat and liver cells respond less to insulin, so more is needed to do the same job.' },
    { t: 'HbA1c', d: 'A blood test showing the share of haemoglobin with glucose attached, a guide to average glucose over about 3 months.' },
    { t: 'Prediabetes', d: 'Glucose above the typical range but below the diabetes range. It does not always lead to diabetes.' },
  ],
  defaults: { person: 'type2', compare: true, walk: true, board: 'day', play: true, speed: 40, clock: 30 },
  controls: [
    { key: 'person', type: 'seg', label: 'Body', options: [{ v: 'normal', label: 'Typical' }, { v: 'type1', label: 'Type 1 (no insulin)' }, { v: 'type2', label: 'Type 2' }] },
    { key: 'compare', type: 'toggle', label: 'Show a typical day for comparison' },
    { key: 'walk', type: 'toggle', label: 'Walk after dinner' },
    { key: 'board', type: 'seg', label: 'Board', options: [{ v: 'day', label: 'The day' }, { v: 'a1c', label: 'HbA1c' }, { v: 'numbers', label: 'How many people' }] },
    { key: 'play', type: 'toggle', label: 'Play the day' },
    { key: 'speed', type: 'range', label: 'Speed', min: 5, max: 120, step: 1, fmt: (v) => `${Math.round(v)} min per second` },
  ],
  quiz: [
    { q: 'What happens in type 1 diabetes?', options: ['Eating too much sugar destroys the pancreas', 'The immune system destroys the beta cells, so little or no insulin is made', 'The stomach stops making acid', 'The liver stops storing glucose'], answer: 1, why: 'Type 1 is autoimmune: the body attacks its own beta cells. It is not caused by diet.' },
    { q: 'What is insulin resistance?', options: ['Having no pancreas', 'Cells responding less to insulin, so glucose stays higher', 'Being allergic to insulin', 'Making too much glucagon only'], answer: 1, why: 'In insulin resistance, muscle, fat and liver respond less, so the beta cells must make more. In type 2, they eventually cannot keep up.' },
    { q: 'Why does HbA1c show the last 2 to 3 months?', options: ['Because it is measured every 3 months', 'Because red blood cells, which carry it, live about 3 months', 'Because the pancreas resets every 3 months', 'It shows only today'], answer: 1, why: 'Glucose sticks to haemoglobin in red blood cells, which live around 120 days, so the test averages over months.' },
  ],
  reel: [
    { ms: 5400, caption: 'In type 1 diabetes the immune system destroys the beta cells, so almost no insulin is made.', set: { person: 'type1', compare: true, board: 'day', play: false, walk: true }, anim: { clock: [60, 520] }, view: { pos: [2.8, 5.2, 11.8], target: [1.6, 4.6, 0] }, spin: 0 },
    { ms: 5400, caption: 'In type 2, cells resist insulin and beta cells slowly fall behind. India has an estimated 101 million people with diabetes.', set: { person: 'type2', compare: true, board: 'numbers', play: false, walk: true }, anim: { clock: [400, 900] }, view: { pos: [0.6, 4.6, 12.0], target: [0.6, 4.3, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const body = makeBody(stage, { kidney: true, islet: true });
    body.root.position.set(3.85, 4.8, 0); body.root.scale.setScalar(0.66); stage.root.add(body.root);
    // Immune cells (T cells) attacking the islet in type 1.
    const tc = dots(26, new THREE.SphereGeometry(0.1, 12, 8), M.plastic(0xb18cff, { emissive: new THREE.Color(0x3b1d6e) }), body.root);
    const board = canvasTexture(1000, 420, () => {});
    const boardM = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.11), new THREE.MeshBasicMaterial({ map: board.tex, transparent: true, toneMapped: false }));
    boardM.position.set(-1.6, 2.1, 1.0); stage.root.add(boardM);
    const tLab = tint(stage.label('Immune cells attack beta cells', [-0.3, -3.55, 1.0], body.root), 'violet');
    const sims = {};
    const getSim = (kind, walk) => { const k = `${kind}|${walk}`; return (sims[k] ||= simulate(kind, { walk })); };
    const fit = fitNarrow(stage, { pos: [0.8, 5.6, 11.5], target: [0.8, 5.2, 0] });
    let t = 0, last = -99, lastKey = '';
    const at = (sm, m) => { const i = Math.min(1439, Math.max(0, Math.floor(m))); return { G: sm.G[i], I: sm.I[i], gluc: sm.gluc[i], ra: sm.ra[i], uptake: sm.uptake[i], liver: sm.liver[i], urine: sm.urine[i] }; };
    const o = body.isl.grp.position;
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        if (s.play) s.clock = (s.clock + dt * s.speed) % 1440;
        const sm = getSim(s.person, s.walk), st = at(sm, s.clock);
        st.walking = s.walk && s.clock >= DAY.walk[0] && s.clock < DAY.walk[1];
        st.beta = BETA[s.person];
        body.update(dt, st);
        layout(stage, body, boardM);
        const narrow = fit();
        Object.values(body.labs).forEach((l) => { if (l) l.visible = !narrow; });
        const attack = s.person === 'type1';
        tLab.visible = attack && !narrow;
        for (let i = 0; i < 26; i++) {
          if (!attack) { tc.hide(i); continue; }
          const a = rnd(i) * 6.283 + t * (0.3 + rnd(i + 1) * 0.3), b = (rnd(i + 2) - 0.5) * 2, r = 0.75 + 0.12 * Math.sin(t * 3 + i);
          tc.put(i, o.x + Math.cos(a) * r, o.y + b * 0.45, o.z + Math.sin(a) * r * 0.8);
        }
        tc.done();
        const key = `${s.board}|${s.person}|${s.compare}|${s.walk}`;
        if (Math.abs(s.clock - last) >= 3 || key !== lastKey) {
          last = s.clock; lastKey = key;
          const g = board.canvas.getContext('2d');
          if (s.board === 'a1c') drawA1c(g, 1000, 420, { a1c: sm.a1c, name: PEOPLE[s.person].name.replace(' (no insulin made)', ', untreated') });
          else if (s.board === 'numbers') drawNumbers(g, 1000, 420);
          else {
            const curves = [];
            if (s.compare && s.person !== 'normal') curves.push({ G: getSim('normal', s.walk).G, color: '#5ce1a9', width: 3, alpha: 0.8, full: true, label: 'Typical' });
            curves.push({ G: sm.G, color: s.person === 'normal' ? '#ffffff' : s.person === 'type1' ? '#d7a8ff' : '#ff9f5a', width: 5, label: s.person === 'normal' ? '' : PEOPLE[s.person].name.split(' (')[0] });
            drawDay(g, 1000, 420, { curves, cursor: s.clock, walk: s.walk, meals: DAY.meals, hi: 500, title: 'Blood glucose' });
          }
          board.tex.needsUpdate = true;
        }
      },
      readout: (s) => {
        const sm = getSim(s.person, s.walk), p = PEOPLE[s.person];
        const note = s.person === 'type1' ? 'Shown untreated, with no insulin. In real life people with type 1 take insulin every day, prescribed by doctors.' : s.person === 'type2' ? 'A simplified picture: real type 2 varies a lot between people and over time.' : 'The typical thermostat keeps glucose between about 70 and 140.';
        return `<div class="big">${p.name}</div>
          <div class="row"><span>Before breakfast</span><b>${Math.round(sm.fasting)} mg/dL</b></div>
          <div class="row"><span>2 hours after lunch</span><b>${Math.round(sm.after)} mg/dL</b></div>
          <div class="row"><span>Day's average → HbA1c</span><b>${Math.round(sm.mean)} mg/dL → about ${sm.a1c.toFixed(1)}%</b></div>
          <div class="row"><span>Sugar lost in urine</span><b>${sm.urineDay < 1 ? 'none' : `about ${Math.round(sm.urineDay)} g a day`}</b></div>
          <small>${note} A teaching model, not a diagnosis. Only doctors diagnose diabetes.</small>`;
      },
    });
  },
};
