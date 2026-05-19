export function createSourceManager(presets, { defaultId, idPrefix = 'custom_' }) {
  const state = {
    currentId: defaultId,
    customSources: [],
    hiddenPresets: [],
    modifiedPresets: {},
  };

  let onSave = null;

  function init(initial, saveCallback) {
    if (initial) {
      state.currentId = initial.currentId || defaultId;
      state.customSources = initial.customSources || [];
      state.hiddenPresets = initial.hiddenPresets || [];
      state.modifiedPresets = initial.modifiedPresets || {};
    }
    onSave = saveCallback;
  }

  function save() {
    if (onSave) onSave({
      currentId: state.currentId,
      customSources: state.customSources,
      hiddenPresets: state.hiddenPresets,
      modifiedPresets: state.modifiedPresets,
    });
  }

  function getAllSources() {
    const visible = presets
      .filter(p => !state.hiddenPresets.includes(p.id))
      .map(p => state.modifiedPresets[p.id] ? { ...p, ...state.modifiedPresets[p.id] } : p);
    return [...visible, ...state.customSources];
  }

  function getCurrentSource() {
    return getAllSources().find(s => s.id === state.currentId) || getAllSources()[0] || presets[0];
  }

  function getCurrentSourceId() { return state.currentId; }

  function setCurrentSource(id) { state.currentId = id; save(); }

  function addCustomSource(src) {
    src.id = idPrefix + Date.now();
    state.customSources.push(src);
    save();
  }

  function removeCustomSource(id) {
    state.customSources = state.customSources.filter(s => s.id !== id);
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
    state.modifiedPresets[id] = data;
    save();
  }

  function hidePreset(id) {
    if (!state.hiddenPresets.includes(id)) {
      state.hiddenPresets.push(id);
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

  function getCustomSources() { return state.customSources; }
  function getHiddenPresets() { return [...state.hiddenPresets]; }
  function getModifiedPresets() { return { ...state.modifiedPresets }; }
  function getRawState() { return { ...state }; }

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
    getCustomSources,
    getHiddenPresets,
    getModifiedPresets,
    getRawState,
  };
}
