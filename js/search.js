import { createElement, isMobile } from './utils.js';
import { getCurrentSource, setCurrentSource, getAllSources } from './search-sources.js';
import { initSuggestions } from './suggestions.js';

let documentClickHandler = null;
let currentSource = getCurrentSource();

export function initSearch(container) {
  if (documentClickHandler) {
    document.removeEventListener('click', documentClickHandler);
    documentClickHandler = null;
  }

  // 清理可能残留的移动端面板
  const existingOverlay = document.getElementById('mobile-source-overlay');
  if (existingOverlay) existingOverlay.remove();
  const existingSheet = document.querySelector('.mobile-source-sheet');
  if (existingSheet) existingSheet.remove();

  container.innerHTML = '';

  const searchBox = createElement('div', { className: 'search-box' });

  const sourceIconBtn = createElement('button', {
    className: 'source-icon-btn',
    title: '切换搜索引擎',
  });
  updateSourceIcon(sourceIconBtn, currentSource);

  const input = createElement('input', {
    type: 'text',
    className: 'search-input',
    placeholder: `${currentSource.name} 搜索`,
  });

  const toggleBtn = createElement('button', {
    className: 'search-btn',
    title: '搜索',
    innerHTML: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  });

  searchBox.appendChild(sourceIconBtn);
  searchBox.appendChild(input);
  searchBox.appendChild(toggleBtn);

  const dropdown = createElement('div', { className: 'source-dropdown' });
  searchBox.appendChild(dropdown);
  let mobileSheet = null;

  function closeAll() {
    dropdown.classList.remove('active');
    if (mobileSheet) {
      mobileSheet.remove();
      mobileSheet = null;
    }
    const overlay = document.getElementById('mobile-source-overlay');
    if (overlay) overlay.remove();
  }

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
    sheetContent.appendChild(createElement('div', { className: 'sheet-title' }, '选择搜索引擎'));
    const listContainer = createElement('div', { className: 'source-list-mobile' });
    renderList(listContainer);
    sheetContent.appendChild(listContainer);
    mobileSheet.appendChild(sheetContent);
    document.body.appendChild(mobileSheet);

    requestAnimationFrame(() => mobileSheet.classList.add('active'));
  }

  function renderList(container) {
    container.innerHTML = '';
    const sources = getAllSources();
    sources.forEach(src => {
      const item = createElement('div', {
        className: `source-item ${src.id === currentSource.id ? 'active' : ''}`,
        onclick: () => {
          setCurrentSource(src.id);
          currentSource = src;
          updateSourceIcon(sourceIconBtn, src);
          input.placeholder = `${src.name} 搜索`;
          closeAll();
          document.dispatchEvent(new CustomEvent('source-changed'));
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

  toggleBtn.addEventListener('click', () => {
    const query = input.value.trim();
    if (query) {
      performSearch(query);
      document.dispatchEvent(new Event('close-suggestions'));
    } else {
      input.focus();
    }
  });

  initSuggestions(searchBox, input, toggleBtn, performSearch);
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
