import { getFromStorage, setToStorage } from './utils.js';

const STORAGE_KEY_SOURCES = 'custom_sources';
const STORAGE_KEY_CURRENT = 'current_source_id';

const PRESET_SOURCES = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q={query}',
    iconType: 'text',
    iconValue: 'G',
    iconBg: '#4285F4',
    iconColor: '#ffffff',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q={query}',
    iconType: 'text',
    iconValue: 'B',
    iconBg: '#008097',
    iconColor: '#ffffff',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q={query}',
    iconType: 'text',
    iconValue: 'D',
    iconBg: '#DE5833',
    iconColor: '#ffffff',
  },
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd={query}',
    iconType: 'text',
    iconValue: '百',
    iconBg: '#2932E1',
    iconColor: '#ffffff',
  },
  {
    id: 'sogou',
    name: '搜狗',
    url: 'https://www.sogou.com/web?query={query}',
    iconType: 'text',
    iconValue: '搜',
    iconBg: '#FF5A00',
    iconColor: '#ffffff',
  },
];

let customSources = getFromStorage(STORAGE_KEY_SOURCES, []);
let currentSourceId = getFromStorage(STORAGE_KEY_CURRENT, 'google');

export function getAllSources() {
  return [...PRESET_SOURCES, ...customSources];
}

export function getSourceById(id) {
  return getAllSources().find(s => s.id === id);
}

export function getCurrentSource() {
  return getSourceById(currentSourceId) || PRESET_SOURCES[0];
}

export function setCurrentSource(id) {
  currentSourceId = id;
  setToStorage(STORAGE_KEY_CURRENT, id);
}

export function addCustomSource(source) {
  source.id = 'custom_' + Date.now();
  customSources.push(source);
  saveCustomSources();
}

export function removeCustomSource(id) {
  customSources = customSources.filter(s => s.id !== id);
  saveCustomSources();
}

export function updateCustomSource(id, data) {
  const index = customSources.findIndex(s => s.id === id);
  if (index !== -1) {
    customSources[index] = { ...customSources[index], ...data };
    saveCustomSources();
  }
}

function saveCustomSources() {
  setToStorage(STORAGE_KEY_SOURCES, customSources);
}

export function isPresetSource(id) {
  return PRESET_SOURCES.some(s => s.id === id);
}
