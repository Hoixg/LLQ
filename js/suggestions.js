import { getCurrentSource } from './suggest-sources.js';

let currentRequestId = 0;
let activeDropdown = null;
let activeOverlay = null;
let currentSuggestions = [];
let selectedIndex = -1;
let closeSuggestionsHandler = () => {};

export function initSuggestions(searchBox, inputEl, toggleBtn, onSearch) {
  // 清理之前可能残留的 dropdown 和 overlay
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }

  if (!searchBox.style.position || searchBox.style.position === 'static') {
    searchBox.style.position = 'relative';
  }

  document.querySelectorAll('.suggestions-overlay').forEach(el => el.remove());

  const dropdown = document.createElement('div');
  dropdown.className = 'suggestions-dropdown';
  Object.assign(dropdown.style, {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: '0',
    right: '0',
    backgroundColor: 'var(--color-bg-elevated, #fff)',
    border: '1px solid var(--color-border, #dee2e6)',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    zIndex: '110',
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'none',
  });
  searchBox.appendChild(dropdown);

  const overlay = document.createElement('div');
  overlay.className = 'suggestions-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'transparent',
    zIndex: '105',
    display: 'none',
  });
  overlay.addEventListener('click', () => closeSuggestionsHandler());
  document.body.appendChild(overlay);

  let debounceTimer;
  let lastQuery = '';

  document.addEventListener('close-suggestions', () => closeSuggestionsHandler());

  inputEl.addEventListener('input', () => {
    const query = inputEl.value.trim();
    if (query === lastQuery) return;
    lastQuery = query;
    clearTimeout(debounceTimer);
    if (query.length === 0) {
      closeSuggestionsHandler();
      return;
    }
    debounceTimer = setTimeout(() => {
      fetchAndShow(query);
    }, 300);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSuggestionsHandler();
      return;
    }
    const dropdownVisible = activeDropdown && activeDropdown.style.display === 'block';
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
    setTimeout(() => {
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
    let scriptRemoved = false;

    window[callbackName] = function (data) {
      if (requestId !== currentRequestId) {
        delete window[callbackName];
        return;
      }
      if (!scriptRemoved) removeScript();
      const suggestions = parseSuggestions(data, source.parser);
      if (requestId === currentRequestId) {
        showSuggestions(suggestions, query);
      }
      delete window[callbackName];
    };

    const url = source.url
      .replace('{query}', encodeURIComponent(query))
      .replace('{callback}', callbackName);

    const script = document.createElement('script');
    script.src = url;
    script.id = 'suggest_script_' + callbackName;
    script.onerror = () => {
      delete window[callbackName];
      removeScript();
      closeSuggestionsHandler();
    };
    document.body.appendChild(script);

    const timeoutId = setTimeout(() => {
      if (!scriptRemoved) {
        delete window[callbackName];
        removeScript();
        closeSuggestionsHandler();
      }
    }, 5000);

    function removeScript() {
      scriptRemoved = true;
      clearTimeout(timeoutId);
      if (script.parentNode) script.parentNode.removeChild(script);
    }
  }

  function parseSuggestions(data, parser) {
    try {
      switch (parser) {
        case 'generic_array':
          if (Array.isArray(data)) {
            if (data.length > 1 && Array.isArray(data[1])) return data[1].slice(0, 8);
            if (data.every(item => typeof item === 'string')) return data.slice(0, 8);
          }
          return [];
        case 'baidu':
          if (data && data.s && Array.isArray(data.s)) return data.s.slice(0, 8);
          if (data && data.g && Array.isArray(data.g)) {
            return data.g.map(item => item.q).slice(0, 8);
          }
          return [];
        case 'ddg':
          if (Array.isArray(data)) {
            return data.map(item => item.phrase || item.text || '').filter(Boolean).slice(0, 8);
          }
          return [];
        default:
          return parseSuggestions(data, 'generic_array');
      }
    } catch (e) {
      console.warn('建议解析失败', e);
      return [];
    }
  }

  function showSuggestions(suggestions, query) {
    if (suggestions.length === 0) {
      closeSuggestionsHandler();
      return;
    }
    currentSuggestions = suggestions;
    selectedIndex = -1;
    dropdown.innerHTML = '';
    suggestions.forEach((text, i) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = text;
      Object.assign(item.style, {
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: 'var(--color-text, #212529)',
        transition: 'background-color 0.2s',
      });
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = 'var(--color-border, #dee2e6)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '';
      });
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        closeSuggestionsHandler();
        inputEl.value = text;
        onSearch(text);
      });
      dropdown.appendChild(item);
    });
    dropdown.style.display = 'block';
    activeDropdown = dropdown;
    if (window.innerWidth <= 768) {
      overlay.style.display = 'block';
      activeOverlay = overlay;
    }
  }

  function updateHighlight(items) {
    items.forEach((item, i) => {
      if (i === selectedIndex) {
        item.style.backgroundColor = 'var(--color-border, #dee2e6)';
        item.classList.add('active');
      } else {
        item.style.backgroundColor = '';
        item.classList.remove('active');
      }
    });
  }

  closeSuggestionsHandler = () => {
    if (activeDropdown) {
      activeDropdown.style.display = 'none';
      activeDropdown.innerHTML = '';
      activeDropdown = null;
    }
    if (activeOverlay) {
      activeOverlay.style.display = 'none';
      activeOverlay = null;
    }
    currentSuggestions = [];
    selectedIndex = -1;
  };
}

export function closeSuggestionsNow() {
  if (closeSuggestionsHandler) closeSuggestionsHandler();
}
