// File: public/ui/dom.js

/**
 * @typedef {(id: string) => HTMLElement} GetEl
 */

export const el = (id) => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node;
};

export const closeAllModals = () => {
  document.querySelectorAll('.modal').forEach((m) => {
    m.style.display = 'none';
  });
};

export const openModal = (id) => {
  el(id).style.display = 'block';
};

export const bindModalCloseHandlers = () => {
  document.querySelectorAll('.modal .close').forEach((x) => x.addEventListener('click', closeAllModals));
  window.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('modal')) closeAllModals();
  });
};

export const showStatus = (msg, bg = '#2f7d6d') => {
  const s = el('status');
  s.textContent = msg;
  s.style.background = bg;
  s.style.display = 'block';
  window.setTimeout(() => {
    s.style.display = 'none';
  }, 3000);
};

export const parseHM = (s) => {
  const [h, m] = String(s || '').split(':').map((x) => parseInt(x, 10));
  return { h: Number.isFinite(h) ? h : 0, m: Number.isFinite(m) ? m : 0 };
};

export const fmtHMS = (ms) => {
  if (ms < 0) return '00:00:00';
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600) % 24;
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};
