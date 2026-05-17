import { initSearch } from './search.js';
import { initSettings } from './settings.js';
import { initLayoutToggle } from './layout-toggle.js';
import { initWallpaper } from './wallpaper.js';
import { isMobile, createElement } from './utils.js';
import { initBookmarkPanel } from './bookmark-panel.js';

function applyTheme(theme) {
  if (theme === 'auto') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (localStorage.getItem('theme') === 'auto') {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
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
