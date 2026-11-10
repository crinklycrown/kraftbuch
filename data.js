'use strict';
/* =========================================================
   Kraftbuch – Export, Einstellungen, Import, Backup
   ========================================================= */

/* ---------- Export ---------- */
function buildExport({ dk, what, range = 'day' }) {
  const parts = [];
  if (what !== 'food') parts.push(buildTrainingExport(dk, range));
  if (what !== 'training') parts.push(range === 'week' ? buildFoodWeekExport(weekStart(fromKey(dk))) : buildFoodExport(dk));
  return parts.join('\n\n————————————\n\n') + '\n\n(Export aus Kraftbuch – App-Nährwerte sind Richtwerte)';
}
function openExport({ dk, what = 'both' }) {
  let range = 'day';
  const sh = openSheet({ title: 'Teilen', full: true });
  const render = () => {
    const txt = buildExport({ dk, what, range });
    const photos = what !== 'training' && range === 'day' ? MEALS.reduce((n, m) => n + getDay(dk).meals[m.k].photos.length, 0) : 0;
    sh.content.innerHTML = `
      <div class="seg seg3">${[['both', 'Beides'], ['food', 'Essen'], ['training', 'Training']].map(([k, l]) => `<button class="${what === k ? 'on' : ''}" data-w="${k}">${l}</button>`).join('')}</div>
      <div class="seg seg2">${[['day', range === 'day' ? longDate(dk) : 'Tag'], ['week', `Woche (KW ${isoWeek(fromKey(dk))})`]].map(([k, l]) => `<button class="${range === k ? 'on' : ''}" data-r="${k}">${l}</button>`).join('')}</div>
      <pre class="preview">${esc(txt)}</pre>
      ${photos ? `<p class="muted" style="margin:10px 2px 0">${I.camera} ${photos} ${photos === 1 ? 'Foto wird' : 'Fotos werden'} mitgeschickt.</p>` : ''}
      <div class="sheet-actions"><button class="btn" data-a="copy">${I.copy} Kopieren</button><button class="btn primary" data-a="share">${I.share} Teilen</button></div>`;
  };
  sh.content.addEventListener('click', async e => {
    const w = e.target.closest('[data-w]'); if (w) { what = w.dataset.w; render(); return; }
    const r = e.target.closest('[data-r]'); if (r) { range = r.dataset.r; render(); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    const txt = buildExport({ dk, what, range });
    if (a.dataset.a === 'copy') { toast(await copyText(txt) ? 'Kopiert' : 'Kopieren nicht möglich'); return; }
    const files = what !== 'training' && range === 'day' ? await dayFiles(dk) : [];
    copyText(txt);
    try {
      if (files.length && navigator.canShare && navigator.canShare({ files })) await navigator.share({ title: 'Kraftbuch', text: txt, files });
      else if (navigator.share) await navigator.share({ title: 'Kraftbuch', text: txt });
      else toast('Text kopiert – Teilen wird hier nicht unterstützt');
    } catch (err) { if (err.name !== 'AbortError') toast('Teilen fehlgeschlagen – Text ist kopiert'); }
  });
  render();
}

/* ---------- Einstellungen ---------- */
async function openSettings() {
  const sh = openSheet({ title: 'Einstellungen', full: true });
  let est = '';
  try { const e = await navigator.storage.estimate(); est = `Belegter Speicher: ${f1(e.usage / 1048576)} MB · `; } catch { }
  const render = () => {
    const G = S.settings.goals, gs = S.settings.gym;
    const fld = (t, k, l, u) => `<label class="field"><span>${l}</span><span class="inp-g"><input data-g="${t}.${k}" inputmode="decimal" value="${f1(G[t][k])}"><em>${u}</em></span></label>`;
    const tog = (k, l, s) => `<button class="row" data-t="${k}"><span class="row-main"><b>${l}</b>${s ? `<small>${s}</small>` : ''}</span><span class="switch ${gs[k] ? 'on' : ''}"><i></i></span></button>`;
    sh.content.innerHTML = `
      <div class="sec-h" style="margin-top:4px"><h3>${I.dumbbell} Ziele Trainingstag</h3></div>
      <div class="grid2">${fld('train', 'kcal', 'Kalorien', 'kcal')}${fld('train', 'p', 'Eiweiß', 'g')}${fld('train', 'c', 'Kohlenhydrate', 'g')}${fld('train', 'f', 'Fett', 'g')}</div>
      <div class="sec-h"><h3>${I.moon} Ziele Ruhetag</h3></div>
      <div class="grid2">${fld('rest', 'kcal', 'Kalorien', 'kcal')}${fld('rest', 'p', 'Eiweiß', 'g')}${fld('rest', 'c', 'Kohlenhydrate', 'g')}${fld('rest', 'f', 'Fett', 'g')}</div>
      <p class="muted" style="margin:-4px 0 12px">Ein Tag zählt automatisch als Trainingstag, sobald du an dem Tag ein Training einträgst. Im Tagebuch kannst du es pro Tag umstellen.</p>
      <button class="btn primary full" data-a="saveGoals">Ziele speichern</button>

      <div class="sec-h"><h3>Training</h3></div>
      <div class="list">
        ${tog('rir', 'RIR-Spalte', 'Wiederholungen in Reserve pro Satz eintragen')}
        ${tog('warmups', 'Aufwärmsätze', 'Automatisch berechnet vor dem ersten Satz')}
        ${tog('wakeLock', 'Bildschirm im Training anlassen', 'Damit der Timer sichtbar bleibt und am Ende vibriert')}
        ${tog('vibrate', 'Vibration bei Pausenende', '')}
        ${tog('sound', 'Ton bei Pausenende', '')}
      </div>

      <div class="sec-h"><h3>Daten übernehmen</h3></div>
      <div class="list">
        <label class="row file-btn">${I.upload}<span class="row-main"><b>Alpha Progression importieren</b><small>CSV-Export – bereits importierte Trainings werden übersprungen</small></span><input type="file" accept=".csv,text/csv,text/plain" data-ap></label>
        <button class="row" data-a="futter">${I.leaf}<span class="row-main"><b>Futterbuch-Daten übernehmen</b><small>${S.settings.migratedFutter ? `Zuletzt übernommen am ${new Date(S.settings.migratedFutter).toLocaleDateString('de-DE')}` : 'Mahlzeiten, Gerichte, Lebensmittel & Fotos'}</small></span></button>
      </div>

      <div class="sec-h"><h3>Datensicherung</h3></div>
      <p class="muted" style="margin-bottom:12px">Alle Daten liegen nur auf diesem Handy. ${S.settings.lastBackup ? `Letztes Backup: ${new Date(S.settings.lastBackup).toLocaleDateString('de-DE')}.` : 'Noch kein Backup.'} Tipp: Beim Speichern „Drive“ wählen, dann liegt es sicher in der Cloud. Die App erinnert dich alle 7 Tage.</p>
      <div class="set-row">
        <button class="btn" data-a="export">${I.download} Backup speichern</button>
        <label class="btn file-btn">${I.upload} Wiederherstellen<input type="file" accept="application/json,.json" data-import></label>
      </div>
      <p class="muted">${est}Version ${APP_VERSION}</p>`;
  };
  sh.content.addEventListener('click', async e => {
    const t = e.target.closest('[data-t]');
    if (t) { S.settings.gym[t.dataset.t] = !S.settings.gym[t.dataset.t]; saveSettings(); render(); return; }
    const a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'saveGoals') {
      $$('[data-g]', sh.content).forEach(i => { const [t, k] = i.dataset.g.split('.'); const v = num(i.value); if (v > 0) S.settings.goals[t][k] = v; });
      saveSettings(); toast('Ziele gespeichert'); renderMain();
    } else if (a.dataset.a === 'export') exportBackup();
    else if (a.dataset.a === 'futter') {
      if (!await confirmDlg('Futterbuch-Daten übernehmen?', 'Mahlzeiten, Gerichte und Lebensmittel aus dem Futterbuch werden übernommen. Tage, die es in beiden Apps gibt, werden mit dem Stand aus dem Futterbuch überschrieben.', 'Übernehmen', 'primary')) return;
      const r = await migrateFutterbuch();
      toast(r.found ? `Übernommen: ${r.days} Tage, ${r.dishes} Gerichte` : 'Keine Futterbuch-Daten auf diesem Gerät gefunden');
      render(); renderMain();
    }
  });
  sh.content.addEventListener('change', async e => {
    if (e.target.matches('[data-import]')) { const f = e.target.files[0]; e.target.value = ''; if (f) importBackup(f); }
    if (e.target.matches('[data-ap]')) {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try {
        const r = importAlphaProgression(await f.text());
        toast(r.added ? `${r.added} Trainings importiert${r.skipped ? `, ${r.skipped} schon vorhanden` : ''}` : `Nichts Neues (${r.skipped} schon vorhanden)`);
        await closeAll(); renderMain();
      } catch (err) { console.error(err); toast('Datei konnte nicht gelesen werden – ist es der CSV-Export?'); }
    }
  });
  render();
}

/* ---------- Alpha Progression Import ---------- */
const AP_EQUIP = { 'Langhantel': 'langhantel', 'Kurzhanteln': 'kurzhantel', 'Kurzhantel': 'kurzhantel', 'Maschine': 'maschine', 'Kabelzug': 'kabel', 'Multipresse': 'multipresse', 'Körpergewicht': 'koerper', 'SZ-Stange': 'langhantel' };
const AP_GROUP = {
  'Einarmiges Seitheben': { base: 'Seitheben', vname: 'Kabelzug einarmig', uni: true },
  'Hammer Curls hinter dem Rücken': { base: 'Hammer Curls', vname: 'Kabelzug hinter dem Rücken' },
  'Preacher Hammer Curls': { base: 'Hammer Curls', vname: 'Maschine (Preacher)' },
};
function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ';') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
function parseAP(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const workouts = []; let w = null, ex = null, cols = null;
  for (const raw of lines) {
    const line = raw.trim(); if (!line) continue;
    const f = parseCsvLine(line);
    const dm = f[1] && f[1].match(/^(\d{4}-\d{2}-\d{2}) (\d{1,2}):(\d{2})/);
    if (f.length >= 2 && dm) {
      let dur = 0; const d3 = f[2] || '';
      let m;
      if ((m = d3.match(/(\d+):(\d+)\s*Std/))) dur = (+m[1] * 60 + +m[2]) * 60000;
      else if ((m = d3.match(/(\d+)\s*Std/))) dur = +m[1] * 3600000;
      else if ((m = d3.match(/(\d+)\s*Min/))) dur = +m[1] * 60000;
      const [y, mo, da] = dm[1].split('-').map(Number);
      const start = new Date(y, mo - 1, da, +dm[2], +dm[3]).getTime();
      w = { title: f[0], date: dm[1], start, end: start + dur, apKey: `${dm[1]} ${dm[2]}:${dm[3]}|${f[0]}`, exercises: [] };
      workouts.push(w); ex = null; continue;
    }
    const em = f.length === 1 && f[0].match(/^\d+\.\s+(.+)$/);
    if (em && w) {
      const p = em[1].split(' · ');
      const reps = p.length >= 3 && p[p.length - 1].match(/(\d+)\s*Wdh/);
      ex = { name: p[0].trim(), equip: (p.length >= 3 ? p[1] : p[1] || '').trim(), target: reps ? +reps[1] : null, sets: [] };
      w.exercises.push(ex); continue;
    }
    if (f[0] === '#') { cols = f.map(x => x.trim().toUpperCase()); continue; }
    if (ex && /^\d+$/.test(f[0])) {
      const get = k => { const i = (cols || ['#', 'KG', 'WDH']).indexOf(k); return i >= 0 ? f[i] : undefined; };
      const w8 = num((get('KG') || '').replace('+', '').trim());
      const r = num(get('WDH'));
      const rir = get('RIR') !== undefined ? num(get('RIR')) : NaN;
      if (!isNaN(r)) ex.sets.push({ w: isNaN(w8) ? 0 : w8, r, rir: isNaN(rir) ? null : rir });
    }
  }
  // Titel zerlegen
  for (const x of workouts) {
    const p = x.title.split(' · ').map(s => s.trim());
    x.dayName = p[0];
    const wk = p.find(s => /^Woche \d+$/.test(s));
    const tg = p.slice(1).find(s => /^Tag \d+$/.test(s));
    x.week = wk ? +wk.split(' ')[1] : null;
    x.dayIdx = tg && wk ? +tg.split(' ')[1] - 1 : null;
    x.planName = wk ? p[p.indexOf(wk) + 1] || 'Plan' : null;
  }
  return workouts;
}
function apVariant(name, equipLabel, weight, splits) {
  const key = `${name}|${equipLabel}`;
  const hi = splits[key] && weight >= splits[key];
  const mk = hi ? key + '|hi' : key;
  if (S.apMap[mk]) { const f = findVar(S.apMap[mk]); if (f.v) return f; }
  const g = AP_GROUP[name] || { base: name, vname: equipLabel || 'Standard' };
  let equip = AP_EQUIP[equipLabel] || 'sonstiges';
  let vname = g.vname;
  if (hi) { equip = 'maschine'; vname = 'Maschine'; }
  let ex = S.exercises.find(e => norm(e.name) === norm(g.base));
  if (!ex) { ex = newExercise(g.base); S.exercises.push(ex); }
  let v = ex.variants.find(x => norm(x.name) === norm(vname));
  if (!v) { v = addVariant(ex, equip, vname); if (g.uni) v.uni = true; }
  S.apMap[mk] = v.id;
  return { ex, v };
}
function importAlphaProgression(text) {
  const list = parseAP(text);
  if (!list.length) throw new Error('leer');
  // Ausreißer (z. B. andere Maschine unter gleichem Namen) erkennen
  const tops = {};
  for (const w of list) for (const e of w.exercises) if (e.sets.length) (tops[`${e.name}|${e.equip}`] ||= []).push(Math.max(...e.sets.map(s => s.w)));
  const splits = {};
  for (const [k, arr] of Object.entries(tops)) {
    const u = [...new Set(arr)].filter(x => x > 0).sort((a, b) => a - b);
    for (let i = 1; i < u.length; i++) {
      if (u[i] / u[i - 1] >= 1.8) { const hiCount = arr.filter(x => x >= u[i]).length; if (hiCount <= arr.length / 2) splits[k] = u[i]; break; }
    }
  }
  const existing = new Set(S.workouts.map(w => w.apKey).filter(Boolean));
  let added = 0, skipped = 0;
  // Pläne anlegen (nur wenn es den Plan noch nicht gibt)
  const latest = {};
  for (const w of list) if (w.planName && w.dayIdx != null) { const k = w.planName; latest[k] ||= {}; if (!latest[k][w.dayIdx] || latest[k][w.dayIdx].start < w.start) latest[k][w.dayIdx] = w; }
  const planIds = {};
  for (const [pn, days] of Object.entries(latest)) {
    let plan = S.plans.find(p => p.name === pn && p.source === 'ap');
    if (!plan) {
      const idxs = Object.keys(days).map(Number).sort((a, b) => a - b);
      plan = { id: 'p' + uid(), name: pn, source: 'ap', week: 1, deload: false, days: [] };
      for (let i = 0; i <= Math.max(...idxs); i++) {
        const w = days[i];
        plan.days.push({ id: uid(), name: w ? w.dayName : `Tag ${i + 1}`, items: w ? w.exercises.filter(e => e.sets.length).map(e => ({ varId: apVariant(e.name, e.equip, Math.max(...e.sets.map(s => s.w)), splits).v.id, sets: e.sets.length })) : [] });
      }
      S.plans.push(plan);
      if (!S.settings.gym.activePlan) S.settings.gym.activePlan = plan.id;
    }
    planIds[pn] = plan.id;
  }
  for (const w of list.sort((a, b) => a.start - b.start)) {
    if (existing.has(w.apKey)) { skipped++; continue; }
    const items = w.exercises.filter(e => e.sets.length).map(e => {
      const { ex, v } = apVariant(e.name, e.equip, Math.max(...e.sets.map(s => s.w)), splits);
      return { exId: ex.id, varId: v.id, note: '', warm: [], sets: e.sets.map(s => ({ w: s.w, r: s.r, rir: s.rir })) };
    });
    if (!items.length) continue;
    const rec = { id: 'w' + uid(), date: w.date, start: w.start, end: w.end, title: w.dayName, planId: w.planName ? planIds[w.planName] : null, dayIdx: w.dayIdx, week: w.week, deload: false, source: 'ap', apKey: w.apKey, items };
    S.workouts.push(rec); saveWorkout(rec); added++;
  }
  saveExercisesNow(); savePlans(); saveApMap(); saveSettings();
  return { added, skipped };
}

/* ---------- Futterbuch übernehmen (gleiche Domain) ---------- */
const FOOD_KEYS = ['dishes', 'customFoods', 'overrides', 'hidden', 'usage', 'recent'];
async function openOtherDb(name) {
  if (indexedDB.databases) {
    try { const list = await indexedDB.databases(); if (!list.some(d => d.name === name)) return null; } catch { }
  }
  return new Promise(res => {
    const r = indexedDB.open(name);
    let created = false;
    r.onupgradeneeded = () => { created = true; r.transaction.abort(); };
    r.onsuccess = () => { if (created) { r.result.close(); res(null); } else res(r.result); };
    r.onerror = () => res(null);
    r.onblocked = () => res(null);
  });
}
async function migrateFutterbuch() {
  const fdb = await openOtherDb('futterbuch');
  if (!fdb) return { found: false };
  try {
    if (!fdb.objectStoreNames.contains('kv')) return { found: false };
    const kv = await DB.entries('kv', fdb);
    const photos = fdb.objectStoreNames.contains('photos') ? await DB.entries('photos', fdb) : [];
    let days = 0;
    for (const [k, v] of kv) {
      if (k.startsWith('day:')) { const d = S.days[k.slice(4)]; if (d && typeof d.train === 'boolean') v.train = d.train; if (d && d.weight) v.weight = d.weight; S.days[k.slice(4)] = v; await DB.set(k, v); days++; }
      else if (FOOD_KEYS.includes(k)) { S[k] = v; await DB.set(k, v); }
      else if (k === 'settings' && v && v.goals && !S.settings.migratedFutter) {
        const g = v.goals;
        S.settings.goals.train = { ...g };
        S.settings.goals.rest = { kcal: Math.max(0, g.kcal - 300), p: g.p, c: Math.max(0, g.c - 75), f: g.f };
      }
    }
    for (const [k, v] of photos) await DB.set(k, v, 'photos');
    S.settings.migratedFutter = Date.now(); saveSettings();
    return { found: true, days, dishes: (S.dishes || []).length };
  } finally { fdb.close(); }
}

/* ---------- Backup ---------- */
const blobToDataUrl = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
async function exportBackup() {
  toast('Backup wird erstellt …');
  const data = { app: 'kraftbuch', version: 1, exported: new Date().toISOString(), kv: {}, photos: {} };
  for (const [k, v] of await DB.entries('kv')) data.kv[k] = v;
  for (const [k, v] of await DB.entries('photos')) data.photos[k] = await blobToDataUrl(v);
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const name = `kraftbuch-backup-${todayKey()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); markBackup(); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  markBackup();
  toast('Backup gespeichert');
}
function markBackup() { S.settings.lastBackup = Date.now(); delete S.settings.backupSnooze; saveSettings(); renderMain(); }
async function importBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); if (!['kraftbuch', 'futterbuch'].includes(data.app)) throw 0; }
  catch { toast('Das ist keine gültige Sicherung'); return; }
  if (data.app === 'futterbuch') {
    if (!await confirmDlg('Futterbuch-Backup einlesen?', 'Mahlzeiten, Gerichte und Lebensmittel aus dem Futterbuch-Backup werden übernommen. Deine Trainingsdaten bleiben unverändert.', 'Übernehmen', 'primary')) return;
    for (const [k, v] of Object.entries(data.kv)) if (k.startsWith('day:') || FOOD_KEYS.includes(k)) await DB.set(k, v);
    for (const [k, v] of Object.entries(data.photos)) await DB.set(k, await (await fetch(v)).blob(), 'photos');
    toast('Übernommen'); setTimeout(() => location.reload(), 700); return;
  }
  if (!await confirmDlg('Backup wiederherstellen?', `Alle aktuellen Daten werden durch die Sicherung vom ${new Date(data.exported).toLocaleDateString('de-DE')} ersetzt.`, 'Wiederherstellen', 'primary')) return;
  await DB.clear('kv'); await DB.clear('photos');
  for (const [k, v] of Object.entries(data.kv)) await DB.set(k, v);
  for (const [k, v] of Object.entries(data.photos)) await DB.set(k, await (await fetch(v)).blob(), 'photos');
  toast('Wiederhergestellt'); setTimeout(() => location.reload(), 700);
}
