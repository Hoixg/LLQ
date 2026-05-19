import { initSearch } from './search.js';
import { initSettings } from './settings.js';
import { initLayoutToggle } from './layout-toggle.js';
import { initWallpaper } from './wallpaper.js';
import { initClock } from './clock.js';
import { isMobile, createElement, applyTheme } from './utils.js';
import { initBookmarkPanel } from './bookmark-panel.js';

const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('theme') === 'auto') {
    applyTheme('auto');
  }
});

function setDeviceClass() {
  document.body.className = isMobile() ? 'is-mobile' : 'is-desktop';
}
setDeviceClass();
window.addEventListener('resize', setDeviceClass);

document.addEventListener('DOMContentLoaded', () => {
  const searchSection = document.querySelector('.search-section');
  initSearch(searchSection);
  initSettings();
  initLayoutToggle();
  initWallpaper();
  initClock();

  document.addEventListener('source-changed', () => {
    initSearch(searchSection);
  });

  // 创建收藏按钮（⭐ 图标）
  const bookmarkBtn = createElement('button', {
    className: 'bookmarks-trigger',
    title: '收藏夹',
  }, '⭐');
  document.body.appendChild(bookmarkBtn);
  initBookmarkPanel(bookmarkBtn);
});
