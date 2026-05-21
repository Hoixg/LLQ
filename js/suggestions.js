import { getCurrentSource } from './suggest-sources.js';

const PARSERS = {
  generic_array(data) {
    if (!Array.isArray(data)) return [];
    if (data.length > 1 && Array.isArray(data[1])) return data[1].slice(0, 8);
    if (data.every(item => typeof item === 'string')) return data.slice(0, 8);
    return [];
  },
  baidu(data) {
    if (data && data.s && Array.isArray(data.s)) return data.s.slice(0, 8);
    if (data && data.g && Array.isArray(data.g)) return data.g.map(item => item.q).slice(0, 8);
    return [];
  },
  ddg(data) {
    if (!Array.isArray(data)) return [];
    return data.map(item => item.phrase || item.text || '').filter(Boolean).slice(0, 8);
  },
  string_array(data) {
    if (Array.isArray(data) && data.every(item => typeof item === 'string')) return data.slice(0, 8);
    return [];
  },
  none: () => [],
};

let currentRequestId = 0;
let activeDropdown = null;
let activeOverlay = null;
let currentSuggestions = [];
let selectedIndex = -1;
let closeSuggestionsHandler = () => {};
let closeDropdownTimer = null;
let closeOverlayTimer = null;

export function initSuggestions(searchBox, inputEl, toggleBtn, onSearch) {
  cleanupExisting();

  if (!searchBox.style.position || searchBox.style.position === 'static') {
    searchBox.style.position = 'relative';
  }

  document.querySelectorAll('.suggestions-overlay').forEach(el => el.remove());

  const dropdown = document.createElement('div');
  dropdown.className = 'suggestions-dropdown';
  searchBox.appendChild(dropdown);

  const overlay = document.createElement('div');
  overlay.className = 'suggestions-overlay';
  overlay.addEventListener('click', () => closeSuggestionsHandler());
  document.body.appendChild(overlay);

  let debounceTimer;
  let blurTimer;

  document.addEventListener('close-suggestions', () => closeSuggestionsHandler());

  inputEl.addEventListener('input', () => {
    const query = inputEl.value.trim();
    clearTimeout(debounceTimer);
    if (query.length === 0) {
      closeSuggestionsHandler();
      return;
    }
    debounceTimer = setTimeout(() => fetchAndShow(query), 300);
  });

  function tryFetchOnFocus() {
    clearTimeout(blurTimer);
    const query = inputEl.value.trim();
    if (query.length === 0) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchAndShow(query), 150);
  }

  inputEl.addEventListener('focus', tryFetchOnFocus);
  inputEl.addEventListener('click', tryFetchOnFocus);
  inputEl.addEventListener('touchend', (e) => {
    setTimeout(tryFetchOnFocus, 0);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSuggestionsHandler();
      return;
    }
    const dropdownVisible = activeDropdown && activeDropdown.classList.contains('active');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!dropdownVisible) return;
      e.preventDefault();
      const items = activeDropdown.querySelectorAll('.suggestion-item');
      if (e.key === 'ArrowDown') {
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      } else {
        selectedIndex = Math.max(selectedIndex - 1, -1);
      }
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      let searchText = inputEl.value.trim();
      if (dropdownVisible && selectedIndex >= 0) {
        const items = activeDropdown.querySelectorAll('.suggestion-item');
        if (items[selectedIndex]) {
          searchText = items[selectedIndex].textContent;
        }
      }
      closeSuggestionsHandler();
      if (searchText) {
        inputEl.value = searchText;
        onSearch(searchText);
      }
    }
  });

  inputEl.addEventListener('blur', () => {
    clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      if (!document.activeElement || !searchBox.contains(document.activeElement)) {
        closeSuggestionsHandler();
      }
    }, 150);
  });

  function fetchAndShow(query) {
    const source = getCurrentSource();
    if (!source || source.parser === 'none') {
      closeSuggestionsHandler();
      return;
    }

    const requestId = ++currentRequestId;
    const callbackName = '__suggest_cb_' + Date.now() + '_' + requestId;
    let settled = false;
    let timeoutId;

    function cleanup() {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      delete window[callbackName];
      const el = document.getElementById('suggest_script_' + callbackName);
      if (el) el.remove();
    }

    window[callbackName] = function (data) {
      if (requestId !== currentRequestId) { cleanup(); return; }
      cleanup();
      const suggestions = parseSuggestions(data, source.parser);
      if (requestId === currentRequestId) {
        showSuggestions(suggestions);
      }
    };

    const url = source.url
      .replace('{query}', encodeURIComponent(query))
      .replace('{callback}', callbackName);

    const script = document.createElement('script');
    script.src = url;
    script.id = 'suggest_script_' + callbackName;
    script.onerror = () => {
      if (requestId !== currentRequestId) { cleanup(); return; }
      cleanup();
      closeSuggestionsHandler();
    };
    document.body.appendChild(script);

    timeoutId = setTimeout(() => {
      if (!settled) {
        cleanup();
        if (requestId === currentRequestId) closeSuggestionsHandler();
      }
    }, 5000);
  }

  function showSuggestions(suggestions) {
    if (suggestions.length === 0) {
      closeSuggestionsHandler();
      return;
    }
    currentSuggestions = suggestions;
    selectedIndex = -1;
    dropdown.innerHTML = '';
    suggestions.forEach(text => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = text;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        closeSuggestionsHandler();
        inputEl.value = text;
        onSearch(text);
      });
      dropdown.appendChild(item);
    });
    clearTimeout(closeDropdownTimer);
    closeDropdownTimer = null;
    dropdown.style.display = 'block';
    dropdown.offsetHeight;
    dropdown.classList.add('active');
    activeDropdown = dropdown;
    if (window.innerWidth <= 768) {
      clearTimeout(closeOverlayTimer);
      closeOverlayTimer = null;
      overlay.style.display = 'block';
      overlay.offsetHeight;
      overlay.classList.add('active');
      activeOverlay = overlay;
    }
  }

  function updateHighlight(items) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === selectedIndex);
    });
  }

  closeSuggestionsHandler = () => {
    if (activeDropdown) {
      activeDropdown.classList.remove('active');
      const dropdownRef = activeDropdown;
      activeDropdown = null;
      clearTimeout(closeDropdownTimer);
      closeDropdownTimer = setTimeout(() => {
        closeDropdownTimer = null;
        dropdownRef.style.display = 'none';
        dropdownRef.innerHTML = '';
      }, 150);
    }
    if (activeOverlay) {
      activeOverlay.classList.remove('active');
      const overlayRef = activeOverlay;
      activeOverlay = null;
      clearTimeout(closeOverlayTimer);
      closeOverlayTimer = setTimeout(() => {
        closeOverlayTimer = null;
        overlayRef.style.display = 'none';
      }, 150);
    }
    currentSuggestions = [];
    selectedIndex = -1;
  };
}

function parseSuggestions(data, parser) {
  const parserFn = PARSERS[parser] || PARSERS.generic_array;
  try {
    return parserFn(data);
  } catch (e) {
    console.warn('建议解析失败', e);
    return [];
  }
}

export function closeSuggestionsNow() {
  if (closeSuggestionsHandler) closeSuggestionsHandler();
}

function cleanupExisting() {
  clearTimeout(closeDropdownTimer);
  closeDropdownTimer = null;
  clearTimeout(closeOverlayTimer);
  closeOverlayTimer = null;
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
}
