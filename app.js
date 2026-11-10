'use strict';
/* =========================================================
   Kraftbuch – Start & Navigation
   ========================================================= */
const VIEWS = {
  training: { render: renderTraining, click: trainingClick, mode: 'gym', l: 'Training', icon: I.dumbbell },
  exercises: { render: renderExercises, click: exercisesClick, mode: 'gym', l: 'Übungen', icon: I.list },
  diary: { render: renderDiary, click: diaryClick, mode: 'food', l: 'Tagebuch', icon: I.book },
  dishes: { render: renderDishes, click: dishesClick, mode: 'food', l: 'Gerichte', icon: I.pot },
  foods: { render: renderFoods, click: foodsClick, mode: 'food', l: 'Lebensmittel', icon: I.leaf },
};
function refreshAll() { renderMain(); stack.forEach(o => o.refresh && o.refresh()); }
function renderMain() {
  const v = VIEWS[S.view] || VIEWS.training;
  document.body.dataset.mode = v.mode;
  v.render();
  renderActiveBar();
  $('#nav').innerHTML = Object.entries(VIEWS).map(([k, x], i) =>
    `${i === 2 ? '<span class="nav-sep"></span>' : ''}<button class="${S.view === k ? 'on' : ''} m-${x.mode}" data-view="${k}">${x.icon}<span>${x.l}</span></button>`).join('');
}
$('#nav').addEventListener('click', e => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  S.view = b.dataset.view;
  try { localStorage.setItem('kb-view', S.view); } catch { }
  renderMain(); window.scrollTo(0, 0);
});
$('#activeBar').addEventListener('click', () => openWorkout());
$('#app').addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  VIEWS[S.view].click(a, a.dataset.act);
});
$('#app').addEventListener('input', e => {
  if (e.target.id === 'foodQ') { S.foodQuery = e.target.value; renderFoodList(); }
  if (e.target.id === 'dishQ') { S.dishQuery = e.target.value; renderDishList(); }
  if (e.target.id === 'exQ') { S.exQuery = e.target.value; renderExList(); }
});

async function init() {
  history.replaceState({ ov: 0 }, '');
  try { const v = localStorage.getItem('kb-view'); if (v && VIEWS[v]) S.view = v; } catch { }
  try {
    await DB.open();
    for (const [k, v] of await DB.entries('kv')) {
      if (k.startsWith('day:')) S.days[k.slice(4)] = v;
      else if (k.startsWith('w:')) S.workouts.push(v);
      else if (k === 'settings') S.settings = { ...S.settings, ...v, goals: { train: { ...DEFAULT_GOALS.train, ...(v.goals?.train || {}) }, rest: { ...DEFAULT_GOALS.rest, ...(v.goals?.rest || {}) } }, gym: { ...S.settings.gym, ...(v.gym || {}) }, creatin: { ...S.settings.creatin, ...(v.creatin || {}) } };
      else if (k === 'active') S.active = v;
      else if (k in S) S[k] = v;
    }
    if (!S.settings.firstUse) { S.settings.firstUse = Date.now(); saveSettings(); }
    // Futterbuch beim ersten Start automatisch übernehmen
    if (!S.settings.migratedFutter) {
      const r = await migrateFutterbuch().catch(() => ({ found: false }));
      if (r.found) setTimeout(() => toast(`Futterbuch übernommen: ${r.days} ${r.days === 1 ? "Tag" : "Tage"}, ${r.dishes} ${r.dishes === 1 ? "Gericht" : "Gerichte"}`), 600);
    }
  } catch (e) {
    console.error(e);
    toast('Speicher nicht verfügbar – Daten werden nicht gesichert');
  }
  renderMain();
  if (S.active) setTimeout(() => toast('Training läuft noch – oben auf „Fortsetzen“'), 400);
  setInterval(gymTick, 500);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { });
  let lastToday = todayKey();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (todayKey() !== lastToday) { if (S.sel === lastToday) S.sel = todayKey(); lastToday = todayKey(); }
    refreshAll(); gymTick();
  });
}
init();
