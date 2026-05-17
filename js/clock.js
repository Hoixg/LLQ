import { createElement } from './utils.js';

let timerId = null;

function pad(n) {
  return n.toString().padStart(2, '0');
}

function updateClock(el) {
  const now = new Date();
  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  el.textContent = `${h}:${m}:${s}`;
}

export function initClock() {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;

  if (timerId) {
    clearInterval(timerId);
  }

  clockEl.innerHTML = '';

  const timeSpan = createElement('span', { className: 'clock-time' });
  clockEl.appendChild(timeSpan);

  updateClock(timeSpan);
  timerId = setInterval(() => updateClock(timeSpan), 1000);
}
