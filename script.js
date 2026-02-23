/* ====== RÔLES ====== */
const ADMIN_PASSWORD = '1234';
const SUPER_ADMIN_PASSWORD = '9999';
let SESSION_ROLE = 'guest';

/* ====== DONNÉES ====== */
const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const DISPLAY = {
  Fajr: { local: 'Souba', ar: 'Fajr' },
  Dhuhr: { local: 'Tisbar', ar: 'Dhuhr' },
  Asr: { local: 'Takusan', ar: 'Asr' },
  Maghrib: { local: 'Timis', ar: 'Maghrib' },
  Isha: { local: 'Guéwé', ar: 'Isha' },
};
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const CITY_COORDS = {
  Medina: { lat: 14.673, lon: -17.447 },
  Dakar: { lat: 14.7167, lon: -17.4677 },
  Pikine: { lat: 14.75, lon: -17.37 },
  Guédiawaye: { lat: 14.7833, lon: -17.4167 },
  Rufisque: { lat: 14.7236, lon: -17.2658 },
  Thiaroye: { lat: 14.7431, lon: -17.3325 },
  Yoff: { lat: 14.767, lon: -17.47 },
  'Parcelles Assainies': { lat: 14.7398, lon: -17.447 },
  "M'bao": { lat: 14.72, lon: -17.26 },
};

const DEFAULT_MOSQUES = [
  {
    id: 'bene-tally',
    name: 'Bene Tally',
    city: 'Medina',
    wave: '772682103',
    orange: '772682103',
    contact: 'Imam Diallo',
    phone: '+221772682103',
    jumua: '13:30',
    ann: 'Bienvenue à Bene Tally.',
    events: [{ title: 'Cours de Fiqh', date: 'Mardi après Isha' }],
    method: 3,
    school: 0,
    offsets: [0, 0, 0, 0, 0, 0],
    adhanUrl: '',
    quiet: '22:00-05:00',
    allowFajr: true,
  },
  {
    id: 'medina-centre',
    name: 'Medina Centre',
    city: 'Dakar',
    wave: '770000000',
    orange: '780000000',
    contact: 'Imam Ndiaye',
    phone: '+221780000000',
    jumua: '14:00',
    ann: 'Annonce importante pour la Medina.',
    events: [{ title: 'Cercle de Coran', date: 'Samedi après Fajr' }],
    method: 3,
    school: 0,
    offsets: [0, 0, 0, 0, 0, 0],
    adhanUrl: '',
    quiet: '22:00-05:00',
    allowFajr: true,
  },
];

const MOCK = { Fajr: '05:45', Sunrise: '07:00', Dhuhr: '13:30', Asr: '16:45', Maghrib: '19:05', Isha: '20:30' };

/* ====== RAMADAN ====== */
const RAMADAN_START_DATE = '2026-02-18';
const RAMADAN_TOTAL_DAYS = 30;

/* ====== HELPERS ====== */
const el = (id) => document.getElementById(id);
const showStatus = (msg, bg) => {
  const node = el('status');
  if (!node) return;
  node.textContent = msg;
  node.style.background = bg || '#2f7d6d';
  node.style.display = 'block';
  setTimeout(() => { node.style.display = 'none'; }, 3000);
};
const fmtHMS = (ms) => {
  if (ms < 0) return '00:00:00';
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600) % 24;
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};
const parseHM = (s) => {
  const [h, m] = String(s || '').split(':').map((x) => parseInt(x, 10));
  return { h: Number.isFinite(h) ? h : 0, m: Number.isFinite(m) ? m : 0 };
};
const buildTuneParam = (offsets) => {
  const a = offsets && offsets.length === 6 ? offsets : [0, 0, 0, 0, 0, 0];
  return a.join(',');
};
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ====== STATE ====== */
let timingsData = null;
let lastAlertShown = '';
let playedFor = '';

/* ====== STORAGE ====== */
function loadMosques() {
  let arr = JSON.parse(localStorage.getItem('mosques') || 'null');
  if (!arr || !arr.length) {
    arr = DEFAULT_MOSQUES;
    localStorage.setItem('mosques', JSON.stringify(arr));
    localStorage.setItem('currentMosqueId', arr[0].id);
  }
  return arr;
}
function saveMosques(arr) { localStorage.setItem('mosques', JSON.stringify(arr)); }
function getCurrentMosque() {
  const arr = loadMosques();
  const id = localStorage.getItem('currentMosqueId') || arr[0].id;
  return arr.find((m) => m.id === id) || arr[0];
}
function setCurrentMosque(id) { localStorage.setItem('currentMosqueId', id); }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function ymKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

/* ====== CLOCK ====== */
function updateClock() {
  const n = new Date();
  el('current-time').textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':');
  el('gregorian-date').textContent = `${WEEKDAYS[n.getDay()]} ${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}`;
}

/* ====== UI POPULATE ====== */
function populateMosqueSelector() {
  const arr = loadMosques();
  const sel = el('mosque-selector');
  sel.innerHTML = '';
  arr.forEach((m) => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.name;
    sel.appendChild(o);
  });
  sel.value = getCurrentMosque().id;
  sel.disabled = true;
}
function populateCitySelect(sel) {
  sel.innerHTML = '';
  Object.keys(CITY_COORDS).forEach((c) => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    sel.appendChild(o);
  });
}

/* ====== EVENTS ====== */
function renderEvents() {
  const m = getCurrentMosque();
  const box = el('events-list');
  const events = Array.isArray(m.events) ? m.events : [];
  if (!events.length) { box.textContent = '—'; return; }

  const wrap = document.createElement('div');
  wrap.style.display = 'grid';
  wrap.style.gap = '8px';

  events.forEach((ev) => {
    const item = document.createElement('div');
    item.style.border = '1px solid #eef2f7';
    item.style.borderRadius = '12px';
    item.style.padding = '10px 12px';
    item.innerHTML = `<div style="font-weight:800;color:#1f5e53">${escapeHtml(ev.title || '')}</div>
                      <div class="small">${escapeHtml(ev.date || '')}</div>`;
    wrap.appendChild(item);
  });

  box.innerHTML = '';
  box.appendChild(wrap);
}

/* ====== RAMADAN ====== */
function renderRamadan() {
  const card = el('ramadan-card');
  if (!card) return;

  const start = new Date(`${RAMADAN_START_DATE}T00:00:00`);
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;
  const dayIndex = Math.floor((now - start) / msDay) + 1;

  if (dayIndex < 1 || dayIndex > RAMADAN_TOTAL_DAYS) {
    card.style.display = 'none';
    return;
  }

  const left = RAMADAN_TOTAL_DAYS - dayIndex;
  el('ramadan-sub').textContent = `Début: ${RAMADAN_START_DATE} • Aujourd’hui: ${now.toISOString().slice(0, 10)}`;
  el('ramadan-day').textContent = `Jour ${dayIndex}/${RAMADAN_TOTAL_DAYS}`;
  el('ramadan-left').textContent = left === 0 ? 'Dernier jour' : `${left} jour(s) restant(s)`;

  el('ramadan-iftar').textContent = (timingsData && timingsData.Maghrib) ? timingsData.Maghrib : '--:--';
  el('ramadan-suhoor').textContent = (timingsData && timingsData.Fajr) ? timingsData.Fajr : '--:--';

  card.style.display = 'block';
}

/* ====== DISPLAY PRAYERS ====== */
function displayAll(data) {
  timingsData = (data && data.timings) ? data.timings : MOCK;
  const m = getCurrentMosque();

  el('mosque-name').textContent = m.name;
  el('wave-number').textContent = m.wave || '—';
  el('orange-number').textContent = m.orange || '—';
  el('about-contact-name').textContent = m.contact || '—';
  el('about-contact-phone').textContent = m.phone || '—';

  PRAYER_NAMES.forEach((k) => {
    el(`${k.toLowerCase()}-name`).textContent = `${DISPLAY[k].local} (${DISPLAY[k].ar})`;
    el(`${k.toLowerCase()}-time`).textContent = timingsData[k] || '--:--';
  });

  el('shuruq-time').textContent = timingsData.Sunrise || '--:--';
  el('jumua-time').textContent = m.jumua || '13:30';

  if (data && data.date && data.date.hijri) {
    el('hijri-date').textContent = `${data.date.hijri.day} ${data.date.hijri.month.ar} ${data.date.hijri.year} AH`;
  } else {
    el('hijri-date').textContent = 'Date hégirienne indisponible';
  }

  const ann = String(m.ann || '').trim();
  el('announcement-text').textContent = ann || 'Aucune annonce.';
  const seenKey = `annSeen_${m.id}_${todayKey()}`;
  el('notif').style.display = (ann && !localStorage.getItem(seenKey)) ? 'inline-block' : 'none';

  updateNextCountdown();
  renderDonation();
  renderDonTable();
  renderEvents();
  renderRamadan();

  // Qibla: refresh fallback coords / maps
  qiblaSetFallbackFromMosque();
}

/* ====== AUDIO ====== */
function playBeep(duration = 600, freq = 880) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    o.start();
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      o.stop();
      ctx.close();
    }, duration);
  } catch {}
}

function isQuietNow() {
  const m = getCurrentMosque();
  const q = String(m.quiet || '22:00-05:00').split('-');
  if (q.length !== 2) return false;

  const s = parseHM(q[0]);
  const e = parseHM(q[1]);
  const now = new Date();
  const n = now.getHours() * 60 + now.getMinutes();
  const start = s.h * 60 + s.m;
  const end = e.h * 60 + e.m;

  const inRange = start <= end ? (n >= start && n < end) : (n >= start || n < end);
  const txt = String(el('next-prayer-name').textContent || '').toLowerCase();
  const isFajr = txt.includes('fajr') || txt.includes('souba');
  return inRange && !(m.allowFajr && isFajr);
}
function playChime() {
  if (isQuietNow()) return;
  playBeep(700, 740);
  navigator.vibrate && navigator.vibrate(200);
}
function playAdhan() {
  const m = getCurrentMosque();
  if (isQuietNow()) return;
  if (m.adhanUrl) {
    const a = new Audio(m.adhanUrl);
    a.play().catch(() => playBeep(1200, 660));
  } else {
    playBeep(1200, 660);
  }
}

/* ====== COUNTDOWN ====== */
function updateNextCountdown() {
  if (!timingsData) {
    el('next-prayer-name').textContent = '—';
    el('countdown').textContent = '--:--:--';
    return;
  }

  const now = new Date();
  document.querySelectorAll('.list .row').forEach((r) => r.classList.remove('current'));

  const p = {};
  PRAYER_NAMES.forEach((k) => {
    const parts = String(timingsData[k] || '').split(':');
    if (parts.length >= 2) {
      const d = new Date();
      d.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
      p[k] = d;
    }
  });

  const m = getCurrentMosque();
  if (now.getDay() === 5 && m.jumua) {
    const hm = parseHM(m.jumua || '13:30');
    const d = new Date();
    d.setHours(hm.h, hm.m, 0, 0);
    p.Dhuhr = d;
  }

  let nextName = '';
  let nextTime = null;

  for (const k of PRAYER_NAMES) {
    const d = p[k];
    if (d && now < d) {
      nextName = k;
      nextTime = d;
      break;
    }
  }

  if (!nextName) {
    nextName = 'Fajr';
    const t = String(timingsData.Fajr || '05:45').split(':').map(Number);
    nextTime = new Date();
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(t[0] || 5, t[1] || 45, 0, 0);
  }

  el('next-prayer-name').textContent = `${DISPLAY[nextName].local.toUpperCase()} (${DISPLAY[nextName].ar})`;
  el('countdown').textContent = fmtHMS(nextTime - now);
  el(`${nextName.toLowerCase()}-item`).classList.add('current');

  const delta = nextTime - now;
  const five = 5 * 60 * 1000;

  if (delta > 0 && delta <= five && lastAlertShown !== nextName) {
    playChime();
    lastAlertShown = nextName;
    showStatus(`Dans 5 min : ${DISPLAY[nextName].local}.`, '#1f5e53');
  }

  if (delta <= 900 && playedFor !== nextName) {
    playAdhan();
    playedFor = nextName;
  }

  if (delta > 1500 && nextName === playedFor) {
    playedFor = '';
  }
}

/* ====== API ALADHAN ====== */
function mockData() {
  return { timings: MOCK, date: { hijri: { day: '3', month: { ar: "Rabi' al-Awwal" }, year: '1447' } } };
}
async function fetchTimings() {
  const m = getCurrentMosque();
  const base = CITY_COORDS[m.city] || CITY_COORDS.Medina;
  const lat = base.lat;
  const lon = base.lon;

  const method = (m.method != null) ? m.method : 3;
  const school = (m.school != null) ? m.school : 0;
  const tune = buildTuneParam(m.offsets || [0, 0, 0, 0, 0, 0]);

  const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&school=${school}&tune=${tune}`;

  const key = `cache_${m.id}_${new Date().toDateString()}`;
  const cached = localStorage.getItem(key);
  let loaded = false;

  if (cached) {
    displayAll(JSON.parse(cached));
    loaded = true;
  }

  try {
    const r = await fetch(url);
    const j = await r.json();
    if (j && j.data) {
      localStorage.setItem(key, JSON.stringify(j.data));
      displayAll(j.data);
    } else {
      throw new Error('Bad response');
    }
  } catch {
    showStatus(loaded ? 'Hors-ligne – cache.' : 'Données par défaut affichées.', loaded ? '#ca8a04' : '#e11d48');
    if (!loaded) displayAll(mockData());
  }
}

/* ====== DONATIONS ====== */
function kGoal(m) { return `dong_${m.id}`; }
function getGoal(m) { const g = localStorage.getItem(kGoal(m)); return g ? parseInt(g, 10) : 100000; }
function setGoal(m, val) { localStorage.setItem(kGoal(m), String(Math.max(0, parseInt(val, 10) || 0))); }
function keyDay() { return new Date().toISOString().slice(0, 10); }
function kList(m) { return `donlist_${m.id}_${keyDay()}`; }
function kMonthSum(m) { return `donm_${m.id}_${ymKey()}`; }
function loadList(m) { return JSON.parse(localStorage.getItem(kList(m)) || '[]'); }
function saveList(m, list) { localStorage.setItem(kList(m), JSON.stringify(list)); }
function monthSum(m) { return parseInt(localStorage.getItem(kMonthSum(m)) || '0', 10); }
function setMonthSum(m, v) { localStorage.setItem(kMonthSum(m), String(Math.max(0, parseInt(v, 10) || 0))); }

function confirmedSumToday() {
  const m = getCurrentMosque();
  return loadList(m).filter((x) => x.status === 'ok').reduce((s, x) => s + x.amount, 0);
}
function renderDonation() {
  const m = getCurrentMosque();
  const goal = getGoal(m);
  const day = confirmedSumToday();
  const month = monthSum(m);

  el('don-goal').textContent = goal.toLocaleString('fr-FR');
  el('don-today').textContent = day.toLocaleString('fr-FR');
  el('don-month').textContent = month.toLocaleString('fr-FR');

  const left = Math.max(0, goal - day);
  el('don-left').textContent = left.toLocaleString('fr-FR');

  const p = goal ? Math.min(100, Math.round((day * 100) / goal)) : 0;
  el('don-bar').style.width = `${p}%`;
}
function renderDonTable() {
  const m = getCurrentMosque();
  const tb = document.querySelector('#don-table tbody');
  tb.innerHTML = '';

  loadList(m).forEach((r) => {
    const tr = document.createElement('tr');
    const st = r.status === 'ok'
      ? '<span class="badge b-ok">Confirmé</span>'
      : (r.status === 'no' ? '<span class="badge b-no">Annulé</span>' : '<span class="badge b-p">En attente</span>');

    tr.innerHTML = `
      <td>${new Date(r.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
      <td><strong>${r.amount.toLocaleString('fr-FR')}</strong></td>
      <td>${r.method}</td>
      <td>${escapeHtml(r.ref || '')}</td>
      <td>${st}</td>
      <td style="white-space:nowrap">
        <button data-act="ok" data-id="${r.id}" class="btn btn-primary" style="padding:6px 10px">OK</button>
        <button data-act="no" data-id="${r.id}" class="btn" style="padding:6px 10px; background:#ef4444; color:#fff">X</button>
      </td>
    `;
    tb.appendChild(tr);
  });

  tb.querySelectorAll('button[data-act]').forEach((b) => {
    b.onclick = () => setEntryStatus(b.dataset.id, b.dataset.act);
  });
}
function addDonationEntry({ amount, method, ref }) {
  const m = getCurrentMosque();
  const list = loadList(m);

  const id = Date.now().toString(36);
  const row = {
    id,
    ts: new Date().toISOString(),
    amount: Number(amount) || 0,
    method: method || 'Wave',
    ref: ref || '',
    status: 'pending',
  };

  list.unshift(row);
  saveList(m, list);
  renderDonTable();
  renderDonation();
}
function setEntryStatus(id, newStatus) {
  const m = getCurrentMosque();
  const list = loadList(m);
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return;

  const wasOk = list[i].status === 'ok';
  list[i].status = newStatus;
  saveList(m, list);

  if (newStatus === 'ok' && !wasOk) setMonthSum(m, monthSum(m) + list[i].amount);
  if (wasOk && newStatus !== 'ok') setMonthSum(m, monthSum(m) - list[i].amount);

  renderDonTable();
  renderDonation();
}

/* ====== SHARE / WHATSAPP ====== */
function shareNow() {
  const m = getCurrentMosque();
  const text = `🕌 ${m.name}
${el('gregorian-date').textContent}

Souba (Fajr) : ${el('fajr-time').textContent}
Tisbar (Dhuhr) : ${el('dhuhr-time').textContent}
Takusan (Asr) : ${el('asr-time').textContent}
Timis (Maghrib) : ${el('maghrib-time').textContent}
Guéwé (Isha) : ${el('isha-time').textContent}`;
  const payload = location.protocol === 'file:' ? text : `${text}\n${location.href}`;

  if (navigator.share) {
    navigator.share({ title: `Horaires ${m.name}`, text: payload }).catch(() => {
      location.href = `https://wa.me/?text=${encodeURIComponent(payload)}`;
    });
  } else {
    location.href = `https://wa.me/?text=${encodeURIComponent(payload)}`;
  }
}
function openWhatsApp(to, msg) {
  const url = `https://wa.me/${encodeURIComponent(to)}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}
function setupDonButtons() {
  el('btn-wave').onclick = () => {
    const m = getCurrentMosque();
    const txt = `Salam, je souhaite faire un don via *Wave Money*.
Montant : [à renseigner] CFA
Numéro Wave : ${m.wave}
Mosquée : ${m.name}
BarakAllahou fik.`;
    openWhatsApp(m.phone || '', txt);
  };

  el('btn-orange').onclick = () => {
    const m = getCurrentMosque();
    const txt = `Salam, je souhaite faire un don via *Orange Money*.
Montant : [à renseigner] CFA
Numéro Orange : ${m.orange}
Mosquée : ${m.name}
BarakAllahou fik.`;
    openWhatsApp(m.phone || '', txt);
  };

  el('btn-claimed').onclick = () => {
    const m = getCurrentMosque();
    const txt = `Salam, *j’ai donné* [montant] CFA via [Wave/Orange].
Référence : [collez le reçu]
Mosquée : ${m.name}`;
    openWhatsApp(m.phone || '', txt);
  };
}

/* ====== MODALS ====== */
function openModal(id) { el(id).style.display = 'block'; }
function closeAll() { document.querySelectorAll('.modal').forEach((m) => { m.style.display = 'none'; }); }
function bindModals() {
  document.querySelectorAll('.modal .close').forEach((x) => x.addEventListener('click', closeAll));
  window.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) closeAll();
  });
}

/* ====== ADMIN ====== */
function fillAdminForm(id) {
  const m = loadMosques().find((x) => x.id === id);
  if (!m) return;

  el('adm-name').value = m.name || '';
  el('adm-city').value = m.city || 'Medina';
  el('adm-wave').value = m.wave || '';
  el('adm-orange').value = m.orange || '';
  el('adm-contact').value = m.contact || '';
  el('adm-phone').value = m.phone || '';
  el('adm-jumua').value = m.jumua || '13:30';
  el('adm-ann').value = m.ann || '';
  el('adm-events').value = (m.events || []).map((e) => `${e.title} | ${e.date}`).join('\n');

  el('adm-method').value = (m.method != null) ? m.method : 3;
  el('adm-school').value = (m.school != null) ? m.school : 0;
  el('adm-offsets').value = (m.offsets && m.offsets.length === 6 ? m.offsets : [0, 0, 0, 0, 0, 0]).join(',');

  el('adm-adhan-url').value = m.adhanUrl || '';
  el('adm-quiet').value = m.quiet || '22:00-05:00';
  el('adm-allow-fajr').checked = !!m.allowFajr;

  el('adm-goal').value = getGoal(m);

  el('adm-solde-wave').value = localStorage.getItem(`solde_wave_${m.id}_${todayKey()}`) || '';
  el('adm-solde-orange').value = localStorage.getItem(`solde_orange_${m.id}_${todayKey()}`) || '';
}

/* ====== ✅ QIBLA COMPASS (fix) ====== */
const KAABA = { lat: 21.4225, lon: 39.8262 };

let qiblaBearingDeg = null;
let currentHeadingDeg = null;
let qiblaWatchActive = false;
let qiblaLocation = null; // {lat, lon, source}

const qiblaStatus = (msg) => { el('qibla-status').textContent = msg; };
const normDeg = (d) => ((d % 360) + 360) % 360;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

function computeBearing(fromLat, fromLon, toLat, toLon) {
  const φ1 = toRad(fromLat);
  const φ2 = toRad(toLat);
  const Δλ = toRad(toLon - fromLon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normDeg(toDeg(Math.atan2(y, x)));
}

function qiblaSetFallbackFromMosque() {
  const m = getCurrentMosque();
  const base = CITY_COORDS[m.city] || CITY_COORDS.Medina;
  qiblaLocation = { lat: base.lat, lon: base.lon, source: `Ville: ${m.city}` };
  qiblaBearingDeg = computeBearing(qiblaLocation.lat, qiblaLocation.lon, KAABA.lat, KAABA.lon);
  el('qibla-bearing').textContent = `${Math.round(qiblaBearingDeg)}°`;
  qiblaUpdateMapsLink(qiblaLocation.lat, qiblaLocation.lon);
  qiblaRenderNeedle();
}

function qiblaUpdateMapsLink(lat, lon) {
  const origin = `${lat},${lon}`;
  const dest = `${KAABA.lat},${KAABA.lon}`;
  el('qibla-maps').onclick = () => window.open(
    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`,
    '_blank',
  );
}

function qiblaRenderNeedle() {
  const needle = el('qibla-needle');
  const bearing = qiblaBearingDeg;
  const heading = currentHeadingDeg;

  if (bearing == null) return;

  // If no heading available, point north->bearing (still useful)
  const rotation = heading == null ? bearing : normDeg(bearing - heading);
  needle.style.transform = `rotate(${rotation}deg)`;

  el('qibla-heading').textContent = heading == null ? '—°' : `${Math.round(normDeg(heading))}°`;
}

async function qiblaRequestGeo() {
  if (!navigator.geolocation) {
    qiblaStatus('Géolocalisation indisponible. Utilisation de la ville de la mosquée.');
    return;
  }

  qiblaStatus('Localisation…');
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        qiblaLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'GPS',
        };
        qiblaBearingDeg = computeBearing(qiblaLocation.lat, qiblaLocation.lon, KAABA.lat, KAABA.lon);
        el('qibla-bearing').textContent = `${Math.round(qiblaBearingDeg)}°`;
        qiblaUpdateMapsLink(qiblaLocation.lat, qiblaLocation.lon);
        qiblaStatus('OK. Bouge ton téléphone en 8 si le cap saute.');
        qiblaRenderNeedle();
        resolve(true);
      },
      () => {
        qiblaStatus('Permission localisation refusée. Utilisation de la ville de la mosquée.');
        resolve(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  });
}

function qiblaGetHeadingFromEvent(ev) {
  // iOS Safari provides webkitCompassHeading (0..360)
  if (typeof ev.webkitCompassHeading === 'number') return ev.webkitCompassHeading;

  // Others often provide alpha (0..360), but orientation differs; common conversion:
  if (typeof ev.alpha === 'number') {
    // alpha is rotation around z-axis; approximate heading:
    return 360 - ev.alpha;
  }

  return null;
}

function qiblaOnOrientation(ev) {
  const h = qiblaGetHeadingFromEvent(ev);
  if (h == null) return;
  currentHeadingDeg = h;
  qiblaRenderNeedle();
}

async function qiblaStartCompass() {
  if (qiblaWatchActive) return;

  // Always set a fallback bearing (city)
  qiblaSetFallbackFromMosque();

  // Ask geolocation (optional but better)
  await qiblaRequestGeo();

  // Sensor permission on iOS
  const DOE = window.DeviceOrientationEvent;
  if (!DOE) {
    qiblaStatus('Cap non supporté sur ce navigateur. Utilise “Google Maps”.');
    return;
  }

  if (typeof DOE.requestPermission === 'function') {
    qiblaStatus('Permission cap…');
    try {
      const res = await DOE.requestPermission();
      if (res !== 'granted') {
        qiblaStatus('Permission cap refusée. Utilise “Google Maps”.');
        return;
      }
    } catch {
      qiblaStatus('Permission cap impossible. Utilise “Google Maps”.');
      return;
    }
  }

  window.addEventListener('deviceorientation', qiblaOnOrientation, { passive: true });
  qiblaWatchActive = true;
  qiblaStatus('Boussole active. Tourne doucement pour stabiliser.');
}

/* ====== FOOTER / MODALS actions ====== */
function setupFooter() {
  el('events-btn').onclick = () => { renderEvents(); openModal('modal-events'); };
  el('announce-btn').onclick = () => {
    openModal('modal-ann');
    const m = getCurrentMosque();
    localStorage.setItem(`annSeen_${m.id}_${todayKey()}`, '1');
    el('notif').style.display = 'none';
  };
  el('about-btn').onclick = () => openModal('modal-about');
  el('share-btn').onclick = shareNow;

  el('names-btn').onclick = () => {
    // keep simple list; can be replaced later with full data file
    const ALLAH_NAMES = [
      { en: 'Ar-Rahman', fr: 'Le Tout Miséricordieux', ar: 'ٱلرَّحْمَٰنُ' },
      { en: 'Ar-Rahim', fr: 'Le Très Miséricordieux', ar: 'ٱلرَّحِيمُ' },
    ];
    const ul = el('names-list');
    ul.innerHTML = '';
    ALLAH_NAMES.forEach((n, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${i + 1}. ${escapeHtml(n.fr)} (${escapeHtml(n.en)})</span><span style="font-weight:700">${escapeHtml(n.ar)}</span>`;
      ul.appendChild(li);
    });
    el('names-header').textContent = `Les 99 Noms d'Allah (${ALLAH_NAMES.length})`;
    openModal('modal-names');
  };
}

/* ====== ADMIN BINDINGS ====== */
function setupAdmin() {
  el('admin-button').onclick = () => {
    const pw = prompt('Code d’accès :');
    if (pw === SUPER_ADMIN_PASSWORD) SESSION_ROLE = 'super';
    else if (pw === ADMIN_PASSWORD) SESSION_ROLE = 'admin';
    else return alert('Code incorrect.');

    const isSuper = SESSION_ROLE === 'super';
    el('super-row').style.display = isSuper ? 'flex' : 'none';
    el('advanced-block').style.display = isSuper ? 'block' : 'none';
    el('role-hint').textContent = isSuper ? 'Mode SUPER ADMIN' : 'Mode ADMIN (mosquée verrouillée)';

    el('mosque-selector').disabled = !isSuper;
    el('don-admin').style.display = 'block';

    populateCitySelect(el('adm-city'));

    const arr = loadMosques();
    const cur = getCurrentMosque();
    const sel = el('adm-mosque');

    if (isSuper) {
      sel.innerHTML = '';
      arr.forEach((m) => {
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = m.name;
        sel.appendChild(o);
      });
      sel.value = cur.id;
    }

    fillAdminForm(cur.id);
    openModal('modal-admin');
  };

  el('add-mosque').onclick = () => {
    if (SESSION_ROLE !== 'super') return;

    const name = prompt('Nom de la nouvelle mosquée :');
    if (!name) return;

    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
    const arr = loadMosques();

    arr.push({
      id,
      name,
      city: 'Medina',
      wave: '',
      orange: '',
      contact: '',
      phone: '',
      jumua: '13:30',
      ann: '',
      events: [],
      method: 3,
      school: 0,
      offsets: [0, 0, 0, 0, 0, 0],
      adhanUrl: '',
      quiet: '22:00-05:00',
      allowFajr: true,
    });

    saveMosques(arr);
    setCurrentMosque(id);
    populateMosqueSelector();
    fillAdminForm(id);

    const sel = el('adm-mosque');
    sel.innerHTML = '';
    arr.forEach((m) => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.name;
      sel.appendChild(o);
    });
    sel.value = id;
  };

  el('del-mosque').onclick = () => {
    if (SESSION_ROLE !== 'super') return;

    const arr = loadMosques();
    if (arr.length <= 1) return alert('Il doit rester au moins une mosquée.');

    const sel = el('adm-mosque');
    const id = sel.value;

    if (!confirm('Supprimer cette mosquée ?')) return;

    const next = arr.filter((m) => m.id !== id);
    saveMosques(next);
    setCurrentMosque(next[0].id);

    populateMosqueSelector();
    fillAdminForm(next[0].id);

    sel.innerHTML = '';
    next.forEach((m) => {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.name;
      sel.appendChild(o);
    });
    sel.value = next[0].id;

    fetchTimings();
  };

  el('save').onclick = () => {
    const isSuper = SESSION_ROLE === 'super';
    const arr = loadMosques();
    const cur = getCurrentMosque();

    const id = isSuper ? (el('adm-mosque').value || cur.id) : cur.id;
    const idx = arr.findIndex((x) => x.id === id);
    if (idx < 0) return;

    let offsets = el('adm-offsets').value.split(',').map((v) => parseInt(v.trim(), 10));
    if (offsets.length !== 6 || offsets.some((x) => Number.isNaN(x))) offsets = [0, 0, 0, 0, 0, 0];

    arr[idx] = {
      ...arr[idx],
      name: el('adm-name').value.trim() || 'Mosquée',
      city: el('adm-city').value,
      wave: el('adm-wave').value.trim(),
      orange: el('adm-orange').value.trim(),
      contact: el('adm-contact').value.trim(),
      phone: el('adm-phone').value.trim(),
      jumua: el('adm-jumua').value || '13:30',
      ann: el('adm-ann').value,
      events: el('adm-events').value
        .split('\n')
        .filter((l) => l.trim() !== '')
        .map((l) => {
          const [t, ...r] = l.split('|');
          return { title: (t || '').trim(), date: (r.join('|') || '').trim() };
        }),
      method: parseInt(el('adm-method').value, 10),
      school: parseInt(el('adm-school').value, 10),
      offsets,
      adhanUrl: el('adm-adhan-url').value.trim(),
      quiet: el('adm-quiet').value.trim() || '22:00-05:00',
      allowFajr: el('adm-allow-fajr').checked,
    };

    saveMosques(arr);
    setCurrentMosque(id);

    setGoal(getCurrentMosque(), el('adm-goal').value);
    localStorage.setItem(`solde_wave_${id}_${todayKey()}`, el('adm-solde-wave').value || '');
    localStorage.setItem(`solde_orange_${id}_${todayKey()}`, el('adm-solde-orange').value || '');

    displayAll({ timings: timingsData || MOCK, date: {} });
    fetchTimings();
    closeAll();
    showStatus('Données enregistrées.');
  };
}

/* ====== INIT ====== */
function setup() {
  bindModals();
  populateMosqueSelector();
  setupFooter();
  setupAdmin();
  setupDonButtons();

  // donation admin add
  el('don-add').onclick = () => {
    const amt = parseInt(el('don-amt').value, 10) || 0;
    if (amt <= 0) return alert('Montant invalide');
    addDonationEntry({ amount: amt, method: el('don-method').value, ref: el('don-ref').value });
    el('don-amt').value = '';
    el('don-ref').value = '';
  };

  // Qibla start
  el('qibla-start').onclick = () => qiblaStartCompass();

  updateClock();
  setInterval(updateClock, 1000);

  fetchTimings();
  setInterval(updateNextCountdown, 1000);

  // initial qibla fallback (works even without permissions)
  qiblaSetFallbackFromMosque();

  // notif badge initial
  const m = getCurrentMosque();
  const seenKey = `annSeen_${m.id}_${todayKey()}`;
  const ann = String(m.ann || '').trim();
  el('notif').style.display = (ann && !localStorage.getItem(seenKey)) ? 'inline-block' : 'none';
}

document.addEventListener('DOMContentLoaded', setup);
