'use strict';
/* =========================================================
   Kraftbuch – Bereich Gym
   ========================================================= */

/* ---------- Konstanten ---------- */
const MUSCLES = {
  'Brust': '#ff7a59', 'Oberer Rücken': '#4da3ff', 'Lat': '#6f8dff', 'Unterer Rücken': '#7fb2e6', 'Schultern': '#b48cff',
  'Bizeps': '#3fd6c4', 'Trizeps': '#38b6a5', 'Unterarme': '#5fc9a0', 'Quadrizeps': '#f5c84c', 'Beinbeuger': '#eaa23a',
  'Gesäß': '#ff9f45', 'Waden': '#d8b46e', 'Adduktoren': '#c7a14a', 'Bauch': '#ff6b9a', 'Sonstiges': '#8a93a5',
};
const MUSCLE_KEYS = Object.keys(MUSCLES);
const EQUIP = {
  langhantel: { l: 'Langhantel', icon: I.barbell, load: 'side', base: 20, step: 1.25 },
  multipresse: { l: 'Multipresse', icon: I.smith, load: 'side', base: 20, step: 1.25 },
  kurzhantel: { l: 'Kurzhanteln', icon: I.dumbbell, load: 'hand', base: 0, step: 2.5 },
  maschine: { l: 'Maschine', icon: I.machine, load: 'total', base: 0, step: 5 },
  kabel: { l: 'Kabelzug', icon: I.cable, load: 'total', base: 0, step: 2.5 },
  koerper: { l: 'Körpergewicht', icon: I.body, load: 'extra', base: 0, step: 2.5 },
  sonstiges: { l: 'Sonstiges', icon: I.other, load: 'total', base: 0, step: 2.5 },
};
const LOADS = {
  total: { l: 'Gesamtgewicht', s: 'Du trägst das Gewicht ein, das am Gerät steht' },
  side: { l: 'Pro Seite', s: 'Du trägst die Scheiben einer Seite ein, die App rechnet × 2 + Stange' },
  hand: { l: 'Pro Hantel', s: 'Gewicht einer Kurzhantel' },
  extra: { l: 'Zusatzgewicht', s: 'Körpergewicht + eingetragenes Zusatzgewicht' },
};
const SIZES = {
  gross: { l: 'Groß (Grundübung)', rest: 180, rep: [6, 10], warm: [{ p: .5, r: 8 }, { p: .7, r: 5 }, { p: .85, r: 2 }] },
  mittel: { l: 'Mittel', rest: 120, rep: [8, 12], warm: [{ p: .6, r: 8 }] },
  klein: { l: 'Klein (Isolation)', rest: 90, rep: [10, 15], warm: [] },
};
// Startwerte für bekannte Übungen: [Muskel, weitere, Größe, Wdh-Bereich?, Pause?]
const KNOWN = {
  'Bankdrücken': ['Brust', ['Trizeps', 'Schultern'], 'gross'],
  'Schrägbankdrücken': ['Brust', ['Schultern', 'Trizeps'], 'gross', [8, 12], 150],
  'Butterfly weit': ['Brust', [], 'klein'],
  'Latzug weit mit Obergriff': ['Lat', ['Oberer Rücken', 'Bizeps'], 'mittel'],
  'Latzug eng mit Neutralgriff': ['Lat', ['Bizeps'], 'mittel'],
  'Rudern mit Brustauflage weit': ['Oberer Rücken', ['Lat', 'Schultern'], 'mittel'],
  'Schulterdrücken im Sitzen': ['Schultern', ['Trizeps'], 'gross', [8, 12], 150],
  'Seitheben': ['Schultern', [], 'klein', [12, 15]],
  'Preacher Curls': ['Bizeps', [], 'klein', [8, 12]],
  'Hammer Curls': ['Bizeps', ['Unterarme'], 'klein', [8, 12]],
  'Trizepsdrücken': ['Trizeps', [], 'klein'],
  'Trizepsdrücken über dem Kopf': ['Trizeps', [], 'klein'],
  'Kniebeugen': ['Quadrizeps', ['Gesäß', 'Adduktoren'], 'gross'],
  'Rumänisches Kreuzheben': ['Beinbeuger', ['Gesäß', 'Unterer Rücken'], 'gross'],
  'Bulgarian Split Squats': ['Quadrizeps', ['Gesäß'], 'gross', [8, 12], 150],
  'Hip Thrusts': ['Gesäß', ['Beinbeuger'], 'mittel'],
  'Beinbeugen im Sitzen': ['Beinbeuger', [], 'klein'],
  'Beinstrecken': ['Quadrizeps', [], 'klein'],
  'Wadenheben an der Beinpresse': ['Waden', [], 'klein'],
  'Adduktoren': ['Adduktoren', [], 'klein'],
  'Crunches im Knien': ['Bauch', [], 'klein', [10, 15], 60],
  'Russian Twists': ['Bauch', [], 'klein', [20, 30], 60],
};

/* ---------- Übungen & Varianten ---------- */
function newExercise(name, { muscle, secondary, size, equip, vname } = {}) {
  const k = KNOWN[name] || [];
  const sz = size || k[2] || 'mittel';
  const ex = {
    id: 'e' + uid(), name, muscle: muscle || k[0] || 'Sonstiges', secondary: secondary || k[1] || [], size: sz,
    repMin: (k[3] || SIZES[sz].rep)[0], repMax: (k[3] || SIZES[sz].rep)[1], rest: k[4] || SIZES[sz].rest,
    warmup: null, variants: [], notes: '',
  };
  if (equip) addVariant(ex, equip, vname);
  return ex;
}
function addVariant(ex, equip, name) {
  const e = EQUIP[equip] || EQUIP.sonstiges;
  const v = { id: 'v' + uid(), name: name || e.l, equip, load: e.load, base: e.base, step: e.step, uni: /einarmig|einbeinig|bulgarian|split squat/i.test(ex.name + ' ' + (name || '')), photo: null };
  ex.variants.push(v);
  return v;
}
const exById = id => S.exercises.find(e => e.id === id) || null;
function findVar(vid) { for (const ex of S.exercises) { const v = ex.variants.find(x => x.id === vid); if (v) return { ex, v }; } return { ex: null, v: null }; }
const varOf = (ex, vid) => ex && (ex.variants.find(v => v.id === vid) || ex.variants[0]);
const muscleColor = m => MUSCLES[m] || MUSCLES.Sonstiges;
function tileHtml(ex, v, cls = '') {
  const col = muscleColor(ex ? ex.muscle : 'Sonstiges');
  const icon = (EQUIP[v?.equip] || EQUIP.sonstiges).icon;
  return `<span class="tile ${cls}" style="--mc:${col}">${v && v.photo ? `<img data-pid="${v.photo}" alt="">` : icon}</span>`;
}

/* ---------- Gewichte ---------- */
const total = (v, w) => v.load === 'side' ? 2 * w + (+v.base || 0) : v.load === 'total' ? w + (+v.base || 0) : w;
const fromTotal = (v, T) => v.load === 'side' ? (T - (+v.base || 0)) / 2 : v.load === 'total' ? T - (+v.base || 0) : T;
const wTxt = (v, w) => (v && v.load === 'extra' ? (w > 0 ? '+' : '') : '') + f2(w);
function totalHint(v, w) {
  if (!v || isNaN(num(w))) return '';
  if (v.load === 'side') return `${f2(total(v, w))} kg ges.`;
  if (v.load === 'total' && +v.base) return `${f2(total(v, w))} kg ges.`;
  if (v.load === 'hand') return 'je Hand';
  return '';
}
const e1rm = (v, s) => { const T = v.load === 'extra' ? s.w : total(v, s.w); return s.r > 0 ? T * (1 + Math.min(s.r, 30) / 30) : 0; };
const repsTxt = (v, r) => `${r}${v && v.uni ? '/Seite' : ''}`;
const setTxt = (v, s) => `${wTxt(v, s.w)} × ${repsTxt(v, s.r)}${s.rir != null && s.rir !== '' ? ` @${s.rir}` : ''}`;
function knownWeights(vid) {
  const set = new Set();
  for (const w of S.workouts) for (const it of w.items) if (it.varId === vid) for (const s of it.sets) set.add(+s.w);
  return [...set].filter(x => !isNaN(x)).sort((a, b) => a - b);
}
function nextWeight(v, w) {
  const step = +v.step || 2.5;
  const cand = knownWeights(v.id).filter(x => x > w + 1e-6)[0];
  if (cand !== undefined && cand - w <= Math.max(step * 3, Math.abs(w) * 0.12)) return cand;
  return Math.round((w + step) * 100) / 100;
}
function roundW(v, w, dir = 0) {
  const step = +v.step || 2.5;
  const known = knownWeights(v.id);
  const near = known.find(x => Math.abs(x - w) <= step / 2);
  if (near !== undefined && !dir) return near;
  const f = dir < 0 ? Math.floor : dir > 0 ? Math.ceil : Math.round;
  return Math.max(0, Math.round(f(w / step) * step * 100) / 100);
}

/* ---------- Scheibenrechner ---------- */
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COL = { 25: '#e5484d', 20: '#3d9bff', 15: '#f5c84c', 10: '#35d07f', 5: '#e9edf3', 2.5: '#9aa3b2', 1.25: '#6b7385' };
function platesFor(perSide) {
  let rest = Math.round(perSide * 100) / 100; const out = [];
  for (const p of PLATES) while (rest >= p - 1e-6) { out.push(p); rest = Math.round((rest - p) * 100) / 100; }
  return { plates: out, rest };
}
function platesHtml(v, w, label) {
  if (!v || v.load !== 'side' || isNaN(num(w))) return '';
  const { plates, rest } = platesFor(num(w));
  return `<div class="plates"><span class="pl-l">${esc(label)}</span>${plates.length ? plates.map(p => `<span class="plate" style="--pc:${PLATE_COL[p]}">${f2(p)}</span>`).join('') : '<span class="muted">nur Stange</span>'}${rest > 0 ? `<span class="muted">+ ${f2(rest)} kg?</span>` : ''}</div>`;
}

/* ---------- Pausen messen ---------- */
const SET_SEC = 45; // geschätzte Dauer eines Satzes, wird vom Abstand abgezogen
function restStats(items) {
  let sum = 0, n = 0, plan = 0;
  const per = items.map(it => {
    const ex = exById(it.exId);
    const ts = it.sets.map(s => s.t).filter(Boolean).sort((a, b) => a - b);
    const rs = [];
    for (let i = 1; i < ts.length; i++) { const r = (ts[i] - ts[i - 1]) / 1000 - SET_SEC; if (r > 0 && r < 1800) rs.push(r); }
    if (rs.length) { sum += rs.reduce((a, b) => a + b, 0); n += rs.length; plan += (ex ? ex.rest : 0) * rs.length; }
    return rs.length ? { avg: rs.reduce((a, b) => a + b, 0) / rs.length, plan: ex ? ex.rest : 0, n: rs.length } : null;
  });
  return { per, avg: n ? sum / n : null, plan: n ? plan / n : null };
}

/* ---------- Sätze pro Muskel ---------- */
function muscleSets(mon) {
  const end = addDays(mon, 7), res = {};
  const add = (exId, n) => { const ex = exById(exId); if (!ex || !n) return; res[ex.muscle] = (res[ex.muscle] || 0) + n; ex.secondary.forEach(m => { res[m] = (res[m] || 0) + n * 0.5; }); };
  for (const w of S.workouts) { const d = fromKey(w.date); if (d >= mon && d < end) w.items.forEach(it => add(it.exId, it.sets.length)); }
  if (S.active) { const d = new Date(S.active.start); if (d >= mon && d < end) S.active.items.forEach(it => add(it.exId, it.sets.filter(s => s.done).length)); }
  return Object.entries(res).sort((a, b) => b[1] - a[1]);
}
let msOffset = 0;
function muscleCardHtml() {
  const mon = addDays(weekStart(new Date()), msOffset * 7);
  const rows = muscleSets(mon);
  const max = Math.max(20, ...rows.map(r => r[1]));
  return `<section class="card ms">
    <div class="ms-h"><b>Sätze pro Muskel</b><span class="spacer"></span><button class="icon-btn sm" data-act="msPrev" aria-label="Woche zurück">${I.chevL}</button><span class="ms-w">${msOffset === 0 ? 'Diese Woche' : msOffset === -1 ? 'Letzte Woche' : 'KW ' + isoWeek(mon)}</span><button class="icon-btn sm" data-act="msNext" aria-label="Woche vor" ${msOffset >= 0 ? 'disabled' : ''}>${I.chevR}</button></div>
    ${rows.length ? `<div class="ms-rows">${rows.map(([m, n]) => `<div class="ms-r"><span class="ms-n">${esc(m)}</span><span class="ms-bar"><i style="width:${n / max * 100}%;background:${muscleColor(m)}"></i><em style="left:${10 / max * 100}%"></em></span><b>${f1(n)}</b></div>`).join('')}</div>
    <p class="ms-leg">Hauptmuskel zählt 1, Hilfsmuskel ½. Strich = 10 Sätze (häufiger Richtwert für Muskelaufbau: 10–20 pro Woche).</p>` : '<p class="muted">In dieser Woche noch keine Sätze.</p>'}
  </section>`;
}
function muscleSetsText(mon) {
  const rows = muscleSets(mon);
  return rows.length ? 'Sätze pro Muskel (Haupt 1, Hilfs ½): ' + rows.map(([m, n]) => `${m} ${f1(n)}`).join(', ') : '';
}

/* ---------- Backup-Erinnerung ---------- */
function backupDue() {
  const st = S.settings, now = Date.now();
  if (!S.workouts.length && !Object.keys(S.days).length) return null;
  if (st.backupSnooze && now < st.backupSnooze) return null;
  const ref = st.lastBackup || st.firstUse || now;
  const days = Math.floor((now - ref) / 86400000);
  return days >= 7 ? { days, never: !st.lastBackup } : null;
}
function backupCardHtml() {
  const d = backupDue(); if (!d) return '';
  return `<section class="card bk">${I.save}<div class="bk-main"><b>Zeit für ein Backup</b><small>${d.never ? 'Du hast noch nie gesichert.' : `Letztes Backup vor ${d.days} Tagen.`} Deine Daten liegen nur auf diesem Handy.</small>
    <div class="bk-btns"><button class="btn primary sm" data-act="backupNow">Jetzt sichern</button><button class="btn ghost sm" data-act="backupLater">Später</button></div></div></section>`;
}
function backupClick(act) {
  if (act === 'backupNow') { exportBackup(); return true; }
  if (act === 'backupLater') { S.settings.backupSnooze = Date.now() + 3 * 86400000; saveSettings(); renderMain(); return true; }
  return false;
}

/* ---------- Verlauf ---------- */
const sortedWorkouts = () => S.workouts.slice().sort((a, b) => b.start - a.start);
const workoutsOn = k => S.workouts.filter(w => w.date === k);
function sessionsFor(vid, { includeDeload = true, excludeId = null } = {}) {
  const out = [];
  for (const w of sortedWorkouts()) {
    if (w.id === excludeId || (!includeDeload && w.deload)) continue;
    for (const it of w.items) if (it.varId === vid && it.sets.length) out.push({ w, it });
  }
  return out;
}
function sessionsForEx(exId) {
  const out = [];
  for (const w of sortedWorkouts()) for (const it of w.items) if (it.exId === exId && it.sets.length) out.push({ w, it });
  return out;
}
const bestE1 = (v, sets) => Math.max(0, ...sets.map(s => e1rm(v, s)));

/* ---------- Progression ---------- */
function warmTemplate(ex) { return ex.warmup || SIZES[ex.size || 'mittel'].warm; }
function warmSets(ex, v, workW) {
  if (isNaN(num(workW)) || num(workW) <= 0 && v.load !== 'side') return [];
  const T = total(v, num(workW));
  return warmTemplate(ex).map(t => {
    let w = roundW(v, fromTotal(v, T * t.p), -1);
    if (w < 0) w = 0;
    return { w, r: t.r, p: t.p };
  });
}
function suggest(ex, v, n, deload = false) {
  const last = sessionsFor(v.id, { includeDeload: false })[0];
  const res = { sets: [], hint: '', last: last ? { date: last.w.date, sets: last.it.sets } : null };
  if (!last) {
    for (let i = 0; i < n; i++) res.sets.push({ w: '', r: ex.repMax ? ex.repMin : '' });
    res.hint = 'Erstes Mal – trag dein Startgewicht ein.';
    return res;
  }
  const ls = last.it.sets;
  const top = Math.max(...ls.map(s => +s.w));
  const topSets = ls.filter(s => +s.w === top);
  if (deload) {
    const dw = roundW(v, fromTotal(v, total(v, top) * 0.9), -1);
    for (let i = 0; i < n; i++) res.sets.push({ w: dw, r: ex.repMin });
    res.hint = `Deload: ca. 90 % Gewicht, weniger Sätze, locker bleiben (RIR 3–4).`;
    return res;
  }
  if (topSets.every(s => s.r >= ex.repMax)) {
    const nw = nextWeight(v, top);
    for (let i = 0; i < n; i++) res.sets.push({ w: nw, r: ex.repMin });
    res.hint = `Letztes Mal alle Sätze mit ${wTxt(v, top)} kg bei ${ex.repMax}+ Wdh → Gewicht erhöhen auf ${wTxt(v, nw)} kg.`;
    res.up = true;
    return res;
  }
  for (let i = 0; i < n; i++) {
    const s = ls[Math.min(i, ls.length - 1)];
    const w = +s.w === top || i >= ls.length ? top : +s.w;
    const r = Math.min(ex.repMax, (i < ls.length ? s.r : ls[ls.length - 1].r) + 1);
    res.sets.push({ w, r });
  }
  const minR = Math.min(...topSets.map(s => s.r));
  res.hint = `Ziel: Gewicht halten und je Satz +1 Wdh. Bei ${ex.repMax} Wdh in allen Sätzen geht's hoch.${minR < ex.repMin ? ` (Letztes Mal unter ${ex.repMin} Wdh – evtl. Gewicht senken.)` : ''}`;
  return res;
}
function stagnating(plan) {
  const out = [], seen = new Set();
  for (const d of plan.days) for (const it of d.items) {
    if (seen.has(it.varId)) continue; seen.add(it.varId);
    const { ex, v } = findVar(it.varId); if (!ex) continue;
    const ss = sessionsFor(v.id, { includeDeload: false });
    if (ss.length < 4) continue;
    const recent = Math.max(...ss.slice(0, 3).map(s => bestE1(v, s.it.sets)));
    const before = Math.max(...ss.slice(3, 6).map(s => bestE1(v, s.it.sets)));
    if (recent <= before * 1.005) out.push({ ex, v });
  }
  return out;
}

/* ---------- Pläne ---------- */
function activePlan() { return S.plans.find(p => p.id === S.settings.gym.activePlan) || S.plans[0] || null; }
function planNextBase(plan) {
  const ws = S.workouts.filter(w => w.planId === plan.id && w.dayIdx != null).sort((a, b) => b.start - a.start);
  const last = ws[0];
  if (!last || !plan.days.length) return { idx: 0, week: plan.week || 1 };
  let idx = last.dayIdx + 1;
  let week = last.week || plan.week || 1;
  if (idx >= plan.days.length) { idx = 0; week++; }
  if (plan.weekOverride && plan.weekOverride.after === last.id) week = plan.weekOverride.week;
  return { idx, week };
}
function dayDone(plan, i, week) { return S.workouts.some(w => w.planId === plan.id && w.dayIdx === i && w.week === week); }

/* ---------- Ansicht: Training ---------- */
function renderTraining() {
  const app = $('#app');
  const tk = todayKey(), mon = weekStart(new Date());
  const plan = activePlan();
  let planHtml = '';
  if (plan) {
    const nx = planNext(plan);
    const stag = stagnating(plan);
    planHtml = `
      <div class="plan-h"><h2>${esc(plan.name)}</h2><button class="icon-btn sm2" data-act="planMenu" aria-label="Plan-Menü">${I.dots}</button><span class="spacer"></span><span class="plan-week">Woche ${nx.week}</span></div>
      ${plan.deload ? `<div class="deload-b">${I.timer}<span><b>Deload aktiv</b> – leichtere Gewichte, weniger Sätze.</span><button class="chip" data-act="deloadOff">Beenden</button></div>` : ''}
      <section class="card plan-days">${plan.days.map((d, i) => {
        const done = dayDone(plan, i, nx.week), next = i === nx.idx && !S.active;
        const shown = d.items.slice(0, 3);
        return `<button class="pday ${next ? 'next' : ''}" data-act="day" data-i="${i}">
          <span class="pday-n ${done ? 'done' : ''}">${done ? I.check : i + 1}</span>
          <span class="pday-main"><b>${esc(d.name)}</b>${next ? '<small class="next-tag">Als Nächstes</small>' : `<small>${d.items.length} Übungen</small>`}</span>
          <span class="pday-tiles">${shown.map(it => { const { ex, v } = findVar(it.varId); return tileHtml(ex, v, 'sm'); }).join('')}${d.items.length > 3 ? `<span class="tile sm more">+${d.items.length - 3}</span>` : ''}</span>
        </button>`;
      }).join('') || '<div class="empty">Noch keine Trainingstage. Über ⋯ → „Plan bearbeiten“ anlegen.</div>'}</section>
      ${muscleCardHtml()}
      ${stag.length && !plan.deload ? `<section class="card stag">
        <div class="stag-h">${I.chart}<b>Keine Steigerung seit 3 Einheiten</b></div>
        <p>${stag.slice(0, 6).map(s => esc(s.ex.name)).join(', ')}${stag.length > 6 ? ` und ${stag.length - 6} weitere` : ''}</p>
        <small>${stag.length >= 3 ? 'Wenn das viele Übungen betrifft, ist eine Deload-Woche einen Gedanken wert.' : 'Einzelne Ausreißer sind normal – beobachten.'}</small>
        ${stag.length >= 3 ? '<button class="btn ghost" data-act="deloadOn">Deload starten</button>' : ''}
      </section>` : ''}`;
  } else {
    planHtml = `<div class="empty"><b>Noch kein Plan</b>Importiere deine Daten aus Alpha Progression (Einstellungen) oder erstelle einen Plan.</div>
      <button class="btn primary full" data-act="newPlan">${I.plus} Plan erstellen</button>`;
  }
  app.innerHTML = `
    <header class="top">
      <div class="kw"><span class="kw-num">Training</span><span class="kw-range">KW ${isoWeek(new Date())} · ${rangeLabel(mon)}</span></div>
      <div class="top-actions">
        <button class="icon-btn" data-act="share" aria-label="Teilen">${I.share}</button>
        <button class="icon-btn" data-act="settings" aria-label="Einstellungen">${I.gear}</button>
      </div>
    </header>
    ${backupCardHtml()}
    <nav class="week">${[0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = addDays(mon, i), k = keyOf(d), n = workoutsOn(k).length;
      return `<button class="wd ${k === tk ? 'today' : ''}" data-act="wday" data-k="${k}"><span>${WD[i]}</span><b>${d.getDate()}</b><i class="${n ? 'on' : ''}"></i></button>`;
    }).join('')}</nav>
    ${planHtml}
    <div class="links">
      <button class="row" data-act="history">${I.list}<span class="row-main"><b>Verlauf</b><small>${S.workouts.length} Trainings</small></span>${I.chevR}</button>
      <button class="row" data-act="plans">${I.book}<span class="row-main"><b>Alle Pläne</b><small>${S.plans.length} ${S.plans.length === 1 ? 'Plan' : 'Pläne'}</small></span>${I.chevR}</button>
      <button class="row" data-act="freeWorkout">${I.plus}<span class="row-main"><b>Freies Training</b><small>Ohne Plan starten</small></span>${I.chevR}</button>
    </div>`;
  fillThumbs(app);
}
async function trainingClick(a, act) {
  const plan = activePlan();
  if (backupClick(act)) return;
  if (act === 'msPrev' || act === 'msNext') { msOffset = Math.min(0, msOffset + (act === 'msPrev' ? -1 : 1)); renderMain(); return; }
  if (act === 'day') openDaySheet(plan, +a.dataset.i);
  else if (act === 'resume') openWorkout();
  else if (act === 'planMenu') planMenu(plan);
  else if (act === 'deloadOn' || act === 'deloadOff') { plan.deload = act === 'deloadOn'; savePlans(); renderMain(); toast(plan.deload ? 'Deload aktiv – Vorschläge sind jetzt leichter' : 'Deload beendet'); }
  else if (act === 'newPlan') openPlanEditor(null);
  else if (act === 'history') openHistory();
  else if (act === 'plans') openPlansList();
  else if (act === 'freeWorkout') startWorkout({ title: 'Freies Training', items: [] });
  else if (act === 'settings') openSettings();
  else if (act === 'share') openExport({ dk: todayKey(), what: 'training' });
  else if (act === 'wday') {
    const ws = workoutsOn(a.dataset.k);
    if (!ws.length) { toast('An diesem Tag kein Training'); return; }
    if (ws.length === 1) openWorkoutDetail(ws[0]);
    else { const id = await menu(longDate(a.dataset.k), ws.map(w => ({ label: w.title, sub: timeOf(w.start), value: w.id }))); if (id) openWorkoutDetail(S.workouts.find(w => w.id === id)); }
  }
}
async function planMenu(plan) {
  const items = [
    { label: 'Plan bearbeiten', value: 'edit', icon: I.edit },
    { label: plan.deload ? 'Deload beenden' : 'Deload starten', sub: 'Leichtere Gewichte & weniger Sätze bis du es beendest', value: 'deload', icon: I.timer },
    { label: 'Woche ändern', sub: `aktuell Woche ${planNext(plan).week}`, value: 'week', icon: I.list },
    { label: 'Nächsten Tag ändern', sub: `aktuell ${plan.days[planNext(plan).idx]?.name || '–'}`, value: 'nextday', icon: I.swap },
  ];
  if (S.plans.length > 1) items.push({ label: 'Anderen Plan wählen', value: 'switch', icon: I.book });
  items.push({ label: 'Neuer Plan', value: 'new', icon: I.plus });
  const v = await menu(plan.name, items);
  if (v === 'edit') openPlanEditor(plan);
  else if (v === 'deload') { plan.deload = !plan.deload; savePlans(); renderMain(); }
  else if (v === 'new') openPlanEditor(null);
  else if (v === 'switch') openPlansList();
  else if (v === 'week') {
    const cur = planNext(plan).week;
    const w = await pickNumber({ title: 'Aktuelle Woche', value: cur, decimals: false, options: Array.from({ length: 20 }, (_, i) => ({ v: i + 1 })), cols: 5 });
    if (w === null || w < 1) return;
    const last = S.workouts.filter(x => x.planId === plan.id && x.dayIdx != null).sort((a, b) => b.start - a.start)[0];
    if (last) plan.weekOverride = { after: last.id, week: Math.round(w) }; else plan.week = Math.round(w);
    savePlans(); renderMain();
  } else if (v === 'nextday') {
    const i = await menu('Als Nächstes', plan.days.map((d, i) => ({ label: `${i + 1}. ${d.name}`, value: String(i) })));
    if (i === null) return;
    // Wir setzen einen Marker-Eintrag: letzter Tag = i-1 (ohne Training)
    const nx = planNext(plan);
    plan.nextOverride = { idx: +i, week: nx.week, at: Date.now() };
    savePlans(); renderMain();
  }
}
// Nächster Tag mit manueller Überschreibung
function planNext(plan) {
  const r = planNextBase(plan);
  const o = plan.nextOverride;
  if (o) {
    const after = S.workouts.some(w => w.planId === plan.id && w.start > o.at);
    if (!after) return { idx: Math.min(o.idx, plan.days.length - 1), week: o.week };
  }
  return r;
}

function openDaySheet(plan, i) {
  const d = plan.days[i];
  const sh = openSheet({ title: d.name, full: true });
  const render = () => {
    sh.content.innerHTML = `
      ${plan.deload ? `<div class="info warn">Deload aktiv – die Vorschläge sind leichter.</div>` : ''}
      <div class="list">${d.items.map(it => {
        const { ex, v } = findVar(it.varId); if (!ex) return '';
        const last = sessionsFor(v.id)[0];
        return `<button class="row" data-act="ex" data-id="${ex.id}">${tileHtml(ex, v)}<span class="row-main"><b>${esc(ex.name)}</b><small>${esc(v.name)} · ${it.sets} × ${ex.repMin}–${ex.repMax}${last ? ` · zuletzt ${last.it.sets.map(s => setTxt(v, s)).join(', ')}` : ''}</small></span></button>`;
      }).join('')}</div>
      <div class="sheet-actions"><button class="btn" data-act="edit">${I.edit} Bearbeiten</button><button class="btn primary" data-act="start">${I.play} Training starten</button></div>`;
    fillThumbs(sh.content);
  };
  sh.refresh = render;
  sh.content.addEventListener('click', async e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    if (a.dataset.act === 'start') {
      const nx = planNext(plan);
      const week = nx.week;
      const ok = await startWorkout({ title: d.name, planId: plan.id, dayIdx: i, week, deload: !!plan.deload, items: d.items.map(x => ({ varId: x.varId, sets: plan.deload ? Math.max(1, Math.ceil(x.sets / 2)) : x.sets })) }, sh);
      if (ok === false) return;
    } else if (a.dataset.act === 'edit') openPlanEditor(plan, i);
    else if (a.dataset.act === 'ex') openExerciseDetail(exById(a.dataset.id));
  });
  render();
}

/* ---------- Training (aktiv) ---------- */
function buildItem(varId, n, deload) {
  const { ex, v } = findVar(varId);
  const sg = suggest(ex, v, n, deload);
  return { id: uid(), exId: ex.id, varId: v.id, sets: sg.sets.map(s => ({ w: s.w, r: s.r, rir: null, done: false, sug: true })), warmDone: [], note: '' };
}
async function startWorkout({ title, planId = null, dayIdx = null, week = null, deload = false, items }, fromSheet) {
  if (S.active) {
    const c = await dialog({ title: 'Es läuft schon ein Training', text: `„${S.active.title}“ ist noch nicht beendet.`, buttons: [{ label: 'Weiter trainieren', value: 'resume', cls: 'primary' }, { label: 'Altes verwerfen & neu starten', value: 'new', cls: 'danger' }] });
    if (!c) return false;
    if (c === 'resume') { await closeAll(); openWorkout(); return; }
  }
  S.active = { id: 'w' + uid(), start: Date.now(), title, planId, dayIdx, week, deload, cur: 0, timer: null, items: items.map(it => buildItem(it.varId, it.sets, deload)) };
  saveActive();
  await closeAll();
  renderMain();
  openWorkout();
}

let wkPanel = null, wakeLock = null;
async function requestWake() {
  if (!S.settings.gym.wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } catch { }
}
function releaseWake() { try { wakeLock && wakeLock.release(); } catch { } wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (wkPanel && document.visibilityState === 'visible') requestWake(); });

function openWorkout() {
  if (!S.active) return;
  if (wkPanel) return;
  const ov = openPanel('wk');
  wkPanel = ov;
  requestWake();
  ov.addEventListener('closed', () => { wkPanel = null; releaseWake(); renderMain(); });
  const render = () => {
    const A = S.active; if (!A) return;
    if (A.cur >= A.items.length) A.cur = Math.max(0, A.items.length - 1);
    const it = A.items[A.cur];
    let body = '';
    if (!it) {
      body = `<div class="empty"><b>Noch keine Übung</b>Füge eine Übung hinzu.</div><button class="btn primary full" data-a="addEx">${I.plus} Übung hinzufügen</button>`;
    } else {
      const ex = exById(it.exId), v = varOf(ex, it.varId);
      const sg = suggest(ex, v, it.sets.length, A.deload);
      const first = it.sets.find(s => !isNaN(num(s.w)));
      const warms = S.settings.gym.warmups ? warmSets(ex, v, first ? first.w : NaN) : [];
      const rir = S.settings.gym.rir;
      const curIdx = it.sets.findIndex(s => !s.done);
      body = `
        <div class="wx-h"><div><h2>${esc(ex.name)}</h2>
          <button class="wx-var" data-a="variant">${(EQUIP[v.equip] || EQUIP.sonstiges).icon}${esc(v.name)}${v.uni ? ' · einseitig' : ''}${I.down}</button></div>
          <button class="icon-btn" data-a="exMenu" aria-label="Übungsmenü">${I.dots}</button></div>
        <div class="wx-meta"><span>${ex.repMin}–${ex.repMax} Wdh</span><span>${I.timer}${fmtClock(ex.rest)}</span>${v.load === 'side' ? `<span>pro Seite + ${f2(v.base)} kg</span>` : v.load === 'hand' ? '<span>pro Hantel</span>' : v.load === 'extra' ? '<span>Zusatzgewicht</span>' : ''}</div>
        ${v.note ? `<div class="fixnote">${I.edit}<span>${esc(v.note)}</span></div>` : ''}
        ${(() => { if (v.load !== 'side') return ''; const wi = warms.findIndex((_, i) => !it.warmDone[i]); if (wi >= 0) return platesHtml(v, warms[wi].w, `Aufwärmen ${wi + 1}`); const si = it.sets.findIndex(s => !s.done); return si >= 0 ? platesHtml(v, it.sets[si].w, `Satz ${si + 1} pro Seite`) : ''; })()}
        ${sg.hint ? `<div class="hint ${sg.up ? 'up' : ''}">${sg.up ? I.up : I.info}<span>${esc(sg.hint)}</span></div>` : ''}
        <div class="sets ${rir ? 'with-rir' : ''}">
          <div class="set-h"><span>Satz</span><span>KG</span><span>WDH</span>${rir ? '<span>RIR</span>' : ''}<span></span></div>
          ${warms.map((w, i) => {
            const done = !!it.warmDone[i];
            return `<div class="set warm ${done ? 'done' : ''}"><span class="sn">W</span>
              <button class="cell" data-a="ww" data-i="${i}"><b>${w.w === 0 && v.load === 'side' ? 'Stange' : wTxt(v, w.w)}</b><small>${Math.round(w.p * 100)} %</small></button>
              <button class="cell" data-a="wr" data-i="${i}"><b>${w.r}</b></button>${rir ? '<span></span>' : ''}
              <button class="tick" data-a="wdone" data-i="${i}" aria-label="Aufwärmsatz erledigt">${I.check}</button></div>`;
          }).join('')}
          ${it.sets.map((s, i) => `<div class="set ${s.done ? 'done' : ''} ${i === curIdx ? 'cur' : ''} ${s.sug && !s.done ? 'sug' : ''}"><span class="sn">${i + 1}</span>
            <button class="cell" data-a="w" data-i="${i}"><b>${isNaN(num(s.w)) ? '–' : wTxt(v, s.w)}</b>${totalHint(v, s.w) ? `<small>${totalHint(v, s.w)}</small>` : ''}</button>
            <button class="cell" data-a="r" data-i="${i}"><b>${s.r === '' || s.r == null ? '–' : s.r}</b>${v.uni ? '<small>/Seite</small>' : ''}</button>
            ${rir ? `<button class="cell" data-a="rir" data-i="${i}"><b>${s.rir == null ? '–' : s.rir}</b></button>` : ''}
            <button class="tick" data-a="done" data-i="${i}" aria-label="Satz erledigt">${I.check}</button></div>`).join('')}
        </div>
        <div class="set-add"><button class="btn ghost" data-a="addSet">${I.plus} Satz</button>${it.sets.length > 1 ? `<button class="btn ghost" data-a="rmSet">${I.minus} Satz</button>` : ''}</div>
        ${it.note ? `<div class="info">${esc(it.note)}</div>` : ''}
        ${sg.last ? `<div class="lastbox"><div class="lb-h">Letztes Mal · ${shortDate(sg.last.date)}</div>${sg.last.sets.map((s, i) => `<div class="lb-r"><span>${i + 1}</span><span>${wTxt(v, s.w)} kg</span><span>${repsTxt(v, s.r)} Wdh</span><span>${s.rir != null ? 'RIR ' + s.rir : ''}</span></div>`).join('')}</div>` : ''}`;
    }
    ov.content.innerHTML = `
      <header class="wk-top">
        <button class="icon-btn" data-a="min" aria-label="Minimieren">${I.down}</button>
        <div class="wk-title"><b>${esc(A.title)}</b><small>${A.deload ? 'Deload · ' : ''}<span data-elapsed>${fmtClock((Date.now() - A.start) / 1000)}</span></small></div>
        <button class="btn primary sm" data-a="finish">Beenden</button>
      </header>
      <div class="strip">${A.items.map((x, i) => {
        const ex = exById(x.exId), v = varOf(ex, x.varId);
        const allDone = x.sets.length && x.sets.every(s => s.done);
        return `<button class="strip-t ${i === A.cur ? 'on' : ''} ${allDone ? 'done' : ''}" data-a="goto" data-i="${i}">${tileHtml(ex, v)}${allDone ? `<span class="strip-ck">${I.check}</span>` : ''}</button>`;
      }).join('')}<button class="strip-t add" data-a="addEx" aria-label="Übung hinzufügen">${I.plus}</button></div>
      <div class="wk-body">${body}</div>
      <div class="timer-bar" data-a="timer"></div>`;
    fillThumbs(ov.content);
    updateTimerBar();
    const on = $('.strip-t.on', ov.content); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  };
  ov.refresh = render;
  ov.content.addEventListener('click', e => workoutClick(e, render));
  render();
}
function setTimer(sec) {
  const A = S.active; if (!A) return;
  A.timer = { end: Date.now() + sec * 1000, dur: sec, rang: false };
  saveActive(); updateTimerBar();
}
function updateTimerBar() {
  const bar = wkPanel && $('.timer-bar', wkPanel.content); if (!bar) return;
  const A = S.active, t = A && A.timer;
  const allDone = A && A.items.length && A.items.every(it => it.sets.length && it.sets.every(s => s.done));
  const left = t ? (t.end - Date.now()) / 1000 : 0;
  if (allDone) {
    bar.dataset.a = 'finish';
    bar.className = 'timer-bar finish';
    bar.innerHTML = `${I.check}<b>Workout beenden</b>${t && left > 0 ? `<small>Pause ${fmtClock(left)}</small>` : ''}`;
    return;
  }
  bar.dataset.a = 'timer';
  if (!t) { bar.className = 'timer-bar idle'; bar.innerHTML = `${I.timer}<span>Pause startet nach dem Abhaken</span>`; return; }
  if (left <= 0) { bar.className = 'timer-bar over'; bar.innerHTML = `${I.check}<span><b>Pause vorbei</b> – nächster Satz</span><small>${fmtClock(-left)} drüber</small>`; return; }
  const frac = Math.max(0, Math.min(1, left / t.dur));
  bar.className = 'timer-bar run';
  bar.innerHTML = `<i style="width:${frac * 100}%"></i>${I.timer}<b>${fmtClock(left)}</b><small>Pause · antippen</small>`;
}
function renderActiveBar() {
  const el = $('#activeBar'); if (!el) return;
  const A = S.active;
  document.body.classList.toggle('has-active', !!A);
  if (!A) { el.hidden = true; return; }
  el.hidden = false;
  const t = A.timer, left = t ? (t.end - Date.now()) / 1000 : 0;
  const done = A.items.reduce((n, it) => n + it.sets.filter(s => s.done).length, 0);
  const all = A.items.reduce((n, it) => n + it.sets.length, 0);
  el.innerHTML = `<span class="pulse"></span><span class="ab-main"><b>${esc(A.title)}</b><small>${fmtDur(Date.now() - A.start)} · ${done}/${all} Sätze</small></span>${t && left > 0 ? `<span class="ab-timer">${I.timer}${fmtClock(left)}</span>` : ''}<span class="ab-go">${I.chevR}</span>`;
}
function gymTick() {
  const A = S.active; if (!A) return;
  $$('[data-elapsed]').forEach(el => { el.textContent = el.closest('.wk-title') ? fmtClock((Date.now() - A.start) / 1000) : fmtDur(Date.now() - A.start); });
  const t = A.timer;
  if (t && !t.rang && Date.now() >= t.end) {
    t.rang = true; saveActive();
    if (document.visibilityState === 'visible') {
      if (S.settings.gym.vibrate && navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 400]);
      if (S.settings.gym.sound) beep();
    }
  }
  updateTimerBar(); updateTimerOverlay(); renderActiveBar();
}
function adjustTimer(delta) {
  const A = S.active; if (!A || !A.timer) return;
  const t = A.timer, now = Date.now();
  t.end = Math.max(now, (t.end < now ? now : t.end) + delta * 1000);
  t.dur = Math.max(5, t.dur + delta, Math.ceil((t.end - now) / 1000));
  t.rang = t.end <= now;
  saveActive(); gymTick();
}
let tmrOv = null;
function openTimer(defaultRest) {
  const A = S.active; if (!A) return;
  if (!A.timer) setTimer(defaultRest);
  const el = document.createElement('div');
  el.className = 'ov tmr';
  el.innerHTML = `<div class="tmr-b">
      <button class="icon-btn tmr-x" data-t="close" aria-label="Schließen">${I.down}</button>
      <div class="tmr-ring"><svg viewBox="0 0 200 200"><circle class="bg" cx="100" cy="100" r="88"/><circle class="fg" cx="100" cy="100" r="88"/></svg>
        <div class="tmr-c"><b data-tmr-time>0:00</b><span data-tmr-sub>Pause</span></div></div>
      <div class="tmr-adj">${[-30, -15, 15, 30].map(d => `<button class="btn" data-t="${d}">${d > 0 ? '+' : '−'}${Math.abs(d)}</button>`).join('')}</div>
      <button class="btn tmr-skip" data-t="skip">Pause überspringen</button>
    </div>`;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    const t = b.dataset.t;
    if (t === 'close') closeOverlays(1);
    else if (t === 'skip') { if (S.active) { S.active.timer = null; saveActive(); } closeOverlays(1); }
    else adjustTimer(+t);
  });
  el.addEventListener('closed', () => { tmrOv = null; });
  tmrOv = el;
  pushOverlay(el);
  updateTimerOverlay();
}
function updateTimerOverlay() {
  if (!tmrOv) return;
  const t = S.active && S.active.timer;
  const fg = $('.fg', tmrOv), C = 2 * Math.PI * 88;
  if (!t) { closeOverlays(1); return; }
  const left = (t.end - Date.now()) / 1000;
  const frac = Math.max(0, Math.min(1, left / t.dur));
  fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C * (1 - frac);
  $('[data-tmr-time]', tmrOv).textContent = fmtClock(Math.max(0, left));
  $('[data-tmr-sub]', tmrOv).textContent = left > 0 ? `von ${fmtClock(t.dur)}` : 'Pause vorbei!';
  tmrOv.classList.toggle('over', left <= 0);
  if (left <= -3 && !tmrOv.dataset.closing) { tmrOv.dataset.closing = 1; closeOverlays(1); }
}
let audioCtx;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach(d => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + d); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d + 0.2);
      o.start(audioCtx.currentTime + d); o.stop(audioCtx.currentTime + d + 0.22);
    });
  } catch { }
}
function weightOptions(v, cur) {
  const step = +v.step || 2.5;
  const c = isNaN(num(cur)) ? (knownWeights(v.id).slice(-1)[0] ?? (v.load === 'side' ? 10 : 20)) : num(cur);
  const set = new Set(knownWeights(v.id).filter(x => Math.abs(x - c) <= step * 8));
  for (let k = -7; k <= 8; k++) { const x = Math.round((roundW(v, c, 0) + k * step) * 100) / 100; if (x >= 0) set.add(x); }
  set.add(c);
  return [...set].sort((a, b) => a - b).map(x => ({ v: x, label: wTxt(v, x), sub: v.load === 'side' || (v.load === 'total' && +v.base) ? f2(total(v, x)) : '' }));
}
const repOptions = (max = 30) => Array.from({ length: max }, (_, i) => ({ v: i + 1 }));
async function workoutClick(e, render) {
  const a = e.target.closest('[data-a]'); if (!a) return;
  const A = S.active; if (!A) return;
  const it = A.items[A.cur];
  const ex = it && exById(it.exId), v = it && varOf(ex, it.varId);
  const i = +a.dataset.i;
  const act = a.dataset.a;
  const save = () => { saveActive(); render(); };
  switch (act) {
    case 'min': closeOverlays(1); break;
    case 'goto': A.cur = i; save(); break;
    case 'w': {
      const s = it.sets[i];
      const val = await pickNumber({ title: `Satz ${i + 1} · Gewicht`, value: s.w, unit: 'kg', options: weightOptions(v, s.w), cols: 4, sub: v.load === 'side' ? `Pro Seite – kleine Zahl = Gesamtgewicht inkl. ${f2(v.base)} kg Stange. Scheiben für ${wTxt(v, s.w)}: ${platesFor(num(s.w) || 0).plates.map(f2).join(' + ') || '–'}` : v.load === 'extra' ? 'Zusatzgewicht (0 = nur Körpergewicht)' : null });
      if (val === null) return;
      const old = s.w;
      s.w = val; s.sug = false;
      it.sets.forEach((x, j) => { if (j > i && !x.done && (x.sug || +x.w === +old)) { x.w = val; } });
      save(); break;
    }
    case 'r': {
      const s = it.sets[i];
      const val = await pickNumber({ title: `Satz ${i + 1} · Wiederholungen${v.uni ? ' pro Seite' : ''}`, value: s.r, decimals: false, options: repOptions(Math.max(30, ex.repMax + 5)), cols: 6, sub: `Ziel ${ex.repMin}–${ex.repMax}` });
      if (val === null) return;
      s.r = Math.round(val); s.sug = false; save(); break;
    }
    case 'rir': {
      const s = it.sets[i];
      const val = await pickNumber({ title: `Satz ${i + 1} · RIR`, value: s.rir, decimals: false, sub: 'Wie viele Wiederholungen wären noch gegangen?', options: [0, 1, 2, 3, 4, 5].map(x => ({ v: x, label: x === 5 ? '5+' : String(x) })), cols: 6, extra: [{ label: 'Kein RIR', value: -1 }] });
      if (val === null) return;
      s.rir = val < 0 ? null : Math.round(val); save(); break;
    }
    case 'done': {
      const s = it.sets[i];
      if (s.done) { s.done = false; delete s.t; save(); break; }
      if (isNaN(num(s.w)) || !(num(s.r) > 0)) { toast('Bitte Gewicht und Wiederholungen eintragen'); return; }
      s.done = true; s.sug = false; s.w = num(s.w); s.r = num(s.r); s.t = Date.now();
      setTimer(ex.rest);
      if (it.sets.every(x => x.done)) {
        const nextI = A.items.findIndex((x, j) => j > A.cur && !x.sets.every(y => y.done));
        if (nextI >= 0) { saveActive(); render(); setTimeout(() => { A.cur = nextI; save(); }, 600); break; }
      }
      save(); break;
    }
    case 'ww': {
      const first = it.sets.find(s => !isNaN(num(s.w)));
      const warms = warmSets(ex, v, first.w);
      const val = await pickNumber({ title: `Aufwärmsatz ${i + 1} · Gewicht`, value: warms[i].w, unit: 'kg', options: weightOptions(v, warms[i].w), cols: 4, sub: 'Wird als Prozent vom Arbeitsgewicht gespeichert und passt sich künftig automatisch an.' });
      if (val === null) return;
      const T = total(v, num(first.w));
      const tpl = clone(warmTemplate(ex));
      tpl[i].p = Math.max(0.05, Math.min(1, total(v, val) / T));
      ex.warmup = tpl; saveExercises(); save(); break;
    }
    case 'wr': {
      const tpl = clone(warmTemplate(ex));
      const val = await pickNumber({ title: `Aufwärmsatz ${i + 1} · Wdh`, value: tpl[i].r, decimals: false, options: repOptions(20), cols: 6 });
      if (val === null) return;
      tpl[i].r = Math.round(val); ex.warmup = tpl; saveExercises(); save(); break;
    }
    case 'wdone': it.warmDone[i] = !it.warmDone[i]; if (it.warmDone[i]) setTimer(60); save(); break;
    case 'addSet': { const l = it.sets[it.sets.length - 1]; it.sets.push({ w: l ? l.w : '', r: l ? l.r : ex.repMin, rir: null, done: false, sug: true }); save(); break; }
    case 'rmSet': {
      const idx = it.sets.map(s => s.done).lastIndexOf(false);
      it.sets.splice(idx >= 0 ? idx : it.sets.length - 1, 1); save(); break;
    }
    case 'timer': openTimer(ex ? ex.rest : 90); break;
    case 'variant': {
      const items = ex.variants.map(x => ({ label: x.name, sub: `${(EQUIP[x.equip] || EQUIP.sonstiges).l} · ${LOADS[x.load].l}${x.id === v.id ? ' · aktuell' : ''}`, value: x.id, icon: (EQUIP[x.equip] || EQUIP.sonstiges).icon }));
      items.push({ label: 'Neue Variante…', value: '_new', icon: I.plus }, { label: 'Andere Übung (Ersatz)…', value: '_other', icon: I.swap });
      const c = await menu('Variante / Ersatz', items);
      if (!c) return;
      if (c === '_new') { const nv = await createVariantFlow(ex); if (nv) switchItemVar(it, nv.id); }
      else if (c === '_other') { const pick = await pickExercise('Ersatzübung wählen'); if (pick) switchItemVar(it, pick.varId); }
      else switchItemVar(it, c);
      save(); break;
    }
    case 'exMenu': {
      const c = await menu(ex.name, [
        { label: 'Übungsdetails & Einstellungen', sub: 'Wdh-Bereich, Pause, Aufwärmsätze, Graph', value: 'detail', icon: I.info },
        { label: 'Aufwärmsatz hinzufügen', value: 'addWarm', icon: I.plus },
        ...(warmTemplate(ex).length ? [{ label: 'Letzten Aufwärmsatz entfernen', value: 'rmWarm', icon: I.minus }] : []),
        { label: v.note ? 'Feste Notiz bearbeiten' : 'Feste Notiz', sub: 'Bleibt bei jedem Training sichtbar, z. B. Sitz Stufe 4', value: 'fixnote', icon: I.edit },
        { label: it.note ? 'Notiz für heute bearbeiten' : 'Notiz nur für heute', value: 'note', icon: I.edit },
        { label: 'Nach oben', value: 'upEx', icon: I.up },
        { label: 'Übung aus diesem Training entfernen', value: 'rmEx', icon: I.trash, cls: 'danger-row' },
      ]);
      if (c === 'detail') openExerciseDetail(ex);
      else if (c === 'addWarm') { const tpl = clone(warmTemplate(ex)); const lp = tpl.length ? tpl[tpl.length - 1].p : 0.4; tpl.push({ p: Math.min(0.95, lp + 0.15), r: 3 }); ex.warmup = tpl; saveExercises(); save(); }
      else if (c === 'rmWarm') { const tpl = clone(warmTemplate(ex)); tpl.pop(); ex.warmup = tpl; it.warmDone.length = Math.min(it.warmDone.length, tpl.length); saveExercises(); save(); }
      else if (c === 'fixnote') { const r = await dialog({ title: 'Feste Notiz', text: `Für ${ex.name} – ${v.name}. Leer lassen zum Löschen.`, input: { value: v.note || '', placeholder: 'z. B. Sitz Stufe 4, Polster 2', allowEmpty: true }, buttons: [{ label: 'Speichern', value: true, cls: 'primary' }] }); if (r) { v.note = r.text; saveExercisesNow(); save(); } }
      else if (c === 'note') { const r = await dialog({ title: 'Notiz', input: { value: it.note, placeholder: 'z. B. Sitz Stufe 4', allowEmpty: true }, buttons: [{ label: 'Speichern', value: true, cls: 'primary' }] }); if (r) { it.note = r.text; save(); } }
      else if (c === 'upEx' && A.cur > 0) { const [m] = A.items.splice(A.cur, 1); A.items.splice(A.cur - 1, 0, m); A.cur--; save(); }
      else if (c === 'rmEx') { if (await confirmDlg('Übung entfernen?', 'Bereits erledigte Sätze dieser Übung gehen verloren.', 'Entfernen')) { A.items.splice(A.cur, 1); save(); } }
      break;
    }
    case 'addEx': {
      const pick = await pickExercise('Übung hinzufügen');
      if (!pick) return;
      A.items.push(buildItem(pick.varId, 3, A.deload));
      A.cur = A.items.length - 1; save(); break;
    }
    case 'finish': finishWorkout(); break;
  }
}
function switchItemVar(it, vid) {
  const { ex, v } = findVar(vid);
  const changedEx = it.exId !== ex.id;
  it.exId = ex.id; it.varId = v.id; it.warmDone = [];
  const sg = suggest(ex, v, it.sets.length, S.active.deload);
  it.sets.forEach((s, i) => { if (!s.done) { s.w = sg.sets[i].w; s.r = sg.sets[i].r; s.sug = true; } });
  if (changedEx) toast(`Ersatz: ${ex.name}`); else toast(`Variante: ${v.name}`);
}
async function finishWorkout() {
  const A = S.active;
  const doneSets = A.items.reduce((n, it) => n + it.sets.filter(s => s.done).length, 0);
  const open = A.items.reduce((n, it) => n + it.sets.filter(s => !s.done).length, 0);
  const c = await dialog({
    title: 'Training beenden?',
    text: doneSets ? `${doneSets} Sätze erledigt${open ? `, ${open} offene Sätze werden nicht gespeichert` : ''}.` : 'Noch kein Satz abgehakt.',
    buttons: [...(doneSets ? [{ label: 'Speichern & beenden', value: 'save', cls: 'primary' }] : []), { label: 'Verwerfen', value: 'discard', cls: 'danger' }],
  });
  if (!c) return;
  if (c === 'discard') {
    if (!await confirmDlg('Training verwerfen?', 'Alle Einträge dieses Trainings werden gelöscht.', 'Verwerfen')) return;
    S.active = null; saveActive(); await closeAll(); renderMain(); toast('Training verworfen'); return;
  }
  const end = Date.now();
  const w = {
    id: A.id, date: keyOf(new Date(A.start)), start: A.start, end, title: A.title, planId: A.planId, dayIdx: A.dayIdx, week: A.week, deload: A.deload, source: 'app',
    items: A.items.map(it => {
      const ex = exById(it.exId), v = varOf(ex, it.varId);
      const warms = S.settings.gym.warmups ? warmSets(ex, v, (it.sets.find(s => s.done) || {}).w) : [];
      return { exId: it.exId, varId: it.varId, note: it.note || '', warm: warms.filter((_, i) => it.warmDone[i]).map(x => ({ w: x.w, r: x.r })), sets: it.sets.filter(s => s.done).map(s => ({ w: num(s.w), r: num(s.r), rir: s.rir, t: s.t || null })) };
    }).filter(it => it.sets.length),
  };
  // Rekorde
  const prs = [];
  for (const it of w.items) {
    const { ex, v } = findVar(it.varId); if (!ex) continue;
    const prev = sessionsFor(v.id).map(s => bestE1(v, s.it.sets));
    const now = bestE1(v, it.sets);
    if (prev.length && now > Math.max(...prev) + 0.01) prs.push(`${ex.name} (${v.name})`);
  }
  S.workouts.push(w); saveWorkout(w);
  S.active = null; saveActive();
  await closeAll(); renderMain();
  showSummary(w, prs);
}
function showSummary(w, prs) {
  const sh = openSheet({ title: 'Training gespeichert' });
  const sets = w.items.reduce((n, it) => n + it.sets.length, 0);
  const vol = w.items.reduce((n, it) => { const { v } = findVar(it.varId); return n + it.sets.reduce((m, s) => m + (v ? (v.load === 'extra' ? 0 : total(v, s.w)) * s.r * (v.uni ? 2 : 1) : 0), 0); }, 0);
  sh.content.innerHTML = `
    <div class="sum-grid"><div><b>${fmtDur(w.end - w.start)}</b><span>Dauer</span></div><div><b>${sets}</b><span>Sätze</span></div><div><b>${vol > 0 ? f1(vol / 1000) + ' t' : '–'}</b><span>Volumen</span></div></div>
    ${(() => { const r = restStats(w.items); return r.avg != null ? `<div class="info ${r.avg > r.plan * 1.25 ? 'warn' : ''}">${I.timer} Ø Pause <b>${fmtClock(r.avg)}</b> (geplant Ø ${fmtClock(r.plan)})${r.avg > r.plan * 1.25 ? ' – deutlich länger als geplant.' : ''}</div>` : ''; })()}
    ${prs.length ? `<div class="info pr">${I.fire}<span><b>Neue Bestleistung:</b> ${esc(prs.join(', '))}</span></div>` : ''}
    <div class="sheet-actions"><button class="btn" data-a="share">${I.share} Teilen</button><button class="btn primary" data-a="ok">Fertig</button></div>`;
  sh.content.addEventListener('click', e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'ok') closeOverlays(1);
    else openExport({ dk: w.date, what: 'training' });
  });
}

/* ---------- Übung wählen ---------- */
function pickExercise(title) {
  return new Promise(resolve => {
    let result = null, q = '';
    const sh = openSheet({ title, full: true });
    sh.content.innerHTML = `<div class="search">${I.search}<input placeholder="Übung suchen …" autocomplete="off"></div><div class="res"></div>`;
    const inp = $('input', sh.content), res = $('.res', sh.content);
    const render = () => {
      const nq = norm(q.trim());
      const list = S.exercises.filter(e => !nq || norm(e.name + ' ' + e.muscle + ' ' + e.variants.map(v => v.name).join(' ')).includes(nq));
      const groups = {};
      list.forEach(e => (groups[e.muscle] ||= []).push(e));
      res.innerHTML = MUSCLE_KEYS.filter(m => groups[m]).map(m => `<div class="list-label">${esc(m)}</div><div class="list">${groups[m].sort((a, b) => a.name.localeCompare(b.name, 'de')).map(e => `<button class="row" data-id="${e.id}">${tileHtml(e, e.variants[0])}<span class="row-main"><b>${esc(e.name)}</b><small>${esc(e.variants.map(v => v.name).join(' · '))}</small></span></button>`).join('')}</div>`).join('')
        + `<div class="list" style="margin-top:14px"><button class="row" data-new>${I.plus}<span class="row-main"><b>${q.trim() ? `„${esc(q.trim())}“ neu anlegen` : 'Neue Übung anlegen'}</b></span></button></div>`;
      fillThumbs(res);
    };
    inp.addEventListener('input', () => { q = inp.value; render(); });
    sh.content.addEventListener('click', async e => {
      const b = e.target.closest('[data-id]');
      if (b) {
        const ex = exById(b.dataset.id);
        let vid = ex.variants[0].id;
        if (ex.variants.length > 1) { vid = await menu(ex.name, ex.variants.map(v => ({ label: v.name, sub: (EQUIP[v.equip] || EQUIP.sonstiges).l, value: v.id, icon: (EQUIP[v.equip] || EQUIP.sonstiges).icon }))); if (!vid) return; }
        result = { exId: ex.id, varId: vid }; closeOverlays(1); return;
      }
      if (e.target.closest('[data-new]')) {
        const ex = await createExerciseFlow(q.trim());
        if (ex) { result = { exId: ex.id, varId: ex.variants[0].id }; closeOverlays(1); }
      }
    });
    sh.addEventListener('closed', () => resolve(result));
    render();
  });
}
async function createExerciseFlow(name = '') {
  const r = await dialog({ title: 'Neue Übung', text: 'Name der Übung (ohne Gerät – das ist die Variante).', input: { value: name, placeholder: 'z. B. Bankdrücken' }, buttons: [{ label: 'Weiter', value: true, cls: 'primary' }] });
  if (!r) return null;
  const nm = r.text.trim();
  const existing = S.exercises.find(e => norm(e.name) === norm(nm));
  if (existing) { toast('Gibt es schon – neue Variante anlegen'); const v = await createVariantFlow(existing); return v ? existing : null; }
  const muscle = await menu('Muskelgruppe', MUSCLE_KEYS.map(m => ({ label: m, value: m, icon: `<span class="dot" style="background:${muscleColor(m)}"></span>` })));
  if (!muscle) return null;
  const equip = await menu('Gerät', Object.entries(EQUIP).map(([k, e]) => ({ label: e.l, value: k, icon: e.icon })));
  if (!equip) return null;
  const size = await menu('Art der Übung', Object.entries(SIZES).map(([k, s]) => ({ label: s.l, sub: `Pause ${fmtClock(s.rest)} · ${s.rep[0]}–${s.rep[1]} Wdh · ${s.warm.length} Aufwärmsätze`, value: k })));
  if (!size) return null;
  const ex = newExercise(nm, { muscle, size, equip, secondary: [] });
  S.exercises.push(ex); saveExercisesNow();
  toast(`${nm} angelegt`);
  return ex;
}
async function createVariantFlow(ex) {
  const equip = await menu('Gerät der neuen Variante', Object.entries(EQUIP).map(([k, e]) => ({ label: e.l, value: k, icon: e.icon })));
  if (!equip) return null;
  const r = await dialog({ title: 'Name der Variante', input: { value: EQUIP[equip].l, placeholder: 'z. B. Kurzhanteln' }, buttons: [{ label: 'Anlegen', value: true, cls: 'primary' }] });
  if (!r) return null;
  const v = addVariant(ex, equip, r.text);
  saveExercisesNow();
  return v;
}

/* ---------- Übungen (Bibliothek) ---------- */
function renderExercises() {
  $('#app').innerHTML = `
    <div class="view-h"><h1>Übungen</h1><button class="btn primary" data-act="newEx" style="min-height:40px;padding:8px 14px">${I.plus} Neu</button></div>
    <div class="search">${I.search}<input id="exQ" placeholder="Suchen …" value="${esc(S.exQuery)}" autocomplete="off"></div>
    <div id="exList"></div>`;
  renderExList();
}
function renderExList() {
  const el = $('#exList'); if (!el) return;
  const nq = norm(S.exQuery.trim());
  const list = S.exercises.filter(e => !nq || norm(e.name + ' ' + e.muscle + ' ' + e.variants.map(v => v.name).join(' ')).includes(nq));
  const groups = {};
  list.forEach(e => (groups[e.muscle] ||= []).push(e));
  el.innerHTML = MUSCLE_KEYS.filter(m => groups[m]).map(m => `<div class="list-label"><span class="dot" style="background:${muscleColor(m)}"></span>${esc(m)}</div><div class="list">${groups[m].sort((a, b) => a.name.localeCompare(b.name, 'de')).map(e => {
    const last = sessionsForEx(e.id)[0];
    return `<button class="row" data-act="ex" data-id="${e.id}">${tileHtml(e, e.variants[0])}<span class="row-main"><b>${esc(e.name)}</b><small>${esc(e.variants.map(v => v.name).join(' · '))}${last ? ` · zuletzt ${shortDate(last.w.date)}` : ''}</small></span>${I.chevR}</button>`;
  }).join('')}</div>`).join('') || `<div class="empty"><b>${S.exercises.length ? 'Nichts gefunden' : 'Noch keine Übungen'}</b>${S.exercises.length ? '' : 'Importiere deine Alpha-Progression-Daten in den Einstellungen oder lege Übungen an.'}</div>`;
  fillThumbs(el);
}
async function exercisesClick(a, act) {
  if (act === 'newEx') { const ex = await createExerciseFlow(S.exQuery.trim()); if (ex) { renderMain(); openExerciseDetail(ex); } }
  else if (act === 'ex') openExerciseDetail(exById(a.dataset.id));
}

/* ---------- Übungsdetail ---------- */
function chartSvg(points, { unit = 'kg', color = 'var(--ac)' } = {}) {
  if (points.length < 2) return `<div class="chart-empty">${points.length ? 'Ab 2 Einheiten erscheint hier der Verlauf.' : 'Noch keine Daten.'}</div>`;
  const W = 320, H = 150, pl = 34, pr = 10, pt = 12, pb = 22;
  const ys = points.map(p => p.y), lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.05);
  const y0 = lo - pad, y1 = hi + pad;
  const X = i => pl + (W - pl - pr) * (points.length === 1 ? 0.5 : i / (points.length - 1));
  const Y = y => pt + (H - pt - pb) * (1 - (y - y0) / (y1 - y0));
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${d}L${X(points.length - 1).toFixed(1)},${H - pb}L${X(0).toFixed(1)},${H - pb}Z`;
  const ticks = [y0 + (y1 - y0) * 0.15, (y0 + y1) / 2, y1 - (y1 - y0) * 0.15];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="--cc:${color}">
    ${ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${Y(t)}" y2="${Y(t)}" class="gl"/><text x="${pl - 6}" y="${Y(t) + 3.5}" class="tl" text-anchor="end">${f1(t)}</text>`).join('')}
    <path d="${area}" class="ar"/><path d="${d}" class="ln"/>
    ${points.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="${points.length > 25 ? 2 : 3.2}" class="pt"/>`).join('')}
    <text x="${pl}" y="${H - 5}" class="tl">${shortDate(points[0].d).slice(4)}</text><text x="${W - pr}" y="${H - 5}" class="tl" text-anchor="end">${shortDate(points[points.length - 1].d).slice(4)}</text>
  </svg><div class="chart-u">${unit}</div>`;
}
function openExerciseDetail(ex) {
  if (!ex) return;
  const ov = openPanel();
  let tab = 'info', vsel = ex.variants[0].id, mode = 'w';
  const render = () => {
    if (!S.exercises.includes(ex)) { closeOverlays(1); return; }
    const v = varOf(ex, vsel); vsel = v.id;
    const ss = sessionsFor(v.id).slice().reverse();
    const pts = ss.slice(-30).map(s => ({ d: s.w.date, y: mode === 'w' ? Math.max(...s.it.sets.map(x => +x.w)) : mode === 'e' ? bestE1(v, s.it.sets) : s.it.sets.reduce((n, x) => n + x.r, 0) }));
    const best = ss.length ? Math.max(...ss.map(s => bestE1(v, s.it.sets))) : 0;
    let body;
    if (tab === 'info') {
      const tpl = warmTemplate(ex);
      body = `
        <div class="mchips"><span class="mchip main" style="--mc:${muscleColor(ex.muscle)}">${esc(ex.muscle)}</span>${ex.secondary.map(m => `<span class="mchip" style="--mc:${muscleColor(m)}">${esc(m)}</span>`).join('')}</div>
        <div class="chips vchips">${ex.variants.map(x => `<button class="chip ${x.id === v.id ? 'on' : ''}" data-a="vsel" data-id="${x.id}">${esc(x.name)}</button>`).join('')}<button class="chip" data-a="vnew">${I.plus} Variante</button></div>
        <section class="card chart-card">
          <div class="seg seg3">${[['w', 'Gewicht'], ['e', '1RM (geschätzt)'], ['r', 'Wdh gesamt']].map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-a="mode" data-m="${k}">${l}</button>`).join('')}</div>
          ${chartSvg(pts, { unit: mode === 'w' ? `kg (${LOADS[v.load].l.toLowerCase()})` : mode === 'e' ? 'kg geschätztes Maximalgewicht (1 Wdh)' : 'Wiederholungen pro Einheit', color: muscleColor(ex.muscle) })}
          ${best ? `<p class="muted" style="margin-top:6px">Bestes geschätztes 1RM: <b style="color:var(--tx)">${f1(best)} kg</b></p>` : ''}
        </section>
        <div class="list-label">Übung</div>
        <div class="list">
          ${setRow('muscle', 'Muskelgruppe', ex.muscle)}
          ${setRow('secondary', 'Weitere Muskeln', ex.secondary.join(', ') || '–')}
          ${setRow('size', 'Art', SIZES[ex.size].l)}
          ${setRow('reps', 'Wiederholungsbereich', `${ex.repMin}–${ex.repMax}`)}
          ${setRow('rest', 'Pausentimer', fmtClock(ex.rest))}
          ${setRow('warm', 'Aufwärmsätze', tpl.length ? tpl.map(t => `${Math.round(t.p * 100)} % × ${t.r}`).join(' · ') : 'keine')}
          ${setRow('rename', 'Name', ex.name)}
        </div>
        <div class="list-label">Variante: ${esc(v.name)}</div>
        <div class="list">
          ${setRow('vname', 'Name', v.name)}
          ${setRow('vequip', 'Gerät', (EQUIP[v.equip] || EQUIP.sonstiges).l)}
          ${setRow('vload', 'Gewichtsangabe', LOADS[v.load].l)}
          ${v.load === 'side' || v.load === 'total' ? setRow('vbase', v.load === 'side' ? 'Stange / Grundgewicht' : 'Grundgewicht (z. B. Schlitten)', `${f2(v.base)} kg`) : ''}
          ${setRow('vstep', 'Gewichtsschritt', `${f2(v.step)} kg`)}
          ${setRow('vnote', 'Feste Notiz', v.note || '–')}
          <button class="row" data-a="vuni"><span class="row-main"><b>Einseitig</b><small>Einarmig / einbeinig – Wdh pro Seite</small></span><span class="switch ${v.uni ? 'on' : ''}"><i></i></span></button>
          <div class="row photo-row"><span class="row-main"><b>Foto vom Gerät</b><small>Erscheint als Bild im Plan und im Training</small></span>
            ${v.photo ? `<span class="tile"><img data-pid="${v.photo}" alt=""></span><button class="icon-btn sm" data-a="vphotoDel" aria-label="Foto löschen">${I.trash}</button>` : ''}
            <label class="icon-btn file-btn">${I.camera}<input type="file" accept="image/*" capture="environment" data-vphoto></label></div>
          ${ex.variants.length > 1 ? `<button class="row danger-row" data-a="vdel">${I.trash}<span class="row-main"><b>Variante löschen</b></span></button>` : ''}
        </div>
        <button class="btn danger full" style="margin-top:20px" data-a="exdel">${I.trash} Übung löschen</button>`;
    } else {
      const all = sessionsForEx(ex.id);
      body = all.length ? `<div class="hist">${all.map(s => {
        const vv = varOf(ex, s.it.varId), e1 = bestE1(vv, s.it.sets);
        return `<div class="hist-i"><div class="hist-h"><b>${shortDate(s.w.date)} ${s.w.date.slice(0, 4)}</b><span>${esc(vv.name)}${s.w.deload ? ' · Deload' : ''}</span><span class="spacer"></span><small>1RM ≈ ${f1(e1)}</small></div>
          ${s.it.warm && s.it.warm.length ? `<div class="hist-w">Aufwärmen: ${s.it.warm.map(x => setTxt(vv, x)).join(', ')}</div>` : ''}
          <div class="hist-s">${s.it.sets.map((x, i) => `<span><em>${i + 1}</em>${setTxt(vv, x)}</span>`).join('')}</div></div>`;
      }).join('')}</div>` : '<div class="empty">Noch keine Einheiten.</div>';
    }
    ov.content.innerHTML = `
      <header class="ph"><button class="icon-btn" data-a="back" aria-label="Zurück">${I.back}</button><div style="min-width:0"><h2 class="ellip">${esc(ex.name)}</h2><p>${ex.variants.length} ${ex.variants.length === 1 ? 'Variante' : 'Varianten'} · ${sessionsForEx(ex.id).length} Einheiten</p></div></header>
      <div class="seg seg2">${[['info', 'Info'], ['hist', 'Historie']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-a="tab" data-t="${k}">${l}</button>`).join('')}</div>
      ${body}`;
    fillThumbs(ov.content);
  };
  const setRow = (a, l, val) => `<button class="row" data-a="${a}"><span class="row-main"><b>${l}</b></span><span class="row-val">${esc(val)}</span>${I.chevR}</button>`;
  ov.refresh = render;
  ov.content.addEventListener('change', async e => {
    if (!e.target.matches('[data-vphoto]')) return;
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    const v = varOf(ex, vsel);
    try { const b = await compressImage(f, 600, 0.8); const id = 'p' + uid(); await DB.set(id, b, 'photos'); if (v.photo) DB.del(v.photo, 'photos').catch(() => { }); v.photo = id; saveExercisesNow(); render(); toast('Foto gespeichert'); }
    catch { toast('Foto konnte nicht gelesen werden'); }
  });
  ov.content.addEventListener('click', async e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    const v = varOf(ex, vsel);
    const act = a.dataset.a;
    const done = () => { saveExercises(); render(); };
    if (act === 'back') closeOverlays(1);
    else if (act === 'tab') { tab = a.dataset.t; render(); }
    else if (act === 'mode') { mode = a.dataset.m; render(); }
    else if (act === 'vsel') { vsel = a.dataset.id; render(); }
    else if (act === 'vnew') { const nv = await createVariantFlow(ex); if (nv) { vsel = nv.id; render(); } }
    else if (act === 'muscle') { const m = await menu('Muskelgruppe', MUSCLE_KEYS.map(m => ({ label: m, value: m, icon: `<span class="dot" style="background:${muscleColor(m)}"></span>` }))); if (m) { ex.muscle = m; ex.secondary = ex.secondary.filter(x => x !== m); done(); } }
    else if (act === 'secondary') { const r = await multiSelect('Weitere Muskeln', MUSCLE_KEYS.filter(m => m !== ex.muscle && m !== 'Sonstiges'), ex.secondary); if (r) { ex.secondary = r; done(); } }
    else if (act === 'size') {
      const s = await menu('Art der Übung', Object.entries(SIZES).map(([k, s]) => ({ label: s.l, sub: `Standard: Pause ${fmtClock(s.rest)}, ${s.warm.length} Aufwärmsätze`, value: k })));
      if (s) { ex.size = s; if (await dialog({ title: 'Standardwerte übernehmen?', text: `Pause ${fmtClock(SIZES[s].rest)} und Standard-Aufwärmsätze für „${SIZES[s].l}“ setzen?`, buttons: [{ label: 'Ja, übernehmen', value: true, cls: 'primary' }] })) { ex.rest = SIZES[s].rest; ex.warmup = null; } done(); }
    }
    else if (act === 'reps') {
      const lo = await pickNumber({ title: 'Wdh-Bereich: Minimum', value: ex.repMin, decimals: false, options: repOptions(30), cols: 6 }); if (lo === null) return;
      const hi = await pickNumber({ title: 'Wdh-Bereich: Maximum', value: Math.max(ex.repMax, lo), decimals: false, options: repOptions(40).filter(o => o.v >= lo), cols: 6, sub: 'Erreichst du das Maximum in allen Sätzen, schlägt die App mehr Gewicht vor.' }); if (hi === null) return;
      ex.repMin = Math.round(lo); ex.repMax = Math.max(Math.round(hi), ex.repMin); done();
    }
    else if (act === 'rest') {
      const opts = [30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300].map(s => ({ v: s, label: fmtClock(s) }));
      const s = await pickNumber({ title: 'Pausentimer (Sekunden)', value: ex.rest, decimals: false, options: opts, cols: 4, unit: 's' }); if (s === null) return;
      ex.rest = Math.max(10, Math.round(s)); done();
    }
    else if (act === 'warm') { await editWarmups(ex); render(); }
    else if (act === 'rename') { const r = await dialog({ title: 'Übung umbenennen', input: { value: ex.name }, buttons: [{ label: 'Speichern', value: true, cls: 'primary' }] }); if (r) { ex.name = r.text; done(); } }
    else if (act === 'vname') { const r = await dialog({ title: 'Variante umbenennen', input: { value: v.name }, buttons: [{ label: 'Speichern', value: true, cls: 'primary' }] }); if (r) { v.name = r.text; done(); } }
    else if (act === 'vequip') {
      const eq = await menu('Gerät', Object.entries(EQUIP).map(([k, e]) => ({ label: e.l, value: k, icon: e.icon }))); if (!eq) return;
      v.equip = eq;
      if (await dialog({ title: 'Standardangaben übernehmen?', text: `${EQUIP[eq].l}: ${LOADS[EQUIP[eq].load].l}${EQUIP[eq].base ? `, Stange ${EQUIP[eq].base} kg` : ''}, Schritt ${f2(EQUIP[eq].step)} kg`, buttons: [{ label: 'Ja', value: true, cls: 'primary' }] })) { v.load = EQUIP[eq].load; v.base = EQUIP[eq].base; v.step = EQUIP[eq].step; }
      done();
    }
    else if (act === 'vload') { const l = await menu('Gewichtsangabe', Object.entries(LOADS).map(([k, x]) => ({ label: x.l, sub: x.s, value: k }))); if (l) { v.load = l; done(); } }
    else if (act === 'vbase') { const b = await pickNumber({ title: 'Stange / Grundgewicht', value: v.base, unit: 'kg', options: [0, 5, 7.5, 10, 15, 20, 25].map(x => ({ v: x })), cols: 4 }); if (b !== null) { v.base = b; done(); } }
    else if (act === 'vstep') { const b = await pickNumber({ title: 'Gewichtsschritt', value: v.step, unit: 'kg', options: [0.5, 1, 1.25, 2, 2.5, 5, 7, 10].map(x => ({ v: x })), cols: 4, sub: 'Für Vorschläge. Gewichte, die du schon benutzt hast, werden bevorzugt.' }); if (b !== null && b > 0) { v.step = b; done(); } }
    else if (act === 'vuni') { v.uni = !v.uni; done(); }
    else if (act === 'vnote') { const r = await dialog({ title: 'Feste Notiz', text: 'Wird im Training bei dieser Variante angezeigt. Leer lassen zum Löschen.', input: { value: v.note || '', placeholder: 'z. B. Sitz Stufe 4', allowEmpty: true }, buttons: [{ label: 'Speichern', value: true, cls: 'primary' }] }); if (r) { v.note = r.text; done(); } }
    else if (act === 'vphotoDel') { DB.del(v.photo, 'photos').catch(() => { }); v.photo = null; done(); }
    else if (act === 'vdel') {
      if (sessionsFor(v.id).length) { toast('Variante hat schon Einträge und kann nicht gelöscht werden'); return; }
      if (S.plans.some(p => p.days.some(d => d.items.some(x => x.varId === v.id)))) { toast('Variante wird in einem Plan verwendet'); return; }
      if (!await confirmDlg('Variante löschen?', v.name)) return;
      ex.variants = ex.variants.filter(x => x.id !== v.id); vsel = ex.variants[0].id; done();
    }
    else if (act === 'exdel') {
      if (sessionsForEx(ex.id).length) { toast('Übung hat schon Einträge im Verlauf und kann nicht gelöscht werden'); return; }
      if (S.plans.some(p => p.days.some(d => d.items.some(x => x.exId === ex.id || findVar(x.varId).ex === ex)))) { toast('Übung wird in einem Plan verwendet'); return; }
      if (!await confirmDlg('Übung löschen?', ex.name)) return;
      S.exercises = S.exercises.filter(x => x !== ex); saveExercisesNow(); await closeOverlays(1);
    }
  });
  render();
}
function multiSelect(title, options, selected) {
  return new Promise(resolve => {
    let result = null; const sel = new Set(selected);
    const sh = openSheet({ title });
    const render = () => { sh.content.innerHTML = `<div class="chips">${options.map(o => `<button class="chip ${sel.has(o) ? 'on' : ''}" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><button class="btn primary full" data-ok>Übernehmen</button>`; };
    sh.content.addEventListener('click', e => {
      const c = e.target.closest('[data-o]'); if (c) { const o = c.dataset.o; sel.has(o) ? sel.delete(o) : sel.add(o); render(); return; }
      if (e.target.closest('[data-ok]')) { result = options.filter(o => sel.has(o)); closeOverlays(1); }
    });
    sh.addEventListener('closed', () => resolve(result));
    render();
  });
}
function editWarmups(ex) {
  return new Promise(resolve => {
    const tpl = clone(warmTemplate(ex));
    const sh = openSheet({ title: 'Aufwärmsätze' });
    const render = () => {
      sh.content.innerHTML = `<p class="muted" style="margin-bottom:12px">In Prozent vom Arbeitsgewicht – sie wachsen automatisch mit. Gerundet wird auf deine Gewichtsschritte.</p>
        ${tpl.length ? `<div class="list">${tpl.map((t, i) => `<div class="row"><span class="sn">W${i + 1}</span><button class="chip" data-a="p" data-i="${i}">${Math.round(t.p * 100)} %</button><span class="muted">×</span><button class="chip" data-a="r" data-i="${i}">${t.r} Wdh</button><span class="spacer"></span><button class="icon-btn sm" data-a="rm" data-i="${i}">${I.x}</button></div>`).join('')}</div>` : '<div class="empty" style="padding:14px">Keine Aufwärmsätze</div>'}
        <div class="btn-row" style="margin-top:12px"><button class="btn ghost" data-a="add">${I.plus} Satz</button><button class="btn ghost" data-a="reset">Standard</button></div>
        <button class="btn primary full" style="margin-top:12px" data-a="ok">Speichern</button>`;
    };
    sh.content.addEventListener('click', async e => {
      const a = e.target.closest('[data-a]'); if (!a) return; const i = +a.dataset.i;
      if (a.dataset.a === 'p') { const v = await pickNumber({ title: 'Prozent vom Arbeitsgewicht', value: Math.round(tpl[i].p * 100), unit: '%', decimals: false, options: [30, 40, 50, 60, 65, 70, 75, 80, 85, 90].map(x => ({ v: x })), cols: 5 }); if (v !== null) { tpl[i].p = Math.max(5, Math.min(100, v)) / 100; render(); } }
      else if (a.dataset.a === 'r') { const v = await pickNumber({ title: 'Wiederholungen', value: tpl[i].r, decimals: false, options: repOptions(15), cols: 5 }); if (v !== null) { tpl[i].r = Math.round(v); render(); } }
      else if (a.dataset.a === 'rm') { tpl.splice(i, 1); render(); }
      else if (a.dataset.a === 'add') { const lp = tpl.length ? tpl[tpl.length - 1].p : 0.4; tpl.push({ p: Math.min(0.95, Math.round((lp + 0.15) * 20) / 20), r: tpl.length ? Math.max(1, tpl[tpl.length - 1].r - 3) : 8 }); render(); }
      else if (a.dataset.a === 'reset') { tpl.splice(0, tpl.length, ...clone(SIZES[ex.size].warm)); render(); }
      else if (a.dataset.a === 'ok') { tpl.sort((x, y) => x.p - y.p); ex.warmup = tpl; saveExercisesNow(); closeOverlays(1); }
    });
    sh.addEventListener('closed', () => resolve());
    render();
  });
}

/* ---------- Plan-Editor ---------- */
function openPlanEditor(plan, focusDay = null) {
  const isNew = !plan;
  const p = plan ? clone(plan) : { id: 'p' + uid(), name: 'Neuer Plan', days: [{ id: uid(), name: 'Tag 1', items: [] }], week: 1, deload: false };
  const sh = openSheet({ title: isNew ? 'Neuer Plan' : 'Plan bearbeiten', full: true });
  const render = () => {
    sh.content.innerHTML = `
      <label class="field"><span>Name des Plans</span><input data-f="name" value="${esc(p.name)}"></label>
      ${p.days.map((d, di) => `<section class="card pe-day" ${di === focusDay ? 'id="pe-focus"' : ''}>
        <div class="pe-dh"><span class="pday-n">${di + 1}</span><input data-day="${di}" value="${esc(d.name)}"><button class="icon-btn sm" data-a="dayMenu" data-d="${di}">${I.dots}</button></div>
        ${d.items.map((it, ii) => { const { ex, v } = findVar(it.varId); return ex ? `<div class="pe-it">${tileHtml(ex, v, 'sm')}<button class="pe-n" data-a="iv" data-d="${di}" data-i="${ii}"><b>${esc(ex.name)}</b><small>${esc(v.name)}</small></button>
          <span class="stepper"><button data-a="sm" data-d="${di}" data-i="${ii}">${I.minus}</button><b>${it.sets}</b><button data-a="sp" data-d="${di}" data-i="${ii}">${I.plus}</button></span>
          <button class="icon-btn sm" data-a="im" data-d="${di}" data-i="${ii}">${I.dots}</button></div>` : ''; }).join('')}
        <button class="btn ghost full" data-a="addEx" data-d="${di}">${I.plus} Übung</button>
      </section>`).join('')}
      <button class="btn ghost full" data-a="addDay">${I.plus} Trainingstag hinzufügen</button>
      <div class="sheet-actions">${!isNew ? `<button class="btn danger" data-a="del">${I.trash}</button>` : ''}<button class="btn primary" data-a="save">Speichern</button></div>`;
    fillThumbs(sh.content);
  };
  sh.content.addEventListener('input', e => {
    if (e.target.dataset.f === 'name') p.name = e.target.value;
    if (e.target.dataset.day !== undefined) p.days[+e.target.dataset.day].name = e.target.value;
  });
  sh.content.addEventListener('click', async e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    const di = +a.dataset.d, ii = +a.dataset.i, d = p.days[di];
    switch (a.dataset.a) {
      case 'sm': d.items[ii].sets = Math.max(1, d.items[ii].sets - 1); render(); break;
      case 'sp': d.items[ii].sets = Math.min(10, d.items[ii].sets + 1); render(); break;
      case 'addEx': { const pick = await pickExercise('Übung hinzufügen'); if (pick) { d.items.push({ varId: pick.varId, sets: 3 }); render(); } break; }
      case 'iv': { const { ex } = findVar(d.items[ii].varId); if (ex.variants.length < 2) { openExerciseDetail(ex); break; } const c = await menu('Standard-Variante', ex.variants.map(v => ({ label: v.name, value: v.id, icon: (EQUIP[v.equip] || EQUIP.sonstiges).icon }))); if (c) { d.items[ii].varId = c; render(); } break; }
      case 'im': {
        const c = await menu('Übung im Plan', [{ label: 'Nach oben', value: 'up', icon: I.up }, { label: 'Nach unten', value: 'down', icon: I.down }, { label: 'Durch andere Übung ersetzen', value: 'swap', icon: I.swap }, { label: 'Entfernen', value: 'rm', icon: I.trash, cls: 'danger-row' }]);
        if (c === 'up' && ii > 0) [d.items[ii - 1], d.items[ii]] = [d.items[ii], d.items[ii - 1]];
        else if (c === 'down' && ii < d.items.length - 1) [d.items[ii + 1], d.items[ii]] = [d.items[ii], d.items[ii + 1]];
        else if (c === 'rm') d.items.splice(ii, 1);
        else if (c === 'swap') { const pick = await pickExercise('Ersetzen durch'); if (pick) d.items[ii].varId = pick.varId; }
        render(); break;
      }
      case 'dayMenu': {
        const c = await menu(d.name, [{ label: 'Nach oben', value: 'up', icon: I.up }, { label: 'Nach unten', value: 'down', icon: I.down }, { label: 'Tag löschen', value: 'rm', icon: I.trash, cls: 'danger-row' }]);
        if (c === 'up' && di > 0) [p.days[di - 1], p.days[di]] = [p.days[di], p.days[di - 1]];
        else if (c === 'down' && di < p.days.length - 1) [p.days[di + 1], p.days[di]] = [p.days[di], p.days[di + 1]];
        else if (c === 'rm' && await confirmDlg('Tag löschen?', d.name)) p.days.splice(di, 1);
        render(); break;
      }
      case 'addDay': p.days.push({ id: uid(), name: `Tag ${p.days.length + 1}`, items: [] }); render(); break;
      case 'del':
        if (!await confirmDlg('Plan löschen?', `„${p.name}“ wird gelöscht. Dein Trainingsverlauf bleibt erhalten.`)) return;
        S.plans = S.plans.filter(x => x.id !== p.id); savePlans(); await closeAll(); renderMain(); break;
      case 'save': {
        if (!p.name.trim()) { toast('Bitte einen Namen eingeben'); return; }
        const i = S.plans.findIndex(x => x.id === p.id);
        if (i >= 0) S.plans[i] = p; else { S.plans.push(p); S.settings.gym.activePlan = p.id; saveSettings(); }
        savePlans(); await closeAll(); renderMain(); toast('Plan gespeichert'); break;
      }
    }
  });
  render();
  if (focusDay !== null) setTimeout(() => $('#pe-focus', sh.content)?.scrollIntoView({ block: 'start' }), 300);
}
function openPlansList() {
  const sh = openSheet({ title: 'Alle Pläne' });
  const render = () => {
    const ap = activePlan();
    sh.content.innerHTML = `<div class="list">${S.plans.map(p => `<button class="row" data-id="${p.id}"><span class="row-main"><b>${esc(p.name)}</b><small>${p.days.length} Tage · ${p.days.map(d => d.name).join(', ')}</small></span>${ap && ap.id === p.id ? '<span class="badge ac">aktiv</span>' : ''}</button>`).join('')}</div>
      <button class="btn primary full" style="margin-top:14px" data-new>${I.plus} Neuer Plan</button>`;
  };
  sh.refresh = render;
  sh.content.addEventListener('click', async e => {
    if (e.target.closest('[data-new]')) { openPlanEditor(null); return; }
    const b = e.target.closest('[data-id]'); if (!b) return;
    const p = S.plans.find(x => x.id === b.dataset.id);
    const c = await menu(p.name, [{ label: 'Als aktiven Plan wählen', value: 'act', icon: I.check }, { label: 'Bearbeiten', value: 'edit', icon: I.edit }]);
    if (c === 'act') { S.settings.gym.activePlan = p.id; saveSettings(); await closeAll(); renderMain(); }
    else if (c === 'edit') openPlanEditor(p);
  });
  render();
}

/* ---------- Verlauf ---------- */
function openHistory() {
  const ov = openPanel();
  const render = () => {
    const ws = sortedWorkouts();
    let lastM = '';
    ov.content.innerHTML = `<header class="ph"><button class="icon-btn" data-a="back">${I.back}</button><div><h2>Verlauf</h2><p>${ws.length} Trainings</p></div></header>
      ${ws.map(w => {
        const d = fromKey(w.date), m = `${MON[d.getMonth()]} ${d.getFullYear()}`;
        const head = m !== lastM ? `<div class="list-label">${m}</div>` : ''; lastM = m;
        const sets = w.items.reduce((n, it) => n + it.sets.length, 0);
        return `${head}<button class="item" data-id="${w.id}"><span class="row-main"><b>${esc(w.title)}${w.deload ? '<span class="badge warn">Deload</span>' : ''}</b><small>${shortDate(w.date)} · ${timeOf(w.start)} · ${w.end ? fmtDur(w.end - w.start) : ''} · ${w.items.length} Übungen · ${sets} Sätze</small></span>${I.chevR}</button>`;
      }).join('') || '<div class="empty">Noch keine Trainings.</div>'}`;
  };
  ov.refresh = render;
  ov.content.addEventListener('click', e => {
    if (e.target.closest('[data-a=back]')) { closeOverlays(1); return; }
    const b = e.target.closest('[data-id]'); if (b) openWorkoutDetail(S.workouts.find(w => w.id === b.dataset.id));
  });
  render();
}
function openWorkoutDetail(w) {
  const sh = openSheet({ title: w.title, full: true });
  const render = () => {
    if (!S.workouts.includes(w)) { closeOverlays(1); return; }
    sh.content.innerHTML = `
      <p class="muted" style="margin-bottom:12px">${longDate(w.date)} · ${timeOf(w.start)}${w.end ? ` · ${fmtDur(w.end - w.start)}` : ''}${w.week ? ` · Woche ${w.week}` : ''}${w.deload ? ' · Deload' : ''}${w.source === 'ap' ? ' · aus Alpha Progression' : ''}</p>
      ${w.items.map((it, ii) => {
        const { ex, v } = findVar(it.varId); if (!ex) return '';
        return `<section class="card wd-ex"><div class="wd-h">${tileHtml(ex, v, 'sm')}<button class="pe-n" data-a="ex" data-i="${ii}"><b>${esc(ex.name)}</b><small>${esc(v.name)}</small></button></div>
          ${it.warm && it.warm.length ? `<div class="hist-w">Aufwärmen: ${it.warm.map(x => setTxt(v, x)).join(', ')}</div>` : ''}
          ${it.sets.map((s, si) => `<div class="wd-s"><span class="sn">${si + 1}</span><button class="chip" data-a="w" data-i="${ii}" data-s="${si}">${wTxt(v, s.w)} kg${totalHint(v, s.w) && v.load !== 'hand' ? ` <small>(${totalHint(v, s.w)})</small>` : ''}</button><button class="chip" data-a="r" data-i="${ii}" data-s="${si}">${repsTxt(v, s.r)} Wdh</button>${s.rir != null ? `<span class="muted">RIR ${s.rir}</span>` : ''}<span class="spacer"></span><button class="icon-btn sm" data-a="rm" data-i="${ii}" data-s="${si}">${I.x}</button></div>`).join('')}
          ${it.note ? `<div class="info" style="margin:8px 0 0">${esc(it.note)}</div>` : ''}
        </section>`;
      }).join('')}
      <div class="sheet-actions"><button class="btn danger" data-a="del">${I.trash}</button><button class="btn" data-a="share">${I.share} Teilen</button></div>`;
    fillThumbs(sh.content);
  };
  sh.refresh = render;
  sh.content.addEventListener('click', async e => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    const it = w.items[+a.dataset.i], s = it && it.sets[+a.dataset.s];
    const v = it && findVar(it.varId).v;
    if (a.dataset.a === 'w') { const val = await pickNumber({ title: 'Gewicht', value: s.w, unit: 'kg', options: weightOptions(v, s.w), cols: 4 }); if (val !== null) { s.w = val; saveWorkout(w); render(); } }
    else if (a.dataset.a === 'r') { const val = await pickNumber({ title: 'Wiederholungen', value: s.r, decimals: false, options: repOptions(30), cols: 6 }); if (val !== null) { s.r = Math.round(val); saveWorkout(w); render(); } }
    else if (a.dataset.a === 'rm') { it.sets.splice(+a.dataset.s, 1); if (!it.sets.length) w.items.splice(+a.dataset.i, 1); saveWorkout(w); render(); }
    else if (a.dataset.a === 'ex') openExerciseDetail(findVar(it.varId).ex);
    else if (a.dataset.a === 'share') openExport({ dk: w.date, what: 'training' });
    else if (a.dataset.a === 'del') {
      if (!await confirmDlg('Training löschen?', `${w.title} vom ${numDate(w.date)} wird endgültig gelöscht.`)) return;
      S.workouts = S.workouts.filter(x => x !== w); delWorkout(w); await closeOverlays(1); toast('Training gelöscht');
    }
  });
  render();
}

/* ---------- Export Training ---------- */
function buildWorkoutText(w) {
  const L = [];
  const d = fromKey(w.date);
  L.push(`${w.title}${w.dayIdx != null ? ` (Tag ${w.dayIdx + 1}${w.week ? ` · Woche ${w.week}` : ''})` : ''}${w.deload ? ' – DELOAD' : ''} – ${WDS[d.getDay()]}, ${numDate(w.date)}, ${timeOf(w.start)}${w.end ? `, Dauer ${fmtDur(w.end - w.start)}` : ''}`);
  const rsAll = restStats(w.items);
  if (rsAll.avg != null) L.push(`Ø Pause ${fmtClock(rsAll.avg)} (geplant Ø ${fmtClock(rsAll.plan)}; gemessen zwischen abgehakten Sätzen minus ca. ${SET_SEC} s Satzdauer)`);
  w.items.forEach((it, i) => {
    const { ex, v } = findVar(it.varId); if (!ex) return;
    const load = v.load === 'side' ? `kg pro Seite, Stange ${f2(v.base)} kg` : v.load === 'hand' ? 'kg pro Hantel' : v.load === 'extra' ? 'kg Zusatzgewicht' : 'kg';
    L.push(`${i + 1}. ${ex.name} – ${v.name}${v.uni ? ', einseitig' : ''} (${load}) · Ziel ${ex.repMin}–${ex.repMax} Wdh`);
    if (it.warm && it.warm.length) L.push(`   Aufwärmen: ${it.warm.map(s => `${wTxt(v, s.w)}×${s.r}`).join(', ')}`);
    L.push(`   Sätze: ${it.sets.map(s => `${wTxt(v, s.w)}${v.load === 'side' ? ` (=${f2(total(v, s.w))})` : ''} × ${repsTxt(v, s.r)}${s.rir != null ? ` @RIR${s.rir}` : ''}`).join(' | ')}`);
    const prev = sessionsFor(v.id, { excludeId: w.id }).find(x => x.w.start < w.start);
    if (prev) L.push(`   Vorher (${numDate(prev.w.date).slice(0, 6)}): ${prev.it.sets.map(s => `${wTxt(v, s.w)} × ${s.r}`).join(' | ')}`);
    const rs = restStats([it]).per[0];
    if (rs) L.push(`   Pausen: Ø ${fmtClock(rs.avg)} (Plan ${fmtClock(rs.plan)})`);
    if (it.note) L.push(`   Notiz: ${it.note}`);
  });
  return L.join('\n');
}
function buildTrainingExport(dk, range) {
  if (range === 'week') {
    const mon = weekStart(fromKey(dk));
    const ws = S.workouts.filter(w => { const d = fromKey(w.date); return d >= mon && d < addDays(mon, 7); }).sort((a, b) => a.start - b.start);
    if (!ws.length) return `TRAINING – KW ${isoWeek(mon)}: keine Trainings eingetragen`;
    return `TRAINING – Woche KW ${isoWeek(mon)} (${rangeLabel(mon)}) – ${ws.length} Einheiten\n${muscleSetsText(mon)}\n\n` + ws.map(buildWorkoutText).join('\n\n');
  }
  const ws = workoutsOn(dk).sort((a, b) => a.start - b.start);
  if (!ws.length) return `TRAINING – ${longDate(dk)}: kein Training (Ruhetag)`;
  return 'TRAINING – ' + ws.map(buildWorkoutText).join('\n\n');
}
