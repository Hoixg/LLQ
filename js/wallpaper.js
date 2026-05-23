import { getFromStorage, setToStorage, createElement } from './utils.js';

const STORAGE_KEY = 'wallpaperSettings';

const DEFAULT_CONFIG = {
  autoSwitch: false,
  mode: 'default',
  portraitUrl: '',
  landscapeUrl: '',
};

export function getWallpaperConfig() {
  const saved = getFromStorage(STORAGE_KEY);
  return { ...DEFAULT_CONFIG, ...saved };
}

function saveWallpaperConfig(config) {
  setToStorage(STORAGE_KEY, config);
}

function isValidImageUrl(url) {
  try {
    const u = new URL(String(url).trim());
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

function setBackgroundImage(url) {
  const layer = document.getElementById('wallpaperLayer');
  if (!layer) return;
  if (url && url.trim() && isValidImageUrl(url)) {
    layer.style.backgroundImage = `url("${url.trim()}")`;
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
  } else {
    layer.style.backgroundImage = '';
    document.documentElement.style.backgroundColor = '';
    document.body.style.backgroundColor = '';
  }
}

export function applyWallpaper() {
  const config = getWallpaperConfig();
  let url = '';

  if (config.autoSwitch) {
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    url = isPortrait ? config.portraitUrl : config.landscapeUrl;
  } else if (config.mode === 'portrait') {
    url = config.portraitUrl;
  } else if (config.mode === 'landscape') {
    url = config.landscapeUrl;
  } else {
    url = config.portraitUrl || config.landscapeUrl;
  }

  setBackgroundImage(url);
}

let orientationMedia = null;

function listenOrientation() {
  if (orientationMedia) {
    orientationMedia.removeEventListener('change', applyWallpaper);
  }
  orientationMedia = window.matchMedia('(orientation: portrait)');
  orientationMedia.addEventListener('change', applyWallpaper);
}

export function initWallpaper() {
  applyWallpaper();
  listenOrientation();
  document.addEventListener('wallpaper-update', applyWallpaper);
}

export function updateWallpaperConfig(partial) {
  const config = getWallpaperConfig();
  Object.assign(config, partial);
  saveWallpaperConfig(config);
  applyWallpaper();
}

export function renderWallpaperTab(container) {
  container.innerHTML = '';
  const config = getWallpaperConfig();

  const section = createElement('div', { className: 'wallpaper-section' });

  const autoRow = createElement('div', { className: 'setting-row' });
  autoRow.appendChild(createElement('label', {}, '根据屏幕自动切换'));
  const toggleLabel = createElement('label', { className: 'toggle-switch' });
  const toggleInput = createElement('input', {
    type: 'checkbox',
    checked: config.autoSwitch,
    onchange: (e) => {
      updateWallpaperConfig({ autoSwitch: e.target.checked });
      renderWallpaperTab(container);
    },
  });
  toggleLabel.appendChild(toggleInput);
  toggleLabel.appendChild(createElement('span', { className: 'slider' }));
  autoRow.appendChild(toggleLabel);
  section.appendChild(autoRow);

  if (!config.autoSwitch) {
    const modeGroup = createElement('div', { className: 'wallpaper-mode-group' });
    const modes = [
      { value: 'default', label: '默认壁纸' },
      { value: 'portrait', label: '竖屏壁纸' },
      { value: 'landscape', label: '横屏壁纸' },
    ];
    modes.forEach(m => {
      const label = createElement('label', {});
      const radio = createElement('input', {
        type: 'radio',
        name: 'wallpaperMode',
        value: m.value,
        checked: config.mode === m.value,
        onchange: () => {
          updateWallpaperConfig({ mode: m.value });
        },
      });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(m.label));
      modeGroup.appendChild(label);
    });
    section.appendChild(modeGroup);
  }

  const urlGroup = createElement('div', { className: 'wallpaper-url-group' });
  urlGroup.appendChild(createUrlItem('portrait', '竖屏壁纸 URL', config.portraitUrl, '竖屏壁纸用于手机竖屏或屏幕高度大于宽度时'));
  urlGroup.appendChild(createUrlItem('landscape', '横屏壁纸 URL', config.landscapeUrl, '横屏壁纸用于电脑横屏或屏幕宽度大于高度时'));
  section.appendChild(urlGroup);

  const btnRow = createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '8px' } });
  const saveBtn = createElement('button', {
    className: 'btn-small',
    style: { flex: '1', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '6px 12px' },
    onclick: () => {
      const portraitInput = document.getElementById('wallpaper-portrait-input');
      const landscapeInput = document.getElementById('wallpaper-landscape-input');
      const newConfig = {
        portraitUrl: portraitInput ? portraitInput.value.trim() : '',
        landscapeUrl: landscapeInput ? landscapeInput.value.trim() : '',
      };
      updateWallpaperConfig(newConfig);
      renderWallpaperTab(container);
    },
  }, '保存壁纸设置');
  btnRow.appendChild(saveBtn);

  const resetBtn = createElement('button', {
    className: 'btn-small',
    style: { flex: '0 0 auto' },
    onclick: () => {
      updateWallpaperConfig({ portraitUrl: '', landscapeUrl: '', mode: 'default', autoSwitch: false });
      renderWallpaperTab(container);
    },
  }, '重置为默认');
  btnRow.appendChild(resetBtn);

  section.appendChild(btnRow);

  container.appendChild(section);
}

function createUrlItem(key, labelText, currentValue, hintText) {
  const item = createElement('div', { className: 'wallpaper-url-item' });

  const labelRow = createElement('div', { className: 'label-with-button' });
  labelRow.appendChild(createElement('label', {}, labelText));
  const clearBtn = createElement('button', {
    className: 'btn-clear',
    onclick: () => {
      const input = document.getElementById(`wallpaper-${key}-input`);
      const preview = document.getElementById(`wallpaper-${key}-preview`);
      if (input) input.value = '';
      if (preview) preview.style.backgroundImage = '';
    },
  }, '清除');
  labelRow.appendChild(clearBtn);
  item.appendChild(labelRow);

  const inputRow = createElement('div', { className: 'input-row' });
  const input = createElement('input', {
    type: 'url',
    id: `wallpaper-${key}-input`,
    placeholder: '输入图片 URL（例如图床链接）',
    value: currentValue || '',
    oninput: (e) => {
      const url = e.target.value.trim();
      const preview = document.getElementById(`wallpaper-${key}-preview`);
      if (url && isValidImageUrl(url)) {
        preview.style.backgroundImage = `url("${url}")`;
        const img = new Image();
        img.src = url;
        img.onerror = () => { preview.style.backgroundImage = ''; };
      } else {
        preview.style.backgroundImage = '';
      }
    },
  });
  inputRow.appendChild(input);

  const previewBox = createElement('div', {
    className: 'preview-box',
    id: `wallpaper-${key}-preview`,
  });
  if (currentValue) {
    previewBox.style.backgroundImage = `url("${currentValue}")`;
  }
  inputRow.appendChild(previewBox);
  item.appendChild(inputRow);

  if (hintText) {
    item.appendChild(createElement('div', { className: 'hint' }, hintText));
  }

  return item;
}
