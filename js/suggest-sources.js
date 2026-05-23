import { getFromStorage, setToStorage } from './utils.js';
import { createSourceManager } from './source-manager.js';

const STORAGE_KEY = 'suggest_settings';
const STORAGE_KEY_HIDDEN = 'hidden_suggest_presets';
const STORAGE_KEY_MODIFIED = 'modified_suggest_presets';
const STORAGE_KEY_ENGINE_ORDER = 'suggest_engine_order';

const PRESETS = [
  { id: 'sug_google', name: 'Google 建议', url: 'https://suggestqueries.google.com/complete/search?client=chrome&q={query}&callback={callback}', parser: 'generic_array' },
  { id: 'sug_baidu', name: '百度建议', url: 'https://www.baidu.com/sugrec?prod=pc&wd={query}&cb={callback}', parser: 'baidu' },
  { id: 'sug_bing', name: 'Bing 建议', url: 'https://api.bing.com/osjson.aspx?query={query}&JsonType=callback&JsonCallback={callback}', parser: 'generic_array' },
  { id: 'sug_ddg', name: 'DuckDuckGo 建议', url: 'https://duckduckgo.com/ac/?q={query}&callback={callback}', parser: 'ddg' },
  { id: 'sug_sogou', name: '搜狗建议', url: 'https://www.sogou.com/suggnew/ajajjson?type=web&key={query}&callback={callback}', parser: 'sogou' },
  { id: 'none', name: '无建议 (关闭)', url: '', parser: 'none' },
];

const manager = createSourceManager(PRESETS, { defaultId: 'sug_google', idPrefix: 'usug_' });

const saved = getFromStorage(STORAGE_KEY, {});
manager.init({
  currentId: saved.currentSourceId || 'sug_google',
  customSources: saved.customSources || [],
  hiddenPresets: getFromStorage(STORAGE_KEY_HIDDEN, []),
  modifiedPresets: getFromStorage(STORAGE_KEY_MODIFIED, {}),
  engineOrder: getFromStorage(STORAGE_KEY_ENGINE_ORDER, {}),
}, (state) => {
  setToStorage(STORAGE_KEY, { currentSourceId: state.currentId, customSources: state.customSources });
  setToStorage(STORAGE_KEY_HIDDEN, state.hiddenPresets);
  setToStorage(STORAGE_KEY_MODIFIED, state.modifiedPresets);
  setToStorage(STORAGE_KEY_ENGINE_ORDER, state.engineOrder);
});

export const getAllSources = () => manager.getAllSources();
export const getCurrentSource = () => manager.getCurrentSource();
export const getCurrentSourceId = () => manager.getCurrentSourceId();
export const setCurrentSource = (id) => manager.setCurrentSource(id);
export const addCustomSource = (src) => manager.addCustomSource(src);
export const removeCustomSource = (id) => manager.removeCustomSource(id);
export const updateCustomSource = (id, data) => manager.updateCustomSource(id, data);
export const modifyPreset = (id, data) => manager.modifyPreset(id, data);
export const hidePreset = (id) => manager.hidePreset(id);
export const resetSuggestPresets = () => manager.resetPresets();
export const isPresetSource = (id) => manager.isPresetSource(id);
export const reorderEngines = (orderedIds) => manager.reorderEngines(orderedIds);
export const getEngineOrder = () => manager.getEngineOrder();
export const getCustomSources = () => manager.getCustomSources();
