// A small blood-glucose model for a day in the life of a 70 kg adult. Pure maths, no three.js, so it
// can be tested on its own. It is a teaching model built in the spirit of the Bergman "minimal
// model" (Bergman et al., Am J Physiol 236:E667, 1979) and the meal model of Dalla Man, Rizza &
// Cobelli (IEEE Trans Biomed Eng 54:1740, 2007). It is not a clinical tool and must never be used
// to make decisions about anyone's health.
//
// State (per minute): G = blood glucose (mg/dL), I = plasma insulin (µU/mL), X = insulin action in
// the tissues (µU/mL equivalent, lags insulin by ~25 min), and the glucose still in the gut.
// Constants and where they come from:
//  - Glucose spreads through ≈ 1.9 dL per kg of body (Dalla Man 2007: VG = 1.88 dL/kg) → 133 dL.
//  - The liver releases ≈ 2 mg/kg/min overnight (Gerich, Diabetes Care 16 Suppl 3:9, 1993) → about
//    1 mg/dL per minute; insulin shuts this off after a meal, and low insulin plus glucagon turn it up.
//  - About half of fasting glucose use is insulin-independent, mostly by the brain (Gerich 1993).
//  - Carbohydrate is absorbed over ~2 h, peaking ~30–45 min after eating (Dalla Man 2007); ~90%
//    of it reaches the blood.
//  - Insulin leaves the blood with a half-life of ~4–6 min (Duckworth et al., Endocr Rev 19:608,
//    1998) → n = 0.14 per min. Beta cells respond to glucose along an S-curve with half-maximal
//    secretion near 8 mmol/L (~150 mg/dL) (Henquin, Diabetologia 52:739, 2009), plus a quick "first
//    phase" when glucose is rising.
//  - Kidneys: glucose spills into urine above ≈ 180 mg/dL (the renal threshold; Guyton & Hall,
//    14th ed., ch. 28), filtered at ≈ 125 mL/min.
//  - Normal ranges (ADA Standards of Care 2025, "Diagnosis and classification of diabetes"):
//    fasting 70–99 mg/dL, below 140 two hours after a glucose load; diabetes thresholds are fasting
//    ≥ 126, 2 h ≥ 200, or HbA1c ≥ 6.5%, confirmed by doctors.
//  - HbA1c from average glucose: eAG (mg/dL) = 28.7 × A1c − 46.7 (Nathan et al., the ADAG study,
//    Diabetes Care 31:1473, 2008).
// The diabetes settings are simplified pictures, not typical patients:
//  - "type1": beta cells destroyed, so almost no insulin is made (untreated). Real people with type 1
//    diabetes take insulin prescribed by doctors every day (NIDDK).
//  - "type2": tissues respond to insulin only about 40% as well (insulin resistance) and beta
//    cells make ~70% as much, with a weak first phase (DeFronzo, Diabetes 58:773, 2009).

export const V = 133;                    // dL
const EGP0 = 1.05;                       // mg/dL per min, overnight liver output
const K0 = 0.0058, K1 = 0.00073;         // uptake per min: insulin-independent, per µU/mL of action
const N = 0.14, P2 = 0.04, IB = 8;      // insulin clearance, action lag, basal insulin
const SB = 0.1, SMAX = 7.0, KG = 140, HILL = 4, KD = 8.0;
export const PEOPLE = {
  normal: { name: 'Typical body', beta: 1, sens: 1, first: 1 },
  type1: { name: 'Type 1 (no insulin made)', beta: 0.03, sens: 1, first: 0 },
  type2: { name: 'Type 2', beta: 0.7, sens: 0.4, first: 0.2 },
};

// The day, in minutes after 06:00. Carbohydrate grams are rough, for a typical Indian day.
export const DAY = {
  meals: [
    { t: 90, g: 60, name: 'Breakfast', at: '07:30' },
    { t: 420, g: 90, name: 'Lunch', at: '13:00' },
    { t: 630, g: 25, name: 'Snack', at: '16:30' },
    { t: 870, g: 80, name: 'Dinner', at: '20:30' },
  ],
  walk: [900, 940],                      // 21:00 to 21:40, after dinner. Working muscle takes up
                                         // glucose without needing insulin (Richter & Hargreaves, Physiol Rev 93:993, 2013).
  sleep: [990, 1440],                    // 22:30 to 06:00
};
export const clock = (m) => { const h = Math.floor((m / 60 + 6) % 24), mm = Math.floor(m % 60); return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };

// Simulate one day (after a day of warm-up so the morning starts from last night).
// Returns arrays sampled every minute: G, I, glucagon (relative), gut absorption, urine loss.
export function simulate(kind = 'normal', { walk = true, extra = [] } = {}) {
  const p = PEOPLE[kind];
  const meals = DAY.meals.concat(extra);
  const dt = 0.5, out = { G: [], I: [], gluc: [], ra: [], urine: [], uptake: [], liver: [] };
  let G = 90, I = IB * p.beta, X = I, prevG = G;
  for (let day = 0; day < 2; day++) {
    for (let m = 0; m < 1440; m += dt) {
      // Glucose arriving from the gut: a gamma-shaped curve for each meal (τ = 35 min).
      let ra = 0;
      meals.forEach((ml) => { const s = m - ml.t; if (s > 0) ra += ml.g * 1000 * 0.9 * (s / 1225) * Math.exp(-s / 35); });
      ra /= V;
      const walking = walk && m >= DAY.walk[0] && m < DAY.walk[1];
      const k0 = K0 + (walking ? 0.008 : 0);          // working muscle takes up glucose without insulin
      const act = X * p.sens;
      const glucagon = Math.min(4, Math.max(0.3, 1 + (85 - G) / 25 - 0.5 * (I / IB - 1) * p.beta));
      let egp = EGP0 * Math.max(0.1, 2.2 - 1.2 * act / IB);
      if (G < 80) egp *= 1 + 0.05 * (80 - G);         // glucagon and adrenaline defend the low end
      const uptake = (k0 + K1 * act) * G;
      const urine = G > 180 ? (1.25 / V) * (G - 180) : 0;
      const dG = ra + egp - uptake - urine;
      G = Math.max(40, G + dG * dt);
      const rising = Math.max(0, (G - prevG) / dt); prevG = G;
      const sec = p.beta * (SB + SMAX * G ** HILL / (G ** HILL + KG ** HILL)) + p.beta * p.first * KD * rising;
      I += (sec - N * I) * dt;
      X += P2 * (I - X) * dt;
      if (day === 1 && m % 1 === 0) { out.G.push(G); out.I.push(I); out.gluc.push(glucagon); out.ra.push(ra); out.urine.push(urine * V); out.uptake.push(uptake); out.liver.push(egp); }
    }
  }
  const mean = out.G.reduce((a, b) => a + b, 0) / out.G.length;
  out.mean = mean;
  out.a1c = (mean + 46.7) / 28.7;
  out.fasting = out.G[60];                   // 07:00, before breakfast
  out.after = out.G[DAY.meals[1].t + 120];   // two hours after lunch
  out.peak = Math.max(...out.G);
  out.urineDay = out.urine.reduce((a, b) => a + b, 0) / 1000;   // grams of glucose lost in urine
  return out;
}
export const a1cToMean = (a) => 28.7 * a - 46.7;
