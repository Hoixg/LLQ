import { initSearch, getUpdateSourceDisplay } from './search.js';
import { getCurrentSource } from './search-sources.js';
import { initSettings } from './settings.js';
import { initLayoutToggle } from './layout-toggle.js';
import { initWallpaper } from './wallpaper.js';
import { isMobile, createElement, applyTheme, getFromStorage } from './utils.js';
import { initBookmarkPanel } from './bookmark-panel.js';

applyTheme(getFromStorage('theme', 'light'));

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getFromStorage('theme') === 'auto') {
    applyTheme('auto');
  }
});

function setDeviceClass() {
  document.body.className = isMobile() ? 'is-mobile' : 'is-desktop';
}
setDeviceClass();
window.addEventListener('resize', setDeviceClass);

let timerId = null;
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function pad(n) { return n.toString().padStart(2, '0'); }

function initClock() {
  const clockEl = document.getElementById('clock');
  if (!clockEl) return;
  if (timerId) clearInterval(timerId);
  clockEl.innerHTML = '';

  const cardRow = createElement('div', { className: 'clock-card-row' });
  const hourCard = createElement('span', { className: 'clock-card' });
  const colon1 = createElement('span', { className: 'clock-colon' }, ':');
  const minCard = createElement('span', { className: 'clock-card' });
  const colon2 = createElement('span', { className: 'clock-colon' }, ':');
  const secCard = createElement('span', { className: 'clock-card clock-card-sec' });
  cardRow.append(hourCard, colon1, minCard, colon2, secCard);

  const dateLine = createElement('div', { className: 'clock-date' });
  clockEl.append(cardRow, dateLine);

  function update() {
    const now = new Date();
    hourCard.textContent = pad(now.getHours());
    minCard.textContent = pad(now.getMinutes());
    secCard.textContent = pad(now.getSeconds());
    dateLine.textContent = (now.getMonth() + 1) + '\u6708' + now.getDate() + '\u65e5 ' + WEEKDAYS[now.getDay()];
  }
  update();
  timerId = setInterval(update, 1000);
}

function start() {
  const searchSection = document.querySelector('.search-section');
  if (!searchSection) return;
  initSearch(searchSection);
  initSettings();
  initLayoutToggle();
  initWallpaper();
  initClock();

  document.addEventListener('source-changed', () => {
    const input = document.querySelector('.search-input');
    const text = input ? input.value : '';
    const updateFn = getUpdateSourceDisplay();
    if (updateFn) {
      updateFn(getCurrentSource());
      if (input) input.value = text;
    }
  });

  const bookmarkBtn = createElement('button', {
    className: 'bookmarks-trigger',
    title: '收藏夹',
  }, '\u2B50');
  document.body.appendChild(bookmarkBtn);
  initBookmarkPanel(bookmarkBtn);

  bookmarkBtn.addEventListener('click', function bounce() {
    this.classList.remove('bouncing');
    void this.offsetWidth;
    this.classList.add('bouncing');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
