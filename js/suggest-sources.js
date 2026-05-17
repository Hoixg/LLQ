import { getFromStorage, setToStorage } from './utils.js';

const STORAGE_KEY = 'suggest_settings';

const PRESET_SOURCES = [
  {
    id: 'sug_google',
    name: 'Google 建议',
    url: 'https://suggestqueries.google.com/complete/search?client=chrome&q={query}&callback={callback}',
    parser: 'generic_array',
  },
  {
    id: 'sug_baidu',
    name: '百度建议',
    url: 'https://www.baidu.com/sugrec?prod=pc&wd={query}&cb={callback}',
    parser: 'baidu',
  },
  {
    id: 'sug_bing',
    name: 'Bing 建议',
    url: 'https://api.bing.com/osjson.aspx?query={query}&JsonType=callback&JsonCallback={callback}',
    parser: 'generic_array',
  },
  {
    id: 'sug_ddg',
    name: 'DuckDuckGo 建议',
    url: 'https://duckduckgo.com/ac/?q={query}&callback={callback}',
    parser: 'ddg',
  },
  {
    id: 'sug_sogou',
    name: '搜狗建议',
    url: 'https://www.sogou.com/suggnew/ajajjson?type=web&key={query}&callback={callback}',
    parser: 'generic_array',
  },
  {
    id: 'none',
    name: '无建议 (关闭)',
    url: '',
    parser: 'none',
  },
];

let currentSourceId;
let customSources;

function loadSettings() {
  const saved = getFromStorage(STORAGE_KEY, {});
  currentSourceId = saved.currentSourceId || 'sug_google';
  customSources = saved.customSources || [];
}

function saveSettings() {
  setToStorage(STORAGE_KEY, {
    currentSourceId,
    customSources,
  });
}

loadSettings();

export function getAllSources() {
  return [...PRESET_SOURCES, ...customSources];
}

export function getCurrentSource() {
  const sources = getAllSources();
  return sources.find(s => s.id === currentSourceId) || PRESET_SOURCES[0];
}

export function setCurrentSource(id) {
  currentSourceId = id;
  saveSettings();
}

export function addCustomSource(source) {
  source.id = 'usug_' + Date.now();
  customSources.push(source);
  saveSettings();
}

export function removeCustomSource(id) {
  customSources = customSources.filter(s => s.id !== id);
  saveSettings();
}

export function updateCustomSource(id, data) {
  const index = customSources.findIndex(s => s.id === id);
  if (index !== -1) {
    customSources[index] = { ...customSources[index], ...data };
    saveSettings();
  }
}

export function isPresetSource(id) {
  return PRESET_SOURCES.some(s => s.id === id);
}

export function getCurrentSourceId() {
  return currentSourceId;
}

export function getCustomSources() {
  return customSources;
}
