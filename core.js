'use strict';
/* =========================================================
   Kraftbuch – Kern: Helfer, Speicher, Overlays, Picker
   ========================================================= */
const APP_VERSION = '1.6.1';

/* ---------- Helfer ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clone = o => JSON.parse(JSON.stringify(o));
// Zahlen in deutscher Schreibweise lesen: "3.000" = 3000, "2,5" = 2.5, "1.250,5" = 1250.5, "2.5" = 2.5
const num = v => {
  if (v === null || v === undefined || v === '') return NaN;
  if (typeof v === 'number') return v;
  let s = String(v).trim().replace(/\s/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return parseFloat(s);
};
// Wert für Eingabefelder: ohne Tausenderpunkt, Komma als Dezimalzeichen
const fIn = n => (n === '' || n == null || isNaN(n)) ? '' : String(Math.round(n * 100) / 100).replace('.', ',');
const f0 = n => Math.round(n || 0).toLocaleString('de-DE');
const f1 = n => (Math.round((n || 0) * 10) / 10).toLocaleString('de-DE');
const f2 = n => (Math.round((n || 0) * 100) / 100).toLocaleString('de-DE');
const norm = s => String(s).toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------- Datum ---------- */
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const todayKey = () => keyOf(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const weekStart = d => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const WDS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / 86400000 + 1) / 7);
}
function rangeLabel(mon) {
  const end = addDays(mon, 6);
  if (mon.getMonth() === end.getMonth()) return `${mon.getDate()}.–${end.getDate()}. ${MON[end.getMonth()]} ${end.getFullYear()}`;
  return `${mon.getDate()}. ${MONS[mon.getMonth()]} – ${end.getDate()}. ${MONS[end.getMonth()]} ${end.getFullYear()}`;
}
const longDate = k => { const d = fromKey(k); return `${WDL[d.getDay()]}, ${d.getDate()}. ${MON[d.getMonth()]}`; };
const shortDate = k => { const d = fromKey(k); return `${WDS[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; };
const numDate = k => { const d = fromKey(k); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; };
function relLabel(k) {
  const diff = Math.round((fromKey(k) - fromKey(todayKey())) / 86400000);
  return { 0: 'Heute', '-1': 'Gestern', 1: 'Morgen' }[diff] || '';
}
const fmtDur = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}:${pad(m % 60)} Std.` : `${m} Min.`; };
const fmtClock = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const timeOf = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- Icons ---------- */
const sv = p => `<svg viewBox="0 0 24 24">${p}</svg>`;
const I = {
  back: sv('<path d="M15 18l-6-6 6-6"/>'),
  down: sv('<path d="M6 9l6 6 6-6"/>'),
  chevL: sv('<path d="M15 18l-6-6 6-6"/>'),
  chevR: sv('<path d="M9 18l6-6-6-6"/>'),
  gear: sv('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  minus: sv('<path d="M5 12h14"/>'),
  x: sv('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  dots: sv('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>'),
  camera: sv('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  image: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  share: sv('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
  copy: sv('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>'),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  sun: sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  plate: sv('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>'),
  moon: sv('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  apple: sv('<path d="M12 7.5c-1.6-1.2-5-1.4-6.4 1.6S5 16 7.5 19c1.2 1.4 2.8 1.4 4.5.6 1.7.8 3.3.8 4.5-.6 2.5-3 3.4-7-2-9.9-1.6-.9-3.2-.8-2.5-.6z"/><path d="M12 7.5c0-2 1-3.5 3-4.2"/>'),
  book: sv('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>'),
  pot: sv('<path d="M4 10h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2 10h20M9 6.5c0-1.2 1-1.3 1-2.5M14 6.5c0-1.2 1-1.3 1-2.5"/>'),
  leaf: sv('<path d="M5 19c0-8.5 5.5-14 15-14 0 9.5-5.5 15-14 15"/><path d="M5 19l7-7"/>'),
  download: sv('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: sv('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>'),
  save: sv('<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7M8 20v-6h8v6"/>'),
  dumbbell: sv('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
  barbell: sv('<path d="M2 12h20M5 7v10M8 8.5v7M19 7v10M16 8.5v7"/>'),
  machine: sv('<rect x="4" y="3" width="6" height="18" rx="1.5"/><path d="M7 7h0M7 10h0M7 13h0M10 8h8M18 5v10M15 15h6"/>'),
  cable: sv('<path d="M5 3v18M19 3v18M5 4h14M12 4v8"/><path d="M9 15h6l-3-3z"/>'),
  body: sv('<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M7 10l5-2 5 2M9 21l3-7 3 7"/>'),
  smith: sv('<path d="M5 3v18M19 3v18M3 11h18M8 8v6M16 8v6"/>'),
  other: sv('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
  timer: sv('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
  swap: sv('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
  play: sv('<path d="M7 5l12 7-12 7z"/>'),
  chart: sv('<path d="M4 20V4M4 20h16M7 15l4-5 3 3 5-7"/>'),
  list: sv('<path d="M8 6h12M8 12h12M8 18h12M4 6h0M4 12h0M4 18h0"/>'),
  scale: sv('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9.5a4 4 0 0 1 6 0l-2 2.5"/>'),
  fire: sv('<path d="M12 21c4 0 7-2.6 7-6.6 0-3.1-1.8-5.1-3.3-6.6.1 1.8-.6 3-1.7 3.4C14.3 7.6 12.4 4.8 9.6 3c.4 3.5-1.6 5.4-3 7.1C5.6 11.4 5 12.7 5 14.4 5 18.4 8 21 12 21z"/>'),
  edit: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  up: sv('<path d="M6 15l6-6 6 6"/>'),
  backspace: sv('<path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>'),
  pill: sv('<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="M10 9.2l4 5.6"/>'),
  grip: sv('<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>'),
  bolt: sv('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  trophy: sv('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5"/>'),
  barcode: sv('<path d="M4 5v14M7 5v14M10.5 5v14M13 5v14M16.5 5v14M20 5v14"/>'),
};

/* ---------- Speicher (IndexedDB) ---------- */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('kraftbuch', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('photos'); };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  tx(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  },
  get(k, st = 'kv') { return this.tx(st, 'readonly', s => s.get(k)); },
  set(k, v, st = 'kv') { return this.tx(st, 'readwrite', s => s.put(v, k)); },
  del(k, st = 'kv') { return this.tx(st, 'readwrite', s => s.delete(k)); },
  clear(st) { return this.tx(st, 'readwrite', s => s.clear()); },
  entries(st = 'kv', db = this.db) {
    return new Promise((res, rej) => {
      const t = db.transaction(st, 'readonly'); const s = t.objectStore(st);
      const kr = s.getAllKeys(), vr = s.getAll();
      t.oncomplete = () => res(kr.result.map((k, i) => [k, vr.result[i]]));
      t.onerror = () => rej(t.error);
    });
  },
};

/* ---------- Zustand ---------- */
const DEFAULT_GOALS = {
  train: { kcal: 2800, p: 160, c: 360, f: 80 },
  rest: { kcal: 2500, p: 160, c: 285, f: 80 },
};
const S = {
  // Essen
  days: {}, dishes: [], customFoods: [], overrides: {}, hidden: [], usage: {}, recent: [],
  // Gym
  exercises: [], plans: [], workouts: [], active: null, apMap: {},
  settings: {
    goals: clone(DEFAULT_GOALS),
    creatin: { on: true, time: '20:00' },
    gym: { notify: false, rir: true, warmups: true, wakeLock: true, vibrate: true, sound: false, activePlan: null, plates: [20, 15, 10, 5, 2.5, 1.25] },
  },
  // UI
  sel: todayKey(), view: 'training', foodFilter: 'all', foodQuery: '', dishQuery: '', exQuery: '',
};
const persist = (k, v) => DB.set(k, clone(v)).catch(e => toast('Speichern fehlgeschlagen: ' + e.message));
const saveDay = k => persist('day:' + k, S.days[k]);
const saveDishes = () => persist('dishes', S.dishes);
const saveFoods = () => { persist('customFoods', S.customFoods); persist('overrides', S.overrides); persist('hidden', S.hidden); };
const saveUsage = () => { persist('usage', S.usage); persist('recent', S.recent); };
const saveSettings = () => persist('settings', S.settings);
const saveExercises = debounce(() => persist('exercises', S.exercises), 250);
const saveExercisesNow = () => persist('exercises', S.exercises);
const savePlans = () => persist('plans', S.plans);
const saveWorkout = w => persist('w:' + w.id, w);
const delWorkout = w => DB.del('w:' + w.id).catch(() => { });
const saveActive = () => S.active ? persist('active', S.active) : DB.del('active').catch(() => { });
const saveApMap = () => persist('apMap', S.apMap);

/* ---------- Overlays mit Zurück-Taste ---------- */
const stack = [];
let popWaiters = [];
function pushOverlay(el) {
  el.style.zIndex = 50 + stack.length * 2;
  stack.push(el);
  document.body.appendChild(el);
  el.getBoundingClientRect();
  requestAnimationFrame(() => el.classList.add('open'));
  history.pushState({ ov: stack.length }, '');
}
function removeOverlay(el) {
  el.classList.remove('open');
  el.dispatchEvent(new Event('closed'));
  setTimeout(() => el.remove(), 280);
}
function closeOverlays(n = 1) {
  n = Math.min(n, stack.length);
  if (n <= 0) return Promise.resolve();
  return new Promise(r => { popWaiters.push(r); history.go(-n); });
}
const closeAll = () => closeOverlays(stack.length);
window.addEventListener('popstate', e => {
  const target = (e.state && e.state.ov) || 0;
  while (stack.length > target) removeOverlay(stack.pop());
  const w = popWaiters; popWaiters = []; w.forEach(f => f());
  refreshAll();
});
function openSheet({ title, full = false, cls = '' }) {
  const el = document.createElement('div');
  el.className = 'ov sheet' + (full ? ' full' : '') + (cls ? ' ' + cls : '');
  el.innerHTML = `<div class="scrim"></div><div class="sheet-b"><div class="grab"></div><div class="sheet-h"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Schließen">${I.x}</button></div><div class="sheet-c"></div></div>`;
  $('.scrim', el).onclick = () => closeOverlays(1);
  $('[data-close]', el).onclick = () => closeOverlays(1);
  el.content = $('.sheet-c', el);
  el.setTitle = t => { $('.sheet-h h2', el).textContent = t; };
  pushOverlay(el);
  return el;
}
function openPanel(cls = '') {
  const el = document.createElement('div');
  el.className = 'ov panel ' + cls;
  el.innerHTML = `<div class="panel-b"><div class="panel-in"></div></div>`;
  el.content = $('.panel-in', el);
  pushOverlay(el);
  return el;
}
function dialog({ title, text = '', buttons, input = null }) {
  return new Promise(resolve => {
    let result = null;
    const el = document.createElement('div');
    el.className = 'ov dlg';
    el.innerHTML = `<div class="scrim"></div><div class="dlg-b"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}${input ? `<input value="${esc(input.value || '')}" placeholder="${esc(input.placeholder || '')}" ${input.mode ? `inputmode="${input.mode}"` : ''}>` : ''}<div class="dlg-btns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}<button class="btn ghost" data-i="-1">Abbrechen</button></div></div>`;
    $('.scrim', el).onclick = () => closeOverlays(1);
    $$('[data-i]', el).forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (i >= 0) {
        result = buttons[i].value;
        if (input) { const v = $('input', el).value.trim(); if (!v && !input.allowEmpty) { $('input', el).focus(); return; } result = { value: result, text: v }; }
      }
      closeOverlays(1);
    });
    el.addEventListener('closed', () => resolve(result));
    pushOverlay(el);
    if (input) setTimeout(() => { const i = $('input', el); i.focus(); i.select(); }, 250);
  });
}
const confirmDlg = (title, text, label = 'Löschen', cls = 'danger') => dialog({ title, text, buttons: [{ label, value: true, cls }] });
function menu(title, items) {
  // items: [{label, value, icon, cls}]
  return new Promise(resolve => {
    let result = null;
    const sh = openSheet({ title });
    sh.content.innerHTML = `<div class="list menu">${items.map((it, i) => `<button class="row ${it.cls || ''}" data-i="${i}">${it.icon || ''}<span class="row-main"><b>${esc(it.label)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span></button>`).join('')}</div>`;
    sh.content.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; result = items[+b.dataset.i].value; closeOverlays(1); });
    sh.addEventListener('closed', () => resolve(result));
  });
}

let undoT;
function showUndo(msg, undoFn) {
  const el = $('#undo');
  el.innerHTML = `<span>${esc(msg)}</span><button>Rückgängig</button>`;
  el.classList.add('show');
  clearTimeout(undoT);
  $('button', el).onclick = () => { clearTimeout(undoT); el.classList.remove('show'); undoFn(); };
  undoT = setTimeout(() => el.classList.remove('show'), 5500);
}
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- Zahlen-Picker ---------- */
function pickNumber({ title, value, options, unit = '', decimals = true, sub = null, extra = null, visual = null }) {
  // Vollbild-Zahlenauswahl: scrollbare Liste + Zahlenfeld. options: [{v, label, sub}]; visual(n) → HTML (z. B. Hantel)
  return new Promise(resolve => {
    let result = null;
    const fmt = n => decimals ? f2(n) : String(Math.round(n));
    const fmtIn = n => decimals ? fIn(n) : String(Math.round(n));
    let cur = num(value);
    const opts = options.slice();
    if (!isNaN(cur) && !opts.some(o => Math.abs(o.v - cur) < 1e-6)) opts.push({ v: cur });
    opts.sort((x, y) => x.v - y.v);
    let str = isNaN(cur) ? '' : fmtIn(cur);
    let fresh = true, ignoreUntil = 0;
    const el = document.createElement('div');
    el.className = 'ov np';
    el.innerHTML = `
      <header class="np-h"><button class="np-tbtn" data-n="cancel">Abbrechen</button><div class="np-title"><b>${esc(title)}</b>${sub ? `<small>${sub}</small>` : ''}</div>
        <span class="np-extra">${extra ? extra.map((x, i) => `<button class="np-tbtn" data-x="${i}">${esc(x.label)}</button>`).join('') : ''}</span></header>
      <div class="np-list"><div class="np-sp"></div>${opts.map(o => `<button class="np-it" data-v="${o.v}"><b>${esc(o.label ?? fmt(o.v))}${unit && !o.label ? ` ${esc(unit)}` : ''}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</button>`).join('')}<div class="np-sp"></div></div>
      <div class="np-pad">
        <div class="np-row"><div class="np-vis"></div><div class="np-val"><b></b>${unit ? `<em>${esc(unit)}</em>` : ''}</div><button class="np-ok" data-n="ok" aria-label="Bestätigen">${I.check}</button></div>
        <div class="np-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', decimals ? ',' : '', '0', 'del'].map(k => k ? `<button class="np-k" data-k="${k}">${k === 'del' ? I.backspace : k}</button>` : '<span></span>').join('')}</div>
      </div>`;
    const list = $('.np-list', el), valEl = $('.np-val b', el), vis = $('.np-vis', el);
    const update = () => {
      const n = num(str);
      valEl.textContent = str === '' ? '0' : str;
      if (visual) vis.innerHTML = visual(isNaN(n) ? 0 : n);
      $$('.np-it', list).forEach(b => b.classList.toggle('on', !isNaN(n) && Math.abs(+b.dataset.v - n) < 1e-6));
    };
    const scrollTo = (n, smooth) => {
      const items = $$('.np-it', list); if (!items.length) return;
      let best = items[0], bd = Infinity;
      for (const b of items) { const d = Math.abs(+b.dataset.v - n); if (d < bd) { bd = d; best = b; } }
      ignoreUntil = Date.now() + (smooth ? 700 : 300);
      list.scrollTo({ top: best.offsetTop - list.clientHeight / 2 + best.offsetHeight / 2, behavior: smooth ? 'smooth' : 'auto' });
    };
    let st;
    list.addEventListener('scroll', () => {
      clearTimeout(st);
      st = setTimeout(() => {
        if (Date.now() < ignoreUntil) return;
        const mid = list.scrollTop + list.clientHeight / 2;
        let best = null, bd = Infinity;
        for (const b of $$('.np-it', list)) { const d = Math.abs(b.offsetTop + b.offsetHeight / 2 - mid); if (d < bd) { bd = d; best = b; } }
        if (best) { str = fmtIn(+best.dataset.v); fresh = true; update(); }
      }, 110);
    });
    const ok = () => { const n = num(str === '' ? '0' : str); if (isNaN(n)) return; result = n; closeOverlays(1); };
    el.addEventListener('click', e => {
      const it = e.target.closest('.np-it');
      if (it) { const v = +it.dataset.v; if (it.classList.contains('on')) { ok(); return; } str = fmtIn(v); fresh = true; update(); scrollTo(v, true); return; }
      const k = e.target.closest('[data-k]');
      if (k) {
        const key = k.dataset.k;
        if (key === 'del') { str = fresh ? '' : str.slice(0, -1); fresh = false; }
        else if (key === ',') { if (fresh) { str = '0,'; fresh = false; } else if (!str.includes(',')) str = (str || '0') + ','; }
        else {
          if (fresh) { str = key; fresh = false; }
          else if (str.length < 6 && !(str.includes(',') && str.split(',')[1].length >= 2)) str = str === '0' ? key : str + key;
        }
        update();
        const n = num(str); if (!isNaN(n)) scrollTo(n, false);
        return;
      }
      const b = e.target.closest('[data-n]');
      if (b) { if (b.dataset.n === 'ok') ok(); else closeOverlays(1); return; }
      const x = e.target.closest('[data-x]');
      if (x) { result = extra[+x.dataset.x].value; closeOverlays(1); }
    });
    el.addEventListener('closed', () => resolve(result));
    pushOverlay(el);
    update();
    requestAnimationFrame(() => {
      const sp = Math.max(0, list.clientHeight / 2 - 31);
      $$('.np-sp', list).forEach(x => { x.style.height = sp + 'px'; });
      scrollTo(isNaN(cur) ? (opts[Math.floor(opts.length / 2)] || { v: 0 }).v : cur, false);
    });
  });
}

/* ---------- Fotos ---------- */
const photoUrls = {};
async function photoUrl(id) {
  if (!id) return '';
  if (photoUrls[id]) return photoUrls[id];
  const b = await DB.get(id, 'photos'); if (!b) return '';
  return (photoUrls[id] = URL.createObjectURL(b));
}
function fillThumbs(root) {
  $$('img[data-pid]', root).forEach(async img => { const u = await photoUrl(img.dataset.pid); if (u) img.src = u; });
}
function compressImage(file, max = 1280, q = 0.78) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/jpeg', q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}

/* ---------- Teilen / Kopieren ---------- */
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { }
    ta.remove(); return ok;
  }
}
