import { createElement } from './utils.js';
import { getCurrentSource, setCurrentSource, getAllSources, addCustomSource, removeCustomSource, updateCustomSource, isPresetSource } from './search-sources.js';
import { getAllSources as getAllSuggestSources, getCurrentSourceId, setCurrentSource as setCurrentSuggest, addCustomSource as addCustomSuggest, removeCustomSource as removeCustomSuggest, getCustomSources as getCustomSuggestSources } from './suggest-sources.js';
import { renderWallpaperTab } from './wallpaper.js';
import { renderSyncTab } from './sync.js';

let panelEl, overlayEl, isOpen = false;

export function initSettings() {
  panelEl = document.getElementById('settingsPanel');
  overlayEl = document.getElementById('settingsOverlay');
  const triggerBtn = document.getElementById('settingsTrigger');
  triggerBtn?.addEventListener('click', () => openSettings());
  overlayEl?.addEventListener('click', closeSettings);
  document.addEventListener('open-settings', (e) => openSettings(e.detail?.tab));
}

function openSettings(tab = 'general') {
  if (isOpen) return;
  document.dispatchEvent(new CustomEvent('close-all-panels', { detail: { source: 'settings' } }));
  isOpen = true;
  renderPanel(tab);
  panelEl.classList.add('open');
  overlayEl.classList.add('open');
}

function closeSettings() {
  if (!isOpen) return;
  isOpen = false;
  panelEl.classList.remove('open');
  overlayEl.classList.remove('open');
}

document.addEventListener('close-all-panels', (e) => {
  if (e.detail?.source !== 'settings') closeSettings();
});

function applyTheme(theme) {
  const isDark = theme === 'auto' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function renderPanel(tab) {
  panelEl.innerHTML = '';
  const header = createElement('div', { className: 'settings-header' }, [
    createElement('div', { className: 'title-group' }, [
      createElement('h2', { className: 'settings-title' }, '设置'),
      createElement('span', { className: 'version-info' }, 'v0.5 (同步版)'),
    ]),
    createElement('button', { className: 'close-btn', onclick: closeSettings }, '✕'),
  ]);
  const tabs = createElement('div', { className: 'settings-tabs' });
  [['general','常规'], ['engines','搜索引擎'], ['wallpaper','壁纸'], ['suggest','搜索建议'], ['sync','同步']].forEach(([key, label]) => {
    tabs.appendChild(createElement('button', { className: `tab-btn ${tab === key ? 'active' : ''}`, onclick: () => renderPanel(key) }, label));
  });
  const content = createElement('div', { className: 'settings-content' });
  panelEl.append(header, tabs, content);
  if (tab === 'general') renderGeneral(content);
  else if (tab === 'engines') renderEngines(content);
  else if (tab === 'wallpaper') renderWallpaperTab(content);
  else if (tab === 'suggest') renderSuggestTab(content);
  else if (tab === 'sync') renderSyncTab(content);
}

function renderGeneral(container) {
  container.innerHTML = '';
  const themeSec = createElement('div', { className: 'setting-section' }, [createElement('label', {}, '主题')]);
  const select = createElement('select', { onchange: (e) => { applyTheme(e.target.value); localStorage.setItem('theme', e.target.value); } }, [
    createElement('option', { value: 'light' }, '浅色'),
    createElement('option', { value: 'dark' }, '深色'),
    createElement('option', { value: 'auto' }, '跟随系统'),
  ]);
  select.value = localStorage.getItem('theme') || 'light';
  themeSec.appendChild(select);
  const expandSec = createElement('div', { className: 'setting-section' }, [createElement('label', {}, '默认展开扩展区')]);
  const cb = createElement('input', { type: 'checkbox', onchange: (e) => localStorage.setItem('defaultExpand', e.target.checked) });
  cb.checked = localStorage.getItem('defaultExpand') === 'true';
  expandSec.appendChild(cb);
  container.append(themeSec, expandSec);
}

function renderEngines(container) {
  container.innerHTML = '';
  const sources = getAllSources(), current = getCurrentSource();
  const list = createElement('ul', { className: 'engine-list' });
  sources.forEach(src => {
    const li = createElement('li', { className: 'engine-item' });
    const info = createElement('div', { className: 'engine-info' }, [
      createElement('span', { className: 'engine-name' }, src.name),
      createElement('span', { className: 'engine-url-preview' }, src.url.substring(0,50)+'...'),
    ]);
    const actions = createElement('div', { className: 'engine-actions' });
    if (src.id !== current.id) {
      actions.appendChild(createElement('button', { className: 'btn-small', onclick: () => { setCurrentSource(src.id); document.dispatchEvent(new CustomEvent('source-changed')); renderEngines(container); } }, '设为默认'));
    } else {
      actions.appendChild(createElement('span', { className: 'current-badge' }, '当前'));
    }
    if (!isPresetSource(src.id)) {
      actions.appendChild(createElement('button', { className: 'btn-small btn-delete', onclick: () => { if(confirm('确定删除？')) { if(src.id===current.id) { const first = sources.find(s=>isPresetSource(s.id)); if(first) setCurrentSource(first.id); } removeCustomSource(src.id); document.dispatchEvent(new CustomEvent('source-changed')); renderEngines(container); } } }, '删除'));
      actions.appendChild(createElement('button', { className: 'btn-small', onclick: () => showEditForm(src, container) }, '编辑'));
    }
    li.append(info, actions);
    list.appendChild(li);
  });
  container.appendChild(list);
  container.appendChild(createElement('button', { className: 'btn-add-source', onclick: () => showAddForm(container) }, '+ 添加搜索引擎'));
}

function showAddForm(container) {
  container.innerHTML = '';
  const form = createElement('div', { className: 'source-form' });
  const nameInp = createElement('input', { type: 'text', placeholder: '名称' });
  const urlInp = createElement('input', { type: 'text', placeholder: '搜索URL（{query}占位符）' });
  const iconInp = createElement('input', { type: 'text', placeholder: '图标URL（可选）' });
  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), icon = iconInp.value.trim();
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('需含{query}');
    addCustomSource({ name, url, iconType: icon ? 'url' : 'text', iconValue: name.charAt(0), iconUrl: icon || undefined, iconBg: '#6c757d', iconColor: '#fff' });
    document.dispatchEvent(new CustomEvent('source-changed'));
    renderEngines(container);
  };
  form.append(createElement('label', {}, '名称'), nameInp, createElement('label', {}, 'URL'), urlInp, createElement('label', {}, '图标URL'), iconInp);
  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
    createElement('button', { className: 'btn-cancel', onclick: () => renderEngines(container) }, '取消'),
  ]));
  container.appendChild(form);
}

function showEditForm(src, container) {
  container.innerHTML = '';
  const form = createElement('div', { className: 'source-form' });
  const nameInp = createElement('input', { type: 'text', value: src.name });
  const urlInp = createElement('input', { type: 'text', value: src.url });
  const iconInp = createElement('input', { type: 'text', value: src.iconUrl || '' });
  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), icon = iconInp.value.trim();
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('需含{query}');
    updateCustomSource(src.id, { name, url, iconType: icon ? 'url' : 'text', iconValue: name.charAt(0), iconUrl: icon || undefined, iconBg: '#6c757d', iconColor: '#fff' });
    document.dispatchEvent(new CustomEvent('source-changed'));
    renderEngines(container);
  };
  form.append(createElement('label', {}, '名称'), nameInp, createElement('label', {}, 'URL'), urlInp, createElement('label', {}, '图标URL'), iconInp);
  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
    createElement('button', { className: 'btn-cancel', onclick: () => renderEngines(container) }, '取消'),
  ]));
  container.appendChild(form);
}

function renderSuggestTab(container) {
  container.innerHTML = '';
  const sources = getAllSuggestSources(), curId = getCurrentSourceId();
  container.appendChild(createElement('h3', {}, '当前建议源'));
  const select = createElement('select', { onchange: (e) => { setCurrentSuggest(e.target.value); renderSuggestTab(container); } });
  sources.forEach(s => select.appendChild(createElement('option', { value: s.id, selected: s.id === curId }, s.name)));
  container.appendChild(select);
  container.appendChild(createElement('h3', {}, '自定义源'));
  const custom = getCustomSuggestSources();
  const list = createElement('ul', { className: 'engine-list' });
  if (!custom.length) list.appendChild(createElement('li', {}, '暂无'));
  else custom.forEach(src => {
    const li = createElement('li', { className: 'engine-item' });
    li.append(
      createElement('div', { className: 'engine-info' }, [
        createElement('span', { className: 'engine-name' }, src.name),
        createElement('span', { className: 'engine-url-preview' }, (src.url||'').substring(0,50)+'...')
      ]),
      createElement('div', { className: 'engine-actions' }, [
        ...(src.id !== curId ? [createElement('button', { className: 'btn-small', onclick: () => { setCurrentSuggest(src.id); renderSuggestTab(container); } }, '设为当前')] : [createElement('span', { className: 'current-badge' }, '当前')]),
        createElement('button', { className: 'btn-small btn-delete', onclick: () => { if(confirm('确定删除？')) { removeCustomSuggest(src.id); renderSuggestTab(container); } } }, '删除')
      ])
    );
    list.appendChild(li);
  });
  container.append(list, createElement('button', { className: 'btn-add-source', onclick: () => showAddSuggestForm(container) }, '+ 添加自定义建议源'));
}

function showAddSuggestForm(container) {
  container.innerHTML = '';
  const form = createElement('div', { className: 'source-form' });
  const nameInp = createElement('input', { type: 'text', placeholder: '名称' });
  const urlInp = createElement('input', { type: 'text', placeholder: '接口URL（{query}和{callback}）' });
  const parserSel = createElement('select', {}, [
    createElement('option', { value: 'generic_array' }, '通用'),
    createElement('option', { value: 'baidu' }, '百度'),
    createElement('option', { value: 'ddg' }, 'DuckDuckGo'),
    createElement('option', { value: 'string_array' }, '纯字符串数组'),
  ]);
  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), parser = parserSel.value;
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('需含{query}');
    if (!url.includes('{callback}') && parser !== 'none') return alert('需含{callback}');
    addCustomSuggest({ name, url, parser });
    renderSuggestTab(container);
  };
  form.append(createElement('label', {}, '名称'), nameInp, createElement('label', {}, 'URL'), urlInp, createElement('label', {}, '解析器'), parserSel);
  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
    createElement('button', { className: 'btn-cancel', onclick: () => renderSuggestTab(container) }, '取消'),
  ]));
  container.appendChild(form);
}
