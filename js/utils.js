const BOOLEAN_ATTRS = new Set([
  'checked', 'disabled', 'readonly', 'selected', 'multiple', 'autofocus', 'required',
]);

export function applyTheme(theme) {
  const isDark = theme === 'auto'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function getFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    const item = localStorage.getItem(key);
    return item || defaultValue;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 忽略存储失败
  }
}

export function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else if (key === 'textContent') {
      el.textContent = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key === 'data') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        el.dataset[dataKey] = dataValue;
      }
    } else if (BOOLEAN_ATTRS.has(key) && typeof value === 'boolean') {
      el[key] = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  if (typeof children === 'string') {
    el.innerHTML = children;
  } else if (Array.isArray(children)) {
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    }
  }
  return el;
}
