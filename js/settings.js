import { createElement } from './utils.js';
import { getCurrentSource, setCurrentSource, getAllSources, addCustomSource, removeCustomSource, updateCustomSource, isPresetSource, modifyPreset, hidePreset } from './search-sources.js';
import { getAllSources as getAllSuggestSources, getCurrentSourceId, setCurrentSource as setCurrentSuggest, addCustomSource as addCustomSuggest, removeCustomSource as removeCustomSuggest, updateCustomSource as updateCustomSuggest, isPresetSource as isSuggestPreset, modifyPreset as modifySuggestPreset, hidePreset as hideSuggestPreset } from './suggest-sources.js';
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
      createElement('span', { className: 'version-info' }, 'v0.5++ (引擎管理增强)'),
    ]),
    createElement('button', { className: 'close-btn', onclick: closeSettings }, '\u2715'),
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

// ===================== 搜索引擎 =====================
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

    actions.appendChild(createElement('button', { className: 'btn-small', onclick: () => {
      if (isPresetSource(src.id)) {
        showPresetEditForm(src, container);
      } else {
        showEditForm(src, container);
      }
    } }, '\u270e'));

    if (src.id !== current.id) {
      actions.appendChild(createElement('button', { className: 'btn-small btn-delete', onclick: () => {
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
      } }, '\u2715'));
    } else {
      actions.appendChild(createElement('span', { style: { fontSize: '12px', color: 'var(--color-text-secondary)', padding: '2px 4px' } }, '当前'));
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
    const data = { name, url, iconType: icon ? 'url' : 'text', iconValue: name.charAt(0), iconUrl: icon || undefined, iconBg: '#6c757d', iconColor: '#fff' };
    updateCustomSource(src.id, data);
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

function showPresetEditForm(src, container) {
  container.innerHTML = '';
  const form = createElement('div', { className: 'source-form' });
  const nameInp = createElement('input', { type: 'text', value: src.name });
  const urlInp = createElement('input', { type: 'text', value: src.url });
  const iconInp = createElement('input', { type: 'text', value: src.iconUrl || '' });
  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), icon = iconInp.value.trim();
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('需含{query}');
    const data = { name, url, iconType: icon ? 'url' : 'text', iconValue: name.charAt(0), iconUrl: icon || undefined, iconBg: '#6c757d', iconColor: '#fff' };
    modifyPreset(src.id, data);
    document.dispatchEvent(new CustomEvent('source-changed'));
    renderEngines(container);
  };
  form.append(createElement('label', {}, '名称'), nameInp, createElement('label', {}, 'URL'), urlInp, createElement('label', {}, '图标URL'), iconInp);
  form.appendChild(createElement('p', { style: { fontSize: '12px', color: 'var(--color-text-secondary)' } }, '修改预设引擎将保存为本地自定义数据，可通过"恢复默认"撤销。'));
  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
    createElement('button', { className: 'btn-cancel', onclick: () => renderEngines(container) }, '取消'),
  ]));
  container.appendChild(form);
}

// ===================== 搜索建议源 =====================
function renderSuggestTab(container) {
  container.innerHTML = '';
  const sources = getAllSuggestSources(), curId = getCurrentSourceId();

  container.appendChild(createElement('div', { className: 'setting-section-header' }, [
    createElement('h3', {}, '搜索建议源'),
    createElement('span', { className: 'setting-section-desc' }, '选择搜索时获取建议的来源，点击卡片切换'),
  ]));

  const list = createElement('div', { className: 'suggest-list' });
  sources.forEach(src => {
    const isActive = src.id === curId;

    const card = createElement('div', {
      className: 'suggest-item' + (isActive ? ' active' : ''),
      onclick: () => {
        if (!isActive) {
          setCurrentSuggest(src.id);
          renderSuggestTab(container);
        }
      }
    });

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
          showPresetSuggestEditForm(src, container);
        } else {
          showEditSuggestForm(src, container);
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

    card.append(indicator, body, actions);
    list.appendChild(card);
  });
  container.appendChild(list);

  const actionsRow = createElement('div', { className: 'suggest-actions-row' });
  actionsRow.appendChild(createElement('button', {
    className: 'btn-add-source',
    onclick: () => showAddSuggestForm(container)
  }, '+ 添加自定义建议源'));
  container.appendChild(actionsRow);
}

function showAddSuggestForm(container) {
  container.innerHTML = '';

  container.appendChild(createElement('div', { className: 'source-form-header' }, [
    createElement('button', { className: 'btn-icon', onclick: () => renderSuggestTab(container) }, '\u2190'),
    createElement('h4', {}, '添加自定义建议源'),
  ]));

  const form = createElement('div', { className: 'source-form' });

  const nameField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '名称'),
  ]);
  const nameInp = createElement('input', { type: 'text', placeholder: '例如：我的搜索建议' });
  nameField.appendChild(nameInp);

  const urlField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '接口 URL'),
  ]);
  const urlInp = createElement('input', { type: 'text', placeholder: 'https://example.com/suggest?q={query}&cb={callback}' });
  urlField.appendChild(urlInp);

  const parserField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '解析器'),
  ]);
  const parserSel = createElement('select', {}, [
    createElement('option', { value: 'generic_array' }, '通用 (generic_array)'),
    createElement('option', { value: 'baidu' }, '百度 (baidu)'),
    createElement('option', { value: 'ddg' }, 'DuckDuckGo (ddg)'),
    createElement('option', { value: 'string_array' }, '纯字符串数组 (string_array)'),
  ]);
  parserField.appendChild(parserSel);

  form.append(nameField, urlField, parserField);
  form.appendChild(createElement('p', { className: 'form-hint' }, 'URL 中需包含 {query} 和 {callback} 占位符。{query} 被替换为搜索词，{callback} 被替换为 JSONP 回调函数名。'));

  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), parser = parserSel.value;
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('URL 需包含 {query} 占位符');
    if (!url.includes('{callback}') && parser !== 'none') return alert('URL 需包含 {callback} 占位符');
    addCustomSuggest({ name, url, parser });
    renderSuggestTab(container);
  };

  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-cancel', onclick: () => renderSuggestTab(container) }, '取消'),
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
  ]));

  container.appendChild(form);
}

function showEditSuggestForm(src, container) {
  container.innerHTML = '';

  container.appendChild(createElement('div', { className: 'source-form-header' }, [
    createElement('button', { className: 'btn-icon', onclick: () => renderSuggestTab(container) }, '\u2190'),
    createElement('h4', {}, '编辑自定义建议源'),
  ]));

  const form = createElement('div', { className: 'source-form' });

  const nameField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '名称'),
  ]);
  const nameInp = createElement('input', { type: 'text', value: src.name });
  nameField.appendChild(nameInp);

  const urlField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '接口 URL'),
  ]);
  const urlInp = createElement('input', { type: 'text', value: src.url });
  urlField.appendChild(urlInp);

  const parserField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '解析器'),
  ]);
  const parserSel = createElement('select', {}, [
    createElement('option', { value: 'generic_array', selected: src.parser === 'generic_array' }, '通用 (generic_array)'),
    createElement('option', { value: 'baidu', selected: src.parser === 'baidu' }, '百度 (baidu)'),
    createElement('option', { value: 'ddg', selected: src.parser === 'ddg' }, 'DuckDuckGo (ddg)'),
    createElement('option', { value: 'string_array', selected: src.parser === 'string_array' }, '纯字符串数组 (string_array)'),
  ]);
  parserField.appendChild(parserSel);

  form.append(nameField, urlField, parserField);

  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), parser = parserSel.value;
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('URL 需包含 {query} 占位符');
    if (!url.includes('{callback}') && parser !== 'none') return alert('URL 需包含 {callback} 占位符');
    updateCustomSuggest(src.id, { name, url, parser });
    renderSuggestTab(container);
  };

  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-cancel', onclick: () => renderSuggestTab(container) }, '取消'),
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
  ]));

  container.appendChild(form);
}

function showPresetSuggestEditForm(src, container) {
  container.innerHTML = '';

  container.appendChild(createElement('div', { className: 'source-form-header' }, [
    createElement('button', { className: 'btn-icon', onclick: () => renderSuggestTab(container) }, '\u2190'),
    createElement('h4', {}, '编辑预设建议源'),
  ]));

  const form = createElement('div', { className: 'source-form' });

  const nameField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '名称'),
  ]);
  const nameInp = createElement('input', { type: 'text', value: src.name });
  nameField.appendChild(nameInp);

  const urlField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '接口 URL'),
  ]);
  const urlInp = createElement('input', { type: 'text', value: src.url });
  urlField.appendChild(urlInp);

  const parserField = createElement('div', { className: 'form-field' }, [
    createElement('span', { className: 'form-field-label' }, '解析器'),
  ]);
  const parserSel = createElement('select', {}, [
    createElement('option', { value: 'generic_array', selected: src.parser === 'generic_array' }, '通用 (generic_array)'),
    createElement('option', { value: 'baidu', selected: src.parser === 'baidu' }, '百度 (baidu)'),
    createElement('option', { value: 'ddg', selected: src.parser === 'ddg' }, 'DuckDuckGo (ddg)'),
    createElement('option', { value: 'string_array', selected: src.parser === 'string_array' }, '纯字符串数组 (string_array)'),
  ]);
  parserField.appendChild(parserSel);

  form.append(nameField, urlField, parserField);
  form.appendChild(createElement('p', { className: 'form-hint' }, '修改预设建议源将保存为本地数据，可通过"恢复所有预设"撤销。'));

  const save = () => {
    const name = nameInp.value.trim(), url = urlInp.value.trim(), parser = parserSel.value;
    if (!name || !url) return alert('名称和URL必填');
    if (!url.includes('{query}')) return alert('URL 需包含 {query} 占位符');
    if (!url.includes('{callback}') && parser !== 'none') return alert('URL 需包含 {callback} 占位符');
    modifySuggestPreset(src.id, { name, url, parser });
    renderSuggestTab(container);
  };

  form.appendChild(createElement('div', { className: 'form-actions' }, [
    createElement('button', { className: 'btn-cancel', onclick: () => renderSuggestTab(container) }, '取消'),
    createElement('button', { className: 'btn-save', onclick: save }, '保存'),
  ]));

  container.appendChild(form);
}
