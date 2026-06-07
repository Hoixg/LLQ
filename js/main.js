import { initSearch, getUpdateSourceDisplay } from './search.js';
import { getCurrentSource } from './search-sources.js';
import { initSettings, applyThemeStyle, applyUIStyle } from './settings.js';
import { initLayoutToggle } from './layout-toggle.js';
import { initWallpaper } from './wallpaper.js';
import { isMobile, createElement, getFromStorage } from './utils.js';
import { initBookmarkPanel } from './bookmark-panel.js';

applyThemeStyle(getFromStorage('themeStyle', 'blue'));
applyUIStyle(getFromStorage('uiStyle', 'default'));

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyThemeStyle(getFromStorage('themeStyle', 'blue'));
});

function setDeviceClass() {
  document.body.className = isMobile() ? 'is-mobile' : 'is-desktop';
}
setDeviceClass();
window.matchMedia('(max-width: 768px)').addEventListener('change', setDeviceClass);

function start() {
  const searchSection = document.querySelector('.search-section');
  if (!searchSection) return;
  initSearch(searchSection);
  initSettings();
  initLayoutToggle();
  initWallpaper();

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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.classList.add('bouncing');
      });
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const input = document.querySelector('.search-input');
      if (input === document.activeElement) { input.blur(); return; }
      document.dispatchEvent(new CustomEvent('close-all-panels'));
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.querySelector('.search-input');
      if (input) input.focus();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
