import { getFromStorage, setToStorage } from './utils.js';

const STORAGE_KEY_SOURCES = 'custom_sources';
const STORAGE_KEY_CURRENT = 'current_source_id';
const STORAGE_KEY_HIDDEN = 'hidden_presets';      // 被用户隐藏（删除）的预设ID
const STORAGE_KEY_MODIFIED = 'modified_presets';  // 被用户编辑过的预设数据（id映射）

const PRESET_SOURCES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', iconType: 'text', iconValue: 'G', iconBg: '#4285F4', iconColor: '#ffffff' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', iconType: 'text', iconValue: 'B', iconBg: '#008097', iconColor: '#ffffff' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', iconType: 'text', iconValue: 'D', iconBg: '#DE5833', iconColor: '#ffffff' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={query}', iconType: 'text', iconValue: '百', iconBg: '#2932E1', iconColor: '#ffffff' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query={query}', iconType: 'text', iconValue: '搜', iconBg: '#FF5A00', iconColor: '#ffffff' },
];

let customSources = getFromStorage(STORAGE_KEY_SOURCES, []);
let currentSourceId = getFromStorage(STORAGE_KEY_CURRENT, 'google');
let hiddenPresets = getFromStorage(STORAGE_KEY_HIDDEN, []);
let modifiedPresets = getFromStorage(STORAGE_KEY_MODIFIED, {});

function saveCustom() { setToStorage(STORAGE_KEY_SOURCES, customSources); }
function saveCurrent() { setToStorage(STORAGE_KEY_CURRENT, currentSourceId); }
function saveHidden() { setToStorage(STORAGE_KEY_HIDDEN, hiddenPresets); }
function saveModified() { setToStorage(STORAGE_KEY_MODIFIED, modifiedPresets); }

export function getAllSources() {
  const presets = PRESET_SOURCES
    .filter(p => !hiddenPresets.includes(p.id))
    .map(p => {
      if (modifiedPresets[p.id]) {
        return { ...p, ...modifiedPresets[p.id] };
      }
      return p;
    });
  return [...presets, ...customSources];
}

export function getSourceById(id) {
  return getAllSources().find(s => s.id === id);
}

export function getCurrentSource() {
  return getSourceById(currentSourceId) || getAllSources()[0] || PRESET_SOURCES[0];
}

export function setCurrentSource(id) {
  currentSourceId = id;
  saveCurrent();
}

export function addCustomSource(source) {
  source.id = 'custom_' + Date.now();
  customSources.push(source);
  saveCustom();
}

export function removeCustomSource(id) {
  customSources = customSources.filter(s => s.id !== id);
  saveCustom();
}

export function updateCustomSource(id, data) {
  const idx = customSources.findIndex(s => s.id === id);
  if (idx !== -1) {
    customSources[idx] = { ...customSources[idx], ...data };
    saveCustom();
  }
}

// 编辑预设：实际修改 modifiedPresets，保留原预设 ID
export function modifyPreset(id, data) {
  modifiedPresets[id] = data;
  saveModified();
}

// 隐藏（删除）预设
export function hidePreset(id) {
  if (!hiddenPresets.includes(id)) {
    hiddenPresets.push(id);
    saveHidden();
  }
}

// 恢复所有预设（清空隐藏和修改，同时可选是否清除自定义衍生？简单起见只清空隐藏和修改）
export function resetPresets() {
  hiddenPresets = [];
  modifiedPresets = {};
  saveHidden();
  saveModified();
}

// 检查是否为预设（原始ID）
export function isPresetSource(id) {
  return PRESET_SOURCES.some(s => s.id === id);
}

// 获取当前隐藏列表（用于同步等）
export function getHiddenPresets() { return [...hiddenPresets]; }
export function getModifiedPresets() { return { ...modifiedPresets }; }
