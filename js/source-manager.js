export function createSourceManager(presets, { defaultId, idPrefix = 'custom_' }) {
  const state = {
    currentId: defaultId,
    customSources: [],
    hiddenPresets: [],
    modifiedPresets: {},
    engineOrder: {},
  };

  let onSave = null;
  let idCounter = 0;

  function init(initial, saveCallback) {
    if (initial) {
      state.currentId = initial.currentId ?? defaultId;
      state.customSources = initial.customSources || [];
      state.hiddenPresets = initial.hiddenPresets || [];
      state.modifiedPresets = initial.modifiedPresets || {};
      state.engineOrder = initial.engineOrder || {};
    }
    onSave = saveCallback;
  }

  function save() {
    if (onSave) onSave({
      currentId: state.currentId,
      customSources: state.customSources,
      hiddenPresets: state.hiddenPresets,
      modifiedPresets: state.modifiedPresets,
      engineOrder: state.engineOrder,
    });
  }

  function getAllSources() {
    const visible = presets
      .filter(p => !state.hiddenPresets.includes(p.id))
      .map(p => state.modifiedPresets[p.id] ? { ...p, ...state.modifiedPresets[p.id] } : p);
    const all = [...visible, ...state.customSources];
    all.sort((a, b) => {
      const oa = state.engineOrder[a.id] ?? 9999;
      const ob = state.engineOrder[b.id] ?? 9999;
      return oa - ob;
    });
    return all;
  }

  function getCurrentSource() {
    return getAllSources().find(s => s.id === state.currentId) || getAllSources()[0] || presets[0];
  }

  function getCurrentSourceId() { return state.currentId; }

  function setCurrentSource(id) {
    if (!getAllSources().some(s => s.id === id)) return;
    state.currentId = id; save();
  }

  function addCustomSource(src) {
    src.id = idPrefix + Date.now() + '_' + (++idCounter);
    const maxOrder = Object.keys(state.engineOrder).length
      ? Math.max(...Object.values(state.engineOrder))
      : -1;
    state.engineOrder[src.id] = maxOrder + 1;
    state.customSources.push(src);
    save();
  }

  function reorderEngines(orderedIds) {
    orderedIds.forEach((id, idx) => { state.engineOrder[id] = idx; });
    save();
  }

  function getEngineOrder() { return { ...state.engineOrder }; }

  function removeCustomSource(id) {
    state.customSources = state.customSources.filter(s => s.id !== id);
    delete state.engineOrder[id];
    if (state.currentId === id) {
      const sources = getAllSources();
      state.currentId = sources[0]?.id || defaultId;
    }
    save();
  }

  function updateCustomSource(id, data) {
    const idx = state.customSources.findIndex(s => s.id === id);
    if (idx !== -1) {
      state.customSources[idx] = { ...state.customSources[idx], ...data };
      save();
    }
  }

  function modifyPreset(id, data) {
    state.modifiedPresets[id] = { ...data };
    save();
  }

  function hidePreset(id) {
    if (!state.hiddenPresets.includes(id)) {
      state.hiddenPresets.push(id);
      if (state.currentId === id) {
        const sources = getAllSources();
        state.currentId = sources.find(s => s.id !== id)?.id || defaultId;
      }
      save();
    }
  }

  function resetPresets() {
    state.hiddenPresets = [];
    state.modifiedPresets = {};
    save();
  }

  function isPresetSource(id) {
    return presets.some(s => s.id === id);
  }

  function getCustomSources() { return [...state.customSources]; }
  function getHiddenPresets() { return [...state.hiddenPresets]; }
  function getModifiedPresets() { return { ...state.modifiedPresets }; }

  return {
    init,
    getAllSources,
    getCurrentSource,
    getCurrentSourceId,
    setCurrentSource,
    addCustomSource,
    removeCustomSource,
    updateCustomSource,
    modifyPreset,
    hidePreset,
    resetPresets,
    isPresetSource,
    reorderEngines,
    getEngineOrder,
    getCustomSources,
    getHiddenPresets,
    getModifiedPresets,
  };
}
