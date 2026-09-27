// Chapter 4: the blood-sugar thermostat. A day of meals, a walk and sleep, run through the model in
// ../glucose.js (see its header for every constant and source), shown on a live chart and on a
// stylised body loop (../body.js). Normal ranges from the ADA Standards of Care 2025: fasting
// 70–99 mg/dL, and below ~140 mg/dL two hours after eating. Blood holds only about 4–5 g of glucose
// at any moment, about a teaspoon (Wasserman, Am J Physiol Endocrinol Metab 296:E11, 2009).
import { THREE, clamp, canvasTexture } from '../kit.js';
import { tint, fitNarrow, compactReadout, drawDay } from '../pancreas.js';
import { simulate, DAY, clock } from '../glucose.js';
import { makeBody, layout } from '../body.js';

const VIEWS = { day: { pos: [0.8, 5.0, 12.8], target: [0.8, 4.4, 0] } };

// What is happening at minute m of the day.
export function doing(m, walk) {
  for (const ml of DAY.meals.concat([])) if (m >= ml.t && m < ml.t + 150) return `${ml.name}: glucose arriving from the gut`;
  if (walk && m >= DAY.walk[0] && m < DAY.walk[1]) return 'A walk: working muscles pull in glucose';
  if (m >= DAY.sleep[0] || m < 60) return 'Asleep: the liver keeps glucose topped up';
  return 'Between meals: the liver keeps glucose steady';
}

export function drawLoop(g, w, h, { G, I, gluc }) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(7,8,12,0.86)'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
  g.fillStyle = '#e8ecf4'; g.font = '600 30px Geist, sans-serif'; g.fillText('The feedback loop: a thermostat for sugar', 26, 44);
  const up = G > 105 || I > 20, down = G < 85 || gluc > 1.25;
  const box = (x, y, bw, text, col, on) => {
    g.globalAlpha = on ? 1 : 0.4; g.strokeStyle = col; g.lineWidth = on ? 4 : 2; g.fillStyle = 'rgba(20,24,34,0.95)';
    g.beginPath(); g.roundRect(x, y, bw, 64, 14); g.fill(); g.stroke();
    g.fillStyle = col; g.font = '22px Geist, sans-serif';
    text.split('\n').forEach((ln, i, a) => g.fillText(ln, x + 14, y + (a.length > 1 ? 27 + i * 26 : 40)));
    g.globalAlpha = 1;
  };
  const arr = (x0, y0, x1, y1, col, on) => { g.globalAlpha = on ? 1 : 0.35; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 16 * Math.cos(a - 0.4), y1 - 16 * Math.sin(a - 0.4)); g.lineTo(x1 - 16 * Math.cos(a + 0.4), y1 - 16 * Math.sin(a + 0.4)); g.fill(); g.globalAlpha = 1; };
  const gr = '#5ce1a9', rd = '#ff7a8a';
  // Top row: rising sugar → insulin. Bottom row: falling sugar → glucagon.
  box(26, 80, 250, 'Blood sugar rises\n(after a meal)', gr, up); arr(280, 112, 330, 112, gr, up);
  box(334, 80, 290, 'Beta cells release\nINSULIN', gr, up); arr(628, 112, 678, 112, gr, up);
  box(682, 80, 292, 'Muscle and fat take it in;\nliver stores it', gr, up);
  box(26, 300, 250, 'Blood sugar falls\n(fasting, exercise)', rd, down); arr(280, 332, 330, 332, rd, down);
  box(334, 300, 290, 'Alpha cells release\nGLUCAGON', rd, down); arr(628, 332, 678, 332, rd, down);
  box(682, 300, 292, 'Liver releases\nstored glucose', rd, down);
  arr(828, 150, 828, 290, gr, up); arr(150, 290, 150, 150, rd, down);
  g.fillStyle = '#c8cfdd'; g.font = '22px Geist, sans-serif';
  g.fillText('…so sugar falls', 842, 226); g.fillText('…so sugar rises', 164, 226);
  g.fillStyle = '#ffd166'; g.font = '600 26px Geist, sans-serif'; g.textAlign = 'center';
  g.fillText(`Now: ${Math.round(G)} mg/dL`, w / 2, 214); g.font = '21px Geist, sans-serif'; g.fillStyle = '#8a93a6';
  g.fillText('Kept roughly between 70 and 140', w / 2, 244); g.textAlign = 'left';
}

export default {
  id: 'glucose',
  short: 'Sugar thermostat',
  title: 'The blood-sugar thermostat',
  subtitle: 'Insulin and glucagon keep your blood sugar steady through meals, walks and sleep.',
  view: VIEWS.day,
  learn: `<p>Every cell in your body burns <b>glucose</b>, a simple sugar, for <a href="/energyclear/">energy</a>, and your brain uses about 100 g of it a day. Yet all your blood holds at any moment is about <b>4 to 5 grams</b>, roughly a teaspoon. Keep too little and the brain struggles; keep too much for years and blood vessels get damaged. So the islets run a <b>thermostat</b>.</p>
    <p>After a meal, glucose pours in from the gut (see <a href="/intestineclear/#digest">IntestineClear</a>). Beta cells sense the rise and release <b>insulin</b>. Insulin is like a key: it lets <b>muscle</b> and <b>fat</b> cells open doors for glucose, and tells the <b>liver</b> to store it as <b>glycogen</b> (see <b>LiverClear</b>). Sugar falls.</p>
    <p>Hours later, or overnight, sugar starts to dip. Insulin drops and alpha cells release <b>glucagon</b>, which tells the liver to release its stored glucose. Sugar rises again. The brain does not need insulin to take in glucose, which is why keeping it supplied matters so much.</p>
    <p>In most people this keeps blood glucose around <b>70 to 100 mg/dL</b> before breakfast and usually <b>below about 140 mg/dL</b> two hours after eating. A walk helps too: working muscles pull in glucose even without extra insulin.</p>
    <p class="tip"><b>Try it:</b> press play and watch a whole day. Eat a sweet at any moment and see the spike and the insulin answer. Turn the after-dinner walk off and on, and switch to the feedback-loop view.</p>`,
  terms: [
    { t: 'Glucose', d: 'The simple sugar that cells burn for energy. Carbohydrates in food are broken down into it.' },
    { t: 'Blood glucose', d: 'How much glucose is in the blood, measured in mg/dL (or mmol/L; divide mg/dL by 18).' },
    { t: 'Glycogen', d: 'A store of glucose chains kept in the liver and muscles.' },
    { t: 'Negative feedback', d: 'A control loop that pushes a value back when it moves, like a thermostat.' },
    { t: 'Fasting glucose', d: 'Blood glucose after at least 8 hours without food, usually measured in the morning.' },
  ],
  defaults: { play: true, speed: 30, clock: 30, walk: true, board: 'day', extra: 0 },
  controls: [
    { key: 'play', type: 'toggle', label: 'Play the day' },
    { key: 'speed', type: 'range', label: 'Speed', min: 5, max: 120, step: 1, fmt: (v) => `${Math.round(v)} min per second` },
    { key: 'clock', type: 'range', label: 'Time of day', min: 0, max: 1439, step: 1, fmt: (v) => clock(v) },
    { key: 'walk', type: 'toggle', label: 'Walk after dinner (21:00, 40 min)' },
    { key: 'board', type: 'seg', label: 'Board', options: [{ v: 'day', label: 'The day' }, { v: 'loop', label: 'Feedback loop' }] },
    { key: 'snack', type: 'buttons', label: 'Eat now', items: [{ label: 'A sweet (30 g sugar)', act: (s) => { s.extra = (s.extra || 0) + 1; s.extraAt = (s.extraAt || []).concat([{ t: Math.floor(s.clock), g: 30, name: 'Sweet' }]); } }, { label: 'Clear extras', act: (s) => { s.extra = 0; s.extraAt = []; } }] },
  ],
  quiz: [
    { q: 'What does insulin do?', options: ['Raises blood sugar', 'Lets muscle and fat take in glucose, and tells the liver to store it', 'Digests starch in the gut', 'Makes the heart beat faster'], answer: 1, why: 'Insulin is the "store it" signal: cells take in glucose and the liver builds glycogen, so blood sugar falls.' },
    { q: 'You have not eaten for hours. What keeps your blood sugar up?', options: ['Insulin from beta cells', 'Glucagon telling the liver to release stored glucose', 'Bile', 'The kidneys making sugar only'], answer: 1, why: 'As sugar dips, alpha cells release glucagon and the liver releases glucose from its glycogen store.' },
    { q: 'About how much glucose is in all your blood at once?', options: ['About a teaspoon (4 to 5 g)', 'About a cup', 'About a kilogram', 'None'], answer: 0, why: 'Only about 4 to 5 g. That is why the thermostat has to keep adjusting all day.' },
  ],
  reel: [
    { ms: 5600, caption: 'After lunch, sugar floods in, beta cells answer with insulin, and muscles, fat and liver soak it up.', set: { play: false, walk: true, board: 'day', extra: 0, extraAt: [] }, anim: { clock: [380, 560] }, view: { pos: [0.6, 4.6, 12.0], target: [0.6, 4.3, 0] }, spin: 0 },
    { ms: 5000, caption: 'Overnight, glucagon tells the liver to release stored sugar, so your brain never runs short.', set: { play: false, walk: true, board: 'loop', extra: 0, extraAt: [] }, anim: { clock: [1100, 1400] }, view: { pos: [0.6, 4.6, 12.0], target: [0.6, 4.3, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const body = makeBody(stage);
    body.root.position.set(3.85, 4.8, 0); body.root.scale.setScalar(0.66); stage.root.add(body.root);
    const board = canvasTexture(1000, 420, () => {});
    const boardM = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.11), new THREE.MeshBasicMaterial({ map: board.tex, transparent: true, toneMapped: false }));
    boardM.position.set(-1.6, 2.1, 1.0); stage.root.add(boardM);
    let sim = null, key = '', last = -99, lastBoard = '';
    const getSim = (s) => { const k = `${s.walk}|${JSON.stringify(s.extraAt || [])}`; if (k !== key) { key = k; sim = simulate('normal', { walk: s.walk, extra: s.extraAt || [] }); last = -99; } return sim; };
    const fit = fitNarrow(stage, { pos: [0.8, 5.6, 11.5], target: [0.8, 5.2, 0] });
    const at = (sm, m) => { const i = Math.min(1439, Math.max(0, Math.floor(m))); return { G: sm.G[i], I: sm.I[i], gluc: sm.gluc[i], ra: sm.ra[i], uptake: sm.uptake[i], liver: sm.liver[i], urine: sm.urine[i] }; };
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt);
        if (s.play) s.clock = (s.clock + dt * s.speed) % 1440;
        const sm = getSim(s), m = s.clock, st = at(sm, m);
        st.walking = s.walk && m >= DAY.walk[0] && m < DAY.walk[1];
        body.update(dt, st);
        layout(stage, body, boardM);
        const narrow = fit();
        Object.values(body.labs).forEach((l) => { if (l) l.visible = !narrow; });
        if (Math.abs(m - last) >= 3 || s.board !== lastBoard) {
          last = m; lastBoard = s.board;
          if (s.board === 'loop') drawLoop(board.canvas.getContext('2d'), 1000, 420, st);
          else drawDay(board.canvas.getContext('2d'), 1000, 420, { curves: [{ G: sm.G, color: '#ffffff', width: 5 }], cursor: m, walk: s.walk, meals: DAY.meals.concat(s.extraAt || []), hi: 220, title: 'Blood glucose today' });
          board.tex.needsUpdate = true;
        }
      },
      readout: (s) => {
        const sm = getSim(s), st = at(sm, s.clock);
        const where = st.G > 110 ? 'into muscle, fat and liver' : st.liver > 1.1 ? 'out of the liver' : 'balanced';
        return `<div class="big">${clock(s.clock)} · ${Math.round(st.G)} mg/dL</div>
          <div class="row"><span>Insulin in the blood</span><b>about ${Math.round(st.I)} µU/mL</b></div>
          <div class="row"><span>Glucose is moving</span><b>${where}</b></div>
          <div class="row"><span>Typical range</span><b>70 to 140 mg/dL</b></div>
          <small>${doing(s.clock, s.walk)}. White dots: glucose. Green: insulin. Red: glucagon. A teaching model, not a medical tool.</small>`;
      },
    });
  },
};
