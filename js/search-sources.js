import { getFromStorage, setToStorage } from './utils.js';
import { createSourceManager } from './source-manager.js';

const STORAGE_KEY_SOURCES = 'custom_sources';
const STORAGE_KEY_CURRENT = 'current_source_id';
const STORAGE_KEY_HIDDEN = 'hidden_presets';
const STORAGE_KEY_MODIFIED = 'modified_presets';

const PRESET_SOURCES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', iconType: 'text', iconValue: 'G', iconBg: '#4285F4', iconColor: '#ffffff' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', iconType: 'text', iconValue: 'B', iconBg: '#008097', iconColor: '#ffffff' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', iconType: 'text', iconValue: 'D', iconBg: '#DE5833', iconColor: '#ffffff' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={query}', iconType: 'text', iconValue: '百', iconBg: '#2932E1', iconColor: '#ffffff' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query={query}', iconType: 'text', iconValue: '搜', iconBg: '#FF5A00', iconColor: '#ffffff' },
];

const manager = createSourceManager(PRESET_SOURCES, { defaultId: 'google', idPrefix: 'custom_' });

manager.init({
  currentId: getFromStorage(STORAGE_KEY_CURRENT, 'google'),
  customSources: getFromStorage(STORAGE_KEY_SOURCES, []),
  hiddenPresets: getFromStorage(STORAGE_KEY_HIDDEN, []),
  modifiedPresets: getFromStorage(STORAGE_KEY_MODIFIED, {}),
}, (state) => {
  setToStorage(STORAGE_KEY_CURRENT, state.currentId);
  setToStorage(STORAGE_KEY_SOURCES, state.customSources);
  setToStorage(STORAGE_KEY_HIDDEN, state.hiddenPresets);
  setToStorage(STORAGE_KEY_MODIFIED, state.modifiedPresets);
});

export const getAllSources = () => manager.getAllSources();
export const getSourceById = (id) => manager.getAllSources().find(s => s.id === id);
export const getCurrentSource = () => manager.getCurrentSource();
export const setCurrentSource = (id) => manager.setCurrentSource(id);
export const addCustomSource = (src) => manager.addCustomSource(src);
export const removeCustomSource = (id) => manager.removeCustomSource(id);
export const updateCustomSource = (id, data) => manager.updateCustomSource(id, data);
export const modifyPreset = (id, data) => manager.modifyPreset(id, data);
export const hidePreset = (id) => manager.hidePreset(id);
export const resetPresets = () => manager.resetPresets();
export const isPresetSource = (id) => manager.isPresetSource(id);
export const getHiddenPresets = () => manager.getHiddenPresets();
export const getModifiedPresets = () => manager.getModifiedPresets();
