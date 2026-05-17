import { getFromStorage, setToStorage } from './utils.js';

const STORAGE_KEY = 'suggest_settings';
const STORAGE_KEY_HIDDEN = 'hidden_suggest_presets';
const STORAGE_KEY_MODIFIED = 'modified_suggest_presets';

const PRESETS = [
  { id: 'sug_google', name: 'Google 建议', url: 'https://suggestqueries.google.com/complete/search?client=chrome&q={query}&callback={callback}', parser: 'generic_array' },
  { id: 'sug_baidu', name: '百度建议', url: 'https://www.baidu.com/sugrec?prod=pc&wd={query}&cb={callback}', parser: 'baidu' },
  { id: 'sug_bing', name: 'Bing 建议', url: 'https://api.bing.com/osjson.aspx?query={query}&JsonType=callback&JsonCallback={callback}', parser: 'generic_array' },
  { id: 'sug_ddg', name: 'DuckDuckGo 建议', url: 'https://duckduckgo.com/ac/?q={query}&callback={callback}', parser: 'ddg' },
  { id: 'sug_sogou', name: '搜狗建议', url: 'https://www.sogou.com/suggnew/ajajjson?type=web&key={query}&callback={callback}', parser: 'generic_array' },
  { id: 'none', name: '无建议 (关闭)', url: '', parser: 'none' },
];

let currentId, customSources, hiddenPresets, modifiedPresets;

function load() {
  const saved = getFromStorage(STORAGE_KEY, {});
  currentId = saved.currentSourceId || 'sug_google';
  customSources = saved.customSources || [];
  hiddenPresets = getFromStorage(STORAGE_KEY_HIDDEN, []);
  modifiedPresets = getFromStorage(STORAGE_KEY_MODIFIED, {});
}
function save() { setToStorage(STORAGE_KEY, { currentSourceId: currentId, customSources }); }
function saveHidden() { setToStorage(STORAGE_KEY_HIDDEN, hiddenPresets); }
function saveModified() { setToStorage(STORAGE_KEY_MODIFIED, modifiedPresets); }
load();

export function getAllSources() {
  const presets = PRESETS
    .filter(p => !hiddenPresets.includes(p.id))
    .map(p => modifiedPresets[p.id] ? { ...p, ...modifiedPresets[p.id] } : p);
  return [...presets, ...customSources];
}

export function getCurrentSource() {
  return getAllSources().find(s => s.id === currentId) || getAllSources()[0] || PRESETS[0];
}

export function getCurrentSourceId() { return currentId; }
export function setCurrentSource(id) { currentId = id; save(); }

export function addCustomSource(src) {
  src.id = 'usug_' + Date.now();
  customSources.push(src);
  save();
}

export function removeCustomSource(id) {
  customSources = customSources.filter(s => s.id !== id);
  save();
}

export function updateCustomSource(id, data) {
  const idx = customSources.findIndex(s => s.id === id);
  if (idx !== -1) {
    customSources[idx] = { ...customSources[idx], ...data };
    save();
  }
}

export function modifyPreset(id, data) {
  modifiedPresets[id] = data;
  saveModified();
}

export function hidePreset(id) {
  if (!hiddenPresets.includes(id)) {
    hiddenPresets.push(id);
    saveHidden();
  }
}

export function resetSuggestPresets() {
  hiddenPresets = [];
  modifiedPresets = {};
  saveHidden();
  saveModified();
}

export function isPresetSource(id) {
  return PRESETS.some(s => s.id === id);
}

export function getCustomSources() { return customSources; }
