import { getFromStorage, setToStorage } from './utils.js';
import { createSourceManager } from './source-manager.js';

const STORAGE_KEY_SOURCES = 'custom_sources';
const STORAGE_KEY_CURRENT = 'current_source_id';
const STORAGE_KEY_HIDDEN = 'hidden_presets';
const STORAGE_KEY_MODIFIED = 'modified_presets';
const STORAGE_KEY_ENGINE_ORDER = 'engine_order';
const STORAGE_KEY_TRACK = 'current_track';
const STORAGE_KEY_TRACK_LAST = 'track_last_source';

const PRESET_SOURCES = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={query}', iconType: 'text', iconValue: 'G', iconBg: '#4285F4', iconColor: '#ffffff', track: 'engine' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={query}', iconType: 'text', iconValue: 'B', iconBg: '#008097', iconColor: '#ffffff', track: 'engine' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}', iconType: 'text', iconValue: 'D', iconBg: '#DE5833', iconColor: '#ffffff', track: 'engine' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd={query}', iconType: 'text', iconValue: '百', iconBg: '#2932E1', iconColor: '#ffffff', track: 'engine' },
  { id: 'sogou', name: '搜狗', url: 'https://www.sogou.com/web?query={query}', iconType: 'text', iconValue: '搜', iconBg: '#FF5A00', iconColor: '#ffffff', track: 'engine' },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q={query}', iconType: 'text', iconValue: '⌥', iconBg: '#24292f', iconColor: '#ffffff', track: 'platform' },
];

const manager = createSourceManager(PRESET_SOURCES, { defaultId: 'google', idPrefix: 'custom_' });

let currentTrack = getFromStorage(STORAGE_KEY_TRACK, 'engine');
let trackLastSource = getFromStorage(STORAGE_KEY_TRACK_LAST, { engine: 'google', platform: 'github' });

const initialCustom = getFromStorage(STORAGE_KEY_SOURCES, []);
initialCustom.forEach(s => { if (!s.track) s.track = 'engine'; });

manager.init({
  currentId: getFromStorage(STORAGE_KEY_CURRENT, 'google'),
  customSources: initialCustom,
  hiddenPresets: getFromStorage(STORAGE_KEY_HIDDEN, []),
  modifiedPresets: getFromStorage(STORAGE_KEY_MODIFIED, {}),
  engineOrder: getFromStorage(STORAGE_KEY_ENGINE_ORDER, {}),
}, (state) => {
  setToStorage(STORAGE_KEY_CURRENT, state.currentId);
  setToStorage(STORAGE_KEY_SOURCES, state.customSources);
  setToStorage(STORAGE_KEY_HIDDEN, state.hiddenPresets);
  setToStorage(STORAGE_KEY_MODIFIED, state.modifiedPresets);
  setToStorage(STORAGE_KEY_ENGINE_ORDER, state.engineOrder);
});

function saveTrackState() {
  setToStorage(STORAGE_KEY_TRACK, currentTrack);
  setToStorage(STORAGE_KEY_TRACK_LAST, trackLastSource);
}

export const getAllSources = () => manager.getAllSources();
export const getSourceById = (id) => manager.getAllSources().find(s => s.id === id);

export function getCurrentSource() {
  const lastId = trackLastSource[currentTrack];
  const allSources = manager.getAllSources();
  if (allSources.length === 0) return null;
  const src = allSources.find(s => s.id === lastId);
  if (src) return src;
  const trackSources = allSources.filter(s => s.track === currentTrack);
  return trackSources[0] || allSources[0];
}

export function setCurrentSource(id) {
  manager.setCurrentSource(id);
  trackLastSource[currentTrack] = id;
  saveTrackState();
}

export const addCustomSource = (src) => manager.addCustomSource(src);
export const removeCustomSource = (id) => manager.removeCustomSource(id);
export const updateCustomSource = (id, data) => manager.updateCustomSource(id, data);
export const modifyPreset = (id, data) => manager.modifyPreset(id, data);
export const hidePreset = (id) => manager.hidePreset(id);
export const resetPresets = () => manager.resetPresets();
export const isPresetSource = (id) => manager.isPresetSource(id);
export const reorderEngines = (orderedIds) => manager.reorderEngines(orderedIds);
export const getEngineOrder = () => manager.getEngineOrder();
export const getHiddenPresets = () => manager.getHiddenPresets();
export const getModifiedPresets = () => manager.getModifiedPresets();

export function getCurrentTrack() {
  return currentTrack;
}

export function setCurrentTrack(track) {
  currentTrack = track;
  saveTrackState();
}

export function getSourcesByTrack(track) {
  return manager.getAllSources().filter(s => s.track === track);
}

export function getLastSourceForTrack(track) {
  return trackLastSource[track] || getSourcesByTrack(track)[0]?.id;
}
