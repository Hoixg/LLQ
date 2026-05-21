import { createElement, isMobile } from './utils.js';
import { getCurrentSource, setCurrentSource, getSourcesByTrack, getCurrentTrack, setCurrentTrack } from './search-sources.js';
import { initSuggestions } from './suggestions.js';

const TRACK_LABELS = { engine: '搜索引擎', platform: '平台搜索' };
const TRACK_TITLES = { engine: '切换到平台搜索', platform: '切换到搜索引擎' };

let documentClickHandler = null;
let currentSource = getCurrentSource();
let currentTrack = getCurrentTrack();
let updateSourceDisplay = null;

export function getUpdateSourceDisplay() {
  return updateSourceDisplay;
}

export function initSearch(container) {
  if (documentClickHandler) {
    document.removeEventListener('click', documentClickHandler);
    documentClickHandler = null;
  }

  const existingOverlay = document.getElementById('mobile-source-overlay');
  if (existingOverlay) existingOverlay.remove();
  const existingSheet = document.querySelector('.mobile-source-sheet');
  if (existingSheet) existingSheet.remove();

  const savedValue = container.querySelector('.search-input')?.value || '';

  container.innerHTML = '';

  const searchBox = createElement('div', { className: 'search-box' });

  const trackToggleBtn = createElement('button', {
    className: 'track-toggle-btn',
    title: TRACK_TITLES[currentTrack],
    innerHTML: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 16-4-4 4-4"/><path d="M3 12h18"/><path d="m17 8 4 4-4 4"/></svg>`,
  });

  const trackDivider = createElement('span', { className: 'track-divider' });

  const sourceIconBtn = createElement('button', {
    className: 'source-icon-btn',
    title: '切换' + TRACK_LABELS[currentTrack],
  });
  updateSourceIcon(sourceIconBtn, currentSource);

  const input = createElement('input', {
    type: 'text',
    className: 'search-input',
    placeholder: `${currentSource.name} 搜索`,
  });
  if (savedValue) input.value = savedValue;

  const toggleBtn = createElement('button', {
    className: 'search-btn',
    title: '搜索',
    innerHTML: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  });

  searchBox.appendChild(trackToggleBtn);
  searchBox.appendChild(trackDivider);
  searchBox.appendChild(sourceIconBtn);
  searchBox.appendChild(input);
  searchBox.appendChild(toggleBtn);

  const dropdown = createElement('div', { className: 'source-dropdown' });
  searchBox.appendChild(dropdown);
  let mobileSheet = null;

  function closeAll() {
    dropdown.classList.remove('active');
    dropdown.style.display = '';
    if (mobileSheet) {
      mobileSheet.remove();
      mobileSheet = null;
    }
    const overlay = document.getElementById('mobile-source-overlay');
    if (overlay) overlay.remove();
  }

  function switchTrack() {
    currentTrack = currentTrack === 'engine' ? 'platform' : 'engine';
    setCurrentTrack(currentTrack);
    currentSource = getCurrentSource();
    updateSourceIcon(sourceIconBtn, currentSource);
    input.placeholder = `${currentSource.name} 搜索`;
    trackToggleBtn.title = TRACK_TITLES[currentTrack];
    sourceIconBtn.title = '切换' + TRACK_LABELS[currentTrack];
  }

  trackToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    switchTrack();
  });

  sourceIconBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMobile()) openMobile();
    else toggleDesktop();
  });

  function toggleDesktop() {
    const active = dropdown.classList.contains('active');
    closeAll();
    if (!active) {
      renderList(dropdown);
      dropdown.style.display = 'block';
      dropdown.offsetHeight;
      dropdown.classList.add('active');
    }
  }

  function openMobile() {
    closeAll();
    const overlay = createElement('div', {
      id: 'mobile-source-overlay',
      className: 'mobile-overlay',
      onclick: closeAll,
    });
    document.body.appendChild(overlay);

    mobileSheet = createElement('div', { className: 'mobile-source-sheet' });
    const sheetContent = createElement('div', { className: 'sheet-content' });
    sheetContent.appendChild(createElement('div', { className: 'sheet-title' }, '选择' + TRACK_LABELS[currentTrack]));
    const listContainer = createElement('div', { className: 'source-list-mobile' });
    renderList(listContainer);
    sheetContent.appendChild(listContainer);
    mobileSheet.appendChild(sheetContent);
    document.body.appendChild(mobileSheet);

    requestAnimationFrame(() => mobileSheet.classList.add('active'));
  }

  function renderList(container) {
    container.innerHTML = '';
    const sources = getSourcesByTrack(currentTrack);
    sources.forEach(src => {
      const item = createElement('div', {
        className: `source-item ${src.id === currentSource.id ? 'active' : ''}`,
        onclick: () => {
          const text = input.value;
          setCurrentSource(src.id);
          currentSource = src;
          updateSourceIcon(sourceIconBtn, src);
          input.placeholder = `${src.name} 搜索`;
          input.value = text;
          closeAll();
        },
      });
      item.appendChild(createSourceIcon(src));
      item.appendChild(createElement('span', { className: 'source-name' }, src.name));
      container.appendChild(item);
    });
  }

  documentClickHandler = (e) => {
    const isInsideBox = searchBox.contains(e.target);
    const isInsideMobile = mobileSheet && mobileSheet.contains(e.target);
    if (!isInsideBox && !isInsideMobile) {
      closeAll();
    }
  };
  document.addEventListener('click', documentClickHandler);

  function performSearch(query) {
    query = query.trim();
    if (!query) return;
    const source = getCurrentSource();
    const url = source.url.replace('{query}', encodeURIComponent(query));
    window.open(url, '_blank');
  }

  toggleBtn.addEventListener('click', (e) => {
    addRipple(e, toggleBtn);
    const query = input.value.trim();
    if (query) {
      performSearch(query);
      document.dispatchEvent(new Event('close-suggestions'));
    } else {
      input.focus();
    }
  });

  initSuggestions(searchBox, input, toggleBtn, performSearch);

  updateSourceDisplay = (src) => {
    updateSourceIcon(sourceIconBtn, src);
    input.placeholder = `${src.name} 搜索`;
  };

  container.appendChild(searchBox);
}

function updateSourceIcon(btn, source) {
  btn.innerHTML = '';
  btn.appendChild(createSourceIcon(source));
}

function createSourceIcon(source) {
  const span = createElement('span', { className: 'source-icon' });
  if (source.iconType === 'text') {
    span.textContent = source.iconValue;
    span.style.backgroundColor = source.iconBg || '#aaa';
    span.style.color = source.iconColor || '#fff';
  } else {
    const img = createElement('img', { src: source.iconUrl, alt: source.name });
    span.appendChild(img);
  }
  return span;
}

function addRipple(e, element) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  element.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}
