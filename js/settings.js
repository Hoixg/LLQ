import { createElement, getFromStorage, setToStorage } from './utils.js';
import { getCurrentSource, setCurrentSource, getAllSources, addCustomSource, removeCustomSource, updateCustomSource, isPresetSource, modifyPreset, hidePreset, reorderEngines, getSourcesByTrack, getCurrentTrack } from './search-sources.js';
import { getAllSources as getAllSuggestSources, getCurrentSourceId, setCurrentSource as setCurrentSuggest, addCustomSource as addCustomSuggest, removeCustomSource as removeCustomSuggest, updateCustomSource as updateCustomSuggest, isPresetSource as isSuggestPreset, modifyPreset as modifySuggestPreset, hidePreset as hideSuggestPreset, reorderEngines as reorderSuggestEngines } from './suggest-sources.js';
import { renderWallpaperTab } from './wallpaper.js';
import { renderSyncTab } from './sync.js';

let panelEl, overlayEl, contentEl, isOpen = false, closeTimer = null;
let currentTab = 'general';
const TAB_DEFS = [['general','常规'], ['engines','搜索引擎'], ['wallpaper','壁纸'], ['suggest','搜索建议'], ['sync','同步']];

export function initSettings() {
  panelEl = document.getElementById('settingsPanel');
  overlayEl = document.getElementById('settingsOverlay');
  buildPanelShell();
  prewarmPanel();
  const triggerBtn = document.getElementById('settingsTrigger');
  triggerBtn?.addEventListener('click', () => openSettings());
  overlayEl?.addEventListener('click', closeSettings);
  document.addEventListener('open-settings', (e) => openSettings(e.detail?.tab));
}

function prewarmPanel() {
  renderContent('general');
  panelEl.style.willChange = 'backdrop-filter';
  panelEl.style.transition = 'none';
  panelEl.style.opacity = '0.001';
  panelEl.classList.add('open');
  panelEl.getBoundingClientRect();
  panelEl.classList.remove('open');
  panelEl.style.transition = '';
  panelEl.style.opacity = '';
  panelEl.style.willChange = '';
  currentTab = 'general';
}

function buildPanelShell() {
  panelEl.textContent = '';
  const header = createElement('div', { className: 'settings-header' }, [
    createElement('div', { className: 'title-group' }, [
      createElement('h2', { className: 'settings-title' }, '设置'),
      createElement('span', { className: 'version-info' }, 'v0.75 (动画丝滑)'),
    ]),
    createElement('button', { className: 'close-btn', onclick: closeSettings }, '\u2715'),
  ]);
  const tabs = createElement('div', { className: 'settings-tabs' });
  TAB_DEFS.forEach(([key, label]) => {
    tabs.appendChild(createElement('button', {
      className: 'tab-btn',
      onclick: () => switchTab(key),
    }, label));
  });
  contentEl = createElement('div', { className: 'settings-content' });
  panelEl.append(header, tabs, contentEl);
}

function openSettings(tab = 'general') {
  if (isOpen) return;
  clearTimeout(closeTimer);
  panelEl.classList.remove('closing');
  overlayEl.classList.remove('closing');
  document.dispatchEvent(new CustomEvent('close-all-panels', { detail: { source: 'settings' } }));
  isOpen = true;
  if (currentTab !== tab || !contentEl.firstChild) {
    renderContent(tab);
  }
  setActiveTab(tab);
  panelEl.style.willChange = 'transform, opacity';
  overlayEl.style.willChange = 'opacity';
  panelEl.getBoundingClientRect();
  requestAnimationFrame(() => {
    panelEl.classList.add('open');
    overlayEl.classList.add('open');
  });
}

function closeSettings() {
  if (!isOpen) return;
  isOpen = false;
  panelEl.classList.add('closing');
  overlayEl.classList.add('closing');
  closeTimer = setTimeout(() => {
    closeTimer = null;
    panelEl.classList.remove('open', 'closing');
    overlayEl.classList.remove('open', 'closing');
    panelEl.style.willChange = '';
    overlayEl.style.willChange = '';
  }, 250);
}

document.addEventListener('close-all-panels', (e) => {
  if (e.detail?.source !== 'settings') closeSettings();
});

function switchTab(tab) {
  setActiveTab(tab);
  renderContent(tab);
}

function setActiveTab(tab) {
  currentTab = tab;
  const btns = panelEl.querySelectorAll('.tab-btn');
  btns.forEach((btn, i) => {
    btn.classList.toggle('active', TAB_DEFS[i][0] === tab);
  });
}

function renderContent(tab) {
  const next = document.createElement('div');
  next.className = 'settings-content';
  if (tab === 'general') renderGeneral(next);
  else if (tab === 'engines') renderEngines(next);
  else if (tab === 'wallpaper') renderWallpaperTab(next);
  else if (tab === 'suggest') renderSuggestTab(next);
  else if (tab === 'sync') renderSyncTab(next);
  contentEl.replaceWith(next);
  contentEl = next;
}

function renderGeneral(container) {
  const theme = getFromStorage('themeStyle', 'blue');
  const ui = getFromStorage('uiStyle', 'default');
  const expand = getFromStorage('defaultExpand', false);
  const searchStyle = getFromStorage('searchBarStyle', 'pill');
  const themeOpts = Object.entries(THEME_STYLES).map(([v, l]) =>
    `<option value="${v}" ${v === theme ? 'selected' : ''}>${l}</option>`
  ).join('');
  const uiOpts = Object.entries(UI_STYLES).map(([v, l]) =>
    `<option value="${v}" ${v === ui ? 'selected' : ''}>${l}</option>`
  ).join('');
  const searchOpts = Object.entries(SEARCH_BAR_STYLES).map(([v, l]) =>
    `<option value="${v}" ${v === searchStyle ? 'selected' : ''}>${l}</option>`
  ).join('');
  container.innerHTML = `
    <div class="setting-section"><label>主题风格</label><select id="set-theme">${themeOpts}</select></div>
    <div class="setting-section"><label>UI 风格</label><select id="set-ui">${uiOpts}</select></div>
    <div class="setting-section"><label>默认展开扩展区</label><input type="checkbox" id="set-expand" ${expand ? 'checked' : ''}></div>
    <div class="setting-section"><label>搜索框风格</label><select id="set-search">${searchOpts}</select></div>
  `;

  container.querySelector('#set-theme').onchange = e => { setToStorage('themeStyle', e.target.value); applyThemeStyle(e.target.value); };
  container.querySelector('#set-ui').onchange = e => { setToStorage('uiStyle', e.target.value); applyUIStyle(e.target.value); };
  container.querySelector('#set-expand').onchange = e => { setToStorage('defaultExpand', e.target.checked); };
  container.querySelector('#set-search').onchange = e => { setToStorage('searchBarStyle', e.target.value); applySearchBarStyle(e.target.value); };
}

const UI_STYLES = {
  'default': '默认',
  'glass': '蒙版玻璃',
  'neo': '新拟态',
  'noir': '暗夜无边',
  'line': '极简线框',
  'mint': '柔和渐变',
  'paper': '纸质层叠',
  'frost': '冰霜',
  'ink': '水墨',
  'aurora': '极光',
  'dot': '点阵',
  'switch': '掌机',
};

export function applyUIStyle(style) {
  if (style && style !== 'default') {
    document.documentElement.setAttribute('data-ui-style', style);
  } else {
    document.documentElement.removeAttribute('data-ui-style');
  }
  if (window.__loadUIStyleCSS) window.__loadUIStyleCSS(style || '');
}

const THEME_STYLES = {
  'blue': '经典蓝',
  'forest': '翡翠绿',
  'violet': '紫罗兰',
  'slate': '石墨灰',
};

export function applyThemeStyle(style) {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme-style', style);
}

const SEARCH_BAR_STYLES = {
  pill: '经典胶囊',
  glass: '毛玻璃',
  neon: '霓虹发光',
  dark: '深色浮空',
  outline: '细线框',
  terminal: '终端复古',
  dotted: '虚线圈',
  aurora: '极光渐变',
};

function applySearchBarStyle(style) {
  const searchBox = document.querySelector('.search-box');
  if (!searchBox) return;
  const allStyles = ['style-glass', 'style-neon', 'style-dark', 'style-outline', 'style-terminal', 'style-dotted', 'style-aurora'];
  searchBox.classList.remove(...allStyles);
  if (style && style !== 'pill') {
    searchBox.classList.add('style-' + style);
  }
}

// ===================== 搜索引擎 =====================
const TRACK_NAMES = { engine: '常规搜索', platform: '平台搜索' };

function getCollapseKey(track) { return `settings_collapse_${track}`; }
function isCollapsed(track) { return getFromStorage(getCollapseKey(track), false); }
function setCollapsed(track, v) { setToStorage(getCollapseKey(track), v); }

function renderEngines(container) {
  container.innerHTML = '';
  renderTrackSection(container, 'engine');
  renderTrackSection(container, 'platform');
}

function renderTrackSection(container, track) {
  const label = TRACK_NAMES[track];
  const collapsed = isCollapsed(track);
  const curSource = getCurrentSource();
  const curTrack = getCurrentTrack();

  const header = createElement('div', {
    className: 'section-toggle-header',
    onclick: function() {
      const newCollapsed = !isCollapsed(track);
      setCollapsed(track, newCollapsed);
      const arrow = this.querySelector('.toggle-arrow');
      if (arrow) arrow.classList.toggle('collapsed', newCollapsed);
      const sectionContent = this.nextElementSibling;
      if (sectionContent) sectionContent.classList.toggle('collapsed', newCollapsed);
    },
  }, [
    createElement('span', { className: 'toggle-arrow' + (collapsed ? ' collapsed' : '') }, '\u25bc'),
    createElement('span', { className: 'section-title' }, label),
  ]);

  const content = createElement('div', {
    className: 'track-section-content' + (collapsed ? ' collapsed' : '')
  });
  const inner = createElement('div', { className: 'track-section-inner' });

  const listId = `engineSortList-${track}`;
  const list = createElement('ul', { className: 'engine-list', id: listId });

  const sources = getSourcesByTrack(track);
  sources.forEach(src => {
    const isCurrentSource = curTrack === track && src.id === curSource.id;
    const li = createElement('li', {
      className: 'engine-item',
      draggable: 'true',
      data: { engineId: src.id, engineTrack: track },
    });

    const handle = createElement('span', { className: 'drag-handle', title: '拖拽排序' }, '\u2630');

    const info = createElement('div', { className: 'engine-info' }, [
      createElement('span', { className: 'engine-name' }, src.name),
      createElement('span', { className: 'engine-url-preview' }, src.url.substring(0, 50) + '...'),
    ]);

    const actions = createElement('div', { className: 'engine-actions' });
    if (isCurrentSource) {
      actions.appendChild(createElement('span', { className: 'current-badge' }, '当前'));
    }

    actions.appendChild(createElement('button', {
      className: 'btn-small',
      onclick: () => {
        if (isPresetSource(src.id)) {
          renderEngineForm(container, src, { isPreset: true, track });
        } else {
          renderEngineForm(container, src, { track });
        }
      }
    }, '\u270e'));

    if (!isCurrentSource) {
      actions.appendChild(createElement('button', {
        className: 'btn-small btn-delete',
        onclick: () => {
          if (isPresetSource(src.id)) {
            if (confirm('确定隐藏预设引擎"' + src.name + '"？\n可通过"恢复默认"重新显示。')) {
              hidePreset(src.id);
              document.dispatchEvent(new CustomEvent('source-changed'));
              renderEngines(container);
            }
          } else {
            if (confirm('确定删除自定义引擎"' + src.name + '"？')) {
              removeCustomSource(src.id);
              document.dispatchEvent(new CustomEvent('source-changed'));
              renderEngines(container);
            }
          }
        }
      }, '\u2715'));
    }

    li.append(handle, info, actions);

    li.addEventListener('dragstart', handleEngineDragStart);
    li.addEventListener('dragend', handleEngineDragEnd);
    li.addEventListener('dragover', handleEngineDragOver);
    li.addEventListener('dragleave', handleEngineDragLeave);
    li.addEventListener('drop', (e) => handleEngineDrop(e, container, track));

    list.appendChild(li);
  });

  inner.appendChild(list);
  inner.appendChild(createElement('button', {
    className: 'btn-add-source',
    onclick: () => renderEngineForm(container, null, { isAdd: true, track })
  }, '+ 添加' + label));

  content.appendChild(inner);
  container.appendChild(header);
  container.appendChild(content);
}

let draggedEngineEl = null;

function handleEngineDragStart(e) {
  draggedEngineEl = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.engineId);
}

function handleEngineDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.engine-item.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedEngineEl = null;
}

function handleEngineDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this !== draggedEngineEl) {
    this.classList.add('drag-over');
  }
}

function handleEngineDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleEngineDrop(e, container, track) {
  e.preventDefault();
  e.stopPropagation();
  const target = e.currentTarget;
  target.classList.remove('drag-over');
  if (draggedEngineEl && draggedEngineEl !== target) {
    const listId = `engineSortList-${track}`;
    const items = [...document.querySelectorAll(`#${listId} .engine-item`)];
    const orderedIds = items.map(item => item.dataset.engineId);
    const draggedId = draggedEngineEl.dataset.engineId;
    const targetId = target.dataset.engineId;
    const draggedIdx = orderedIds.indexOf(draggedId);
    orderedIds.splice(draggedIdx, 1);
    let targetIdx = orderedIds.indexOf(targetId);
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIdx = e.clientY < midY ? targetIdx : targetIdx + 1;
    orderedIds.splice(insertIdx, 0, draggedId);
    reorderEngines(orderedIds);
    renderEngines(container);
  }
}

function renderEngineForm(container, src, { isAdd, isPreset, track } = {}) {
  container.innerHTML = '';
  const form = createElement('div', { className: 'source-form' });
  const nameInp = createElement('input', { type: 'text', placeholder: '名称', value: src ? src.name : '' });
  const urlInp = createElement('input', { type: 'text', placeholder: '搜索URL（{query}占位符）', value: src ? src.url : '' });
  const iconInp = createElement('input', { type: 'text', placeholder: '图标URL（可选）', value: (src && src.iconUrl) ? src.iconUrl : '' });

  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), icon = iconInp.value.trim();
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('需含{query}');
    const data = { name, url, track: track || src?.track || 'engine', iconType: icon ? 'url' : 'text', iconValue: name.charAt(0), iconUrl: icon || undefined, iconBg: '#6c757d', iconColor: '#fff' };
    if (isAdd) addCustomSource(data);
    else if (isPreset) modifyPreset(src.id, data);
    else updateCustomSource(src.id, data);
    document.dispatchEvent(new CustomEvent('source-changed'));
    renderEngines(container);
  };

  form.append(
    createElement('label', {}, '名称'), nameInp,
    createElement('label', {}, 'URL'), urlInp,
    createElement('label', {}, '图标URL'), iconInp,
  );
  form.appendChild(createElement('p', { style: { fontSize: '12px', color: 'var(--color-text-secondary)' } }, '提示：在目标网站搜索任意关键词，复制地址栏完整 URL，将搜索词替换为 {query} 即可。'));
  if (isPreset) {
    form.appendChild(createElement('p', { style: { fontSize: '12px', color: 'var(--color-text-secondary)' } }, '修改预设引擎将保存为本地自定义数据，可通过"恢复默认"撤销。'));
  }
  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
    createElement('button', { className: 'btn-cancel', onclick: () => renderEngines(container) }, '取消'),
  ]));
  container.appendChild(form);
}

let draggedSuggestEl = null;

function handleSuggestDragStart(e) {
  draggedSuggestEl = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.suggestId);
}

function handleSuggestDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.suggest-item.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedSuggestEl = null;
}

function handleSuggestDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this !== draggedSuggestEl) {
    this.classList.add('drag-over');
  }
}

function handleSuggestDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleSuggestDrop(e, container) {
  e.preventDefault();
  e.stopPropagation();
  const target = e.currentTarget;
  target.classList.remove('drag-over');
  if (draggedSuggestEl && draggedSuggestEl !== target) {
    const items = [...document.querySelectorAll('#suggestSortList .suggest-item')];
    const orderedIds = items.map(item => item.dataset.suggestId);
    const draggedId = draggedSuggestEl.dataset.suggestId;
    const targetId = target.dataset.suggestId;
    const draggedIdx = orderedIds.indexOf(draggedId);
    orderedIds.splice(draggedIdx, 1);
    let targetIdx = orderedIds.indexOf(targetId);
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIdx = e.clientY < midY ? targetIdx : targetIdx + 1;
    orderedIds.splice(insertIdx, 0, draggedId);
    reorderSuggestEngines(orderedIds);
    renderSuggestTab(container);
  }
}

// ===================== 搜索建议源 =====================
function renderSuggestTab(container) {
  container.innerHTML = '';
  const sources = getAllSuggestSources(), curId = getCurrentSourceId();

  container.appendChild(createElement('div', { className: 'setting-section-header' }, [
    createElement('h3', {}, '搜索建议源'),
    createElement('span', { className: 'setting-section-desc' }, '选择搜索时获取建议的来源，点击卡片切换'),
  ]));

  const list = createElement('div', { className: 'suggest-list', id: 'suggestSortList' });
  sources.forEach(src => {
    const isActive = src.id === curId;

    const card = createElement('div', {
      className: 'suggest-item' + (isActive ? ' active' : ''),
      draggable: 'true',
      data: { suggestId: src.id },
      onclick: () => {
        if (!isActive) {
          setCurrentSuggest(src.id);
          renderSuggestTab(container);
        }
      }
    });

    const handle = createElement('span', { className: 'drag-handle', title: '拖拽排序', onclick: (e) => e.stopPropagation() }, '\u2630');

    const indicator = createElement('span', { className: 'suggest-item-indicator' });
    const body = createElement('div', { className: 'suggest-item-body' }, [
      createElement('span', { className: 'suggest-item-name' }, src.name),
      createElement('span', { className: 'suggest-item-url' }, src.url ? src.url.substring(0, 55) + '\u2026' : '已关闭搜索建议'),
    ]);
    const actions = createElement('div', { className: 'suggest-item-actions' });

    actions.appendChild(createElement('button', {
      className: 'btn-icon',
      title: '编辑',
      onclick: (e) => {
        e.stopPropagation();
        if (isSuggestPreset(src.id)) {
          renderSuggestSourceForm(container, src, { isPreset: true });
        } else {
          renderSuggestSourceForm(container, src, {});
        }
      }
    }, '\u270e'));

    if (!isActive) {
      actions.appendChild(createElement('button', {
        className: 'btn-icon btn-icon-danger',
        title: isSuggestPreset(src.id) ? '隐藏' : '删除',
        onclick: (e) => {
          e.stopPropagation();
          if (isSuggestPreset(src.id)) {
            if (confirm('确定隐藏预设建议源"' + src.name + '"？\n可通过"恢复所有预设"重新显示。')) {
              hideSuggestPreset(src.id);
              renderSuggestTab(container);
            }
          } else {
            if (confirm('确定删除自定义建议源"' + src.name + '"？')) {
              removeCustomSuggest(src.id);
              renderSuggestTab(container);
            }
          }
        }
      }, '\u2715'));
    }

    card.append(handle, indicator, body, actions);

    card.addEventListener('dragstart', handleSuggestDragStart);
    card.addEventListener('dragend', handleSuggestDragEnd);
    card.addEventListener('dragover', handleSuggestDragOver);
    card.addEventListener('dragleave', handleSuggestDragLeave);
    card.addEventListener('drop', (e) => handleSuggestDrop(e, container));

    list.appendChild(card);
  });
  container.appendChild(list);

  const actionsRow = createElement('div', { className: 'suggest-actions-row' });
  actionsRow.appendChild(createElement('button', {
    className: 'btn-add-source',
    onclick: () => renderSuggestSourceForm(container, null, { isAdd: true })
  }, '+ 添加自定义建议源'));
  container.appendChild(actionsRow);
}

function renderSuggestSourceForm(container, src, { isAdd, isPreset } = {}) {
  container.innerHTML = '';

  const title = isAdd ? '添加自定义建议源' : isPreset ? '编辑预设建议源' : '编辑自定义建议源';
  container.appendChild(createElement('div', { className: 'source-form-header' }, [
    createElement('button', { className: 'btn-icon', onclick: () => renderSuggestTab(container) }, '\u2190'),
    createElement('h4', {}, title),
  ]));

  const form = createElement('div', { className: 'source-form' });

  const nameField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '名称'),
  ]);
  const nameInp = createElement('input', { type: 'text', placeholder: '例如：我的搜索建议', value: src ? src.name : '' });
  nameField.appendChild(nameInp);

  const urlField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '接口 URL'),
  ]);
  const urlInp = createElement('input', { type: 'text', placeholder: 'https://example.com/suggest?q={query}&cb={callback}', value: src ? src.url : '' });
  urlField.appendChild(urlInp);

  const parserField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '解析器'),
  ]);
  const parserOptions = [
    { value: 'generic_array', label: '通用 (generic_array)' },
    { value: 'baidu', label: '百度 (baidu)' },
    { value: 'ddg', label: 'DuckDuckGo (ddg)' },
    { value: 'string_array', label: '纯字符串数组 (string_array)' },
  ];
  const parserSel = createElement('select', {}, parserOptions.map(opt =>
    createElement('option', { value: opt.value, selected: src?.parser === opt.value }, opt.label)
  ));
  parserField.appendChild(parserSel);

  form.append(nameField, urlField, parserField);
  form.appendChild(createElement('p', { className: 'form-hint' }, 'URL 中需包含 {query} 占位符。{callback} 为 JSONP 回调占位符（非必填），接口支持 CORS 时优先使用 fetch 获取数据。'));

  if (isPreset) {
    form.appendChild(createElement('p', { className: 'form-hint' }, '修改预设建议源将保存为本地数据，可通过"恢复所有预设"撤销。'));
  }

  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), parser = parserSel.value;
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('URL 需包含 {query} 占位符');
    const data = { name, url, parser };
    if (isAdd) addCustomSuggest(data);
    else if (isPreset) modifySuggestPreset(src.id, data);
    else updateCustomSuggest(src.id, data);
    renderSuggestTab(container);
  };

  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-cancel', onclick: () => renderSuggestTab(container) }, '取消'),
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
  ]));

  container.appendChild(form);
}
