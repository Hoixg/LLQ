import { getFromStorage, setToStorage, createElement } from './utils.js';
import { applyThemeStyle, applyUIStyle } from './settings.js';

const DATA_KEYS = [
  { key: 'custom_sources',        label: '自定义搜索引擎', icon: '🔍' },
  { key: 'current_source_id',     label: '当前默认搜索引擎', icon: '🏷️' },
  { key: 'hidden_presets',        label: '已隐藏的预设引擎', icon: '🚫' },
  { key: 'modified_presets',      label: '已修改的预设引擎', icon: '📝' },
  { key: 'engine_order',          label: '搜索引擎排序', icon: '↕️' },
  { key: 'current_track',         label: '当前搜索轨道', icon: '🔄' },
  { key: 'track_last_source',     label: '轨道最后选中源', icon: '📌' },
  { key: 'suggest_settings',      label: '搜索建议源', icon: '💡' },
  { key: 'hidden_suggest_presets', label: '已隐藏的预设建议源', icon: '🙈' },
  { key: 'modified_suggest_presets', label: '已修改的预设建议源', icon: '📝' },
  { key: 'suggest_engine_order',  label: '建议源排序', icon: '↕️' },
  { key: 'wallpaperSettings',     label: '壁纸设置', icon: '🖼️' },
  { key: 'bookmarks',             label: '收藏夹', icon: '⭐' },
  { key: 'themeStyle',           label: '主题风格', icon: '🎨' },
  { key: 'uiStyle',              label: 'UI 风格', icon: '✨' },
  { key: 'defaultExpand',         label: '默认展开状态', icon: '📂' },
  { key: 'searchBarStyle',        label: '搜索框风格', icon: '🔍' },
  { key: 'layout_expanded',       label: '当前展开状态', icon: '📐' },
  { key: 'webdav_config',         label: 'WebDAV 配置', icon: '☁️' },
  { key: 'gist_config',           label: 'Gist 配置', icon: '🐙' },
  { key: 'sync_log',              label: '同步日志', icon: '📋' },
  { key: 'settings_collapse_engine', label: '引擎区域折叠', icon: '📁' },
  { key: 'settings_collapse_platform', label: '平台区域折叠', icon: '📁' },
];

// ==================== 导出 ====================
function exportConfig(selectedKeys) {
  const data = {};
  selectedKeys.forEach(k => { data[k] = getFromStorage(k); });
  return {
    exportVersion: 1,
    exportTime: new Date().toISOString(),
    data,
  };
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==================== 导入预览&应用 ====================
function previewImportData(jsonStr) {
  let parsed;
  try { parsed = JSON.parse(jsonStr); } catch { throw new Error('JSON 格式无效'); }
  if (!parsed.data || typeof parsed.data !== 'object') throw new Error('不支持的备份格式');

  return Object.keys(parsed.data).map(key => {
    const value = parsed.data[key];
    const meta = DATA_KEYS.find(d => d.key === key) || { label: key, icon: '' };
    let summary = '', expandable = false;
    if (key === 'bookmarks' && value?.categories) {
      summary = `${value.categories.length} 个分区，${value.bookmarks?.length || 0} 条书签`;
      expandable = true;
    } else if (key === 'custom_sources' && Array.isArray(value)) {
      summary = `${value.length} 个引擎`;
      expandable = true;
    } else if (key === 'suggest_settings') {
      const cs = value?.customSources || [];
      summary = `当前源: ${value?.currentSourceId}, ${cs.length} 个自定义源`;
      expandable = true;
    } else if (key === 'wallpaperSettings') {
      summary = `模式: ${value?.mode || '默认'}, 自动切换: ${value?.autoSwitch ? '是' : '否'}`;
    } else if (key === 'themeStyle') {
      summary = value;
    } else if (key === 'uiStyle') {
      summary = value;
    } else if (key === 'current_track') {
      summary = value === 'platform' ? '平台搜索' : '常规搜索';
    } else if (key === 'hidden_presets' && Array.isArray(value)) {
      summary = `${value.length} 个已隐藏`;
    } else if (key === 'hidden_suggest_presets' && Array.isArray(value)) {
      summary = `${value.length} 个已隐藏`;
    } else if (key === 'modified_presets' && typeof value === 'object') {
      summary = `${Object.keys(value).length} 个已修改`;
    } else if (key === 'modified_suggest_presets' && typeof value === 'object') {
      summary = `${Object.keys(value).length} 个已修改`;
    } else if (key === 'webdav_config' && value?.url) {
      summary = value.url;
    } else if (key === 'gist_config' && value?.token) {
      summary = `Gist: ${value.gistId || '自动创建'}`;
    } else {
      summary = JSON.stringify(value).substring(0, 80);
    }
    return { key, label: meta.label, icon: meta.icon, summaryText: summary, expandable, raw: value };
  });
}

function applyImport(selectedKeys, jsonStr) {
  const parsed = JSON.parse(jsonStr);
  selectedKeys.forEach(key => { if (key in parsed.data) setToStorage(key, parsed.data[key]); });
  const engineKeys = ['custom_sources', 'current_source_id', 'hidden_presets', 'modified_presets', 'engine_order', 'current_track', 'track_last_source'];
  if (selectedKeys.some(k => engineKeys.includes(k))) {
    document.dispatchEvent(new CustomEvent('source-changed'));
  }
  if (selectedKeys.includes('wallpaperSettings')) {
    setTimeout(() => document.dispatchEvent(new CustomEvent('wallpaper-update')), 50);
  }
  if (selectedKeys.includes('themeStyle')) {
    const style = getFromStorage('themeStyle', 'blue');
    applyThemeStyle(style);
  }
  if (selectedKeys.includes('uiStyle')) {
    const uiStyle = getFromStorage('uiStyle', 'default');
    applyUIStyle(uiStyle);
  }
  if (selectedKeys.includes('searchBarStyle')) {
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
      const allStyles = ['style-glass', 'style-neon', 'style-dark', 'style-outline', 'style-terminal', 'style-dotted', 'style-aurora'];
      searchBox.classList.remove(...allStyles);
      const style = getFromStorage('searchBarStyle', 'pill');
      if (style && style !== 'pill') searchBox.classList.add('style-' + style);
    }
  }
}

// ==================== 同步日志 ====================
const LOG_KEY = 'sync_log';
function getSyncLogs() { return getFromStorage(LOG_KEY) || []; }
function addSyncLog(entry) {
  const logs = getSyncLogs();
  logs.unshift(entry);
  if (logs.length > 10) logs.length = 10;
  setToStorage(LOG_KEY, logs);
}
function clearSyncLogs() { setToStorage(LOG_KEY, []); }

// ==================== WebDAV ====================
const WEBDAV_KEY = 'webdav_config';
function getWebDAVConfig() {
  return getFromStorage(WEBDAV_KEY) || { url: '', filename: 'homepage-config.json', username: '', password: '' };
}
function saveWebDAVConfig(cfg) { setToStorage(WEBDAV_KEY, cfg); }

async function webdavTest({ url, filename, username, password }) {
  const fullUrl = url.replace(/\/$/, '') + '/' + filename;
  const headers = new Headers();
  if (username && password) headers.append('Authorization', 'Basic ' + btoa(`${username}:${password}`));
  const resp = await fetch(fullUrl, { method: 'GET', headers, signal: AbortSignal.timeout(10000) });
  if (!resp.ok && resp.status !== 401) throw new Error(`HTTP ${resp.status}`);
  return '可达';
}

async function webdavUpload(cfg, jsonStr) {
  const { url, filename, username, password } = cfg;
  const fullUrl = url.replace(/\/$/, '') + '/' + filename;
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (username && password) headers.append('Authorization', 'Basic ' + btoa(`${username}:${password}`));
  const resp = await fetch(fullUrl, { method: 'PUT', headers, body: jsonStr });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
}

async function webdavDownload(cfg) {
  const { url, filename, username, password } = cfg;
  const fullUrl = url.replace(/\/$/, '') + '/' + filename;
  const headers = new Headers();
  if (username && password) headers.append('Authorization', 'Basic ' + btoa(`${username}:${password}`));
  const resp = await fetch(fullUrl, { method: 'GET', headers });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.text();
}

// ==================== GitHub Gist ====================
const GIST_KEY = 'gist_config';
function getGistConfig() { return getFromStorage(GIST_KEY) || { token: '', gistId: '' }; }
function saveGistConfig(cfg) { setToStorage(GIST_KEY, cfg); }

async function gistTest({ token }) {
  const headers = new Headers({ Authorization: `token ${token}` });
  const resp = await fetch('https://api.github.com/user', { headers });
  if (!resp.ok) throw new Error(`Token 无效 (HTTP ${resp.status})`);
}

async function gistUpload(cfg, jsonStr) {
  const { token, gistId } = cfg;
  const headers = new Headers({ Authorization: `token ${token}`, 'Content-Type': 'application/json' });
  const filename = 'homepage-config.json';
  const method = gistId ? 'PATCH' : 'POST';
  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
  const body = { description: 'Browser Homepage Config', public: false, files: { [filename]: { content: jsonStr } } };
  const resp = await fetch(url, { method, headers, body: JSON.stringify(body) });
  if (!resp.ok) throw new Error(`Gist 操作失败 (HTTP ${resp.status})`);
  const result = await resp.json();
  if (!gistId && result.id) {
    cfg.gistId = result.id;
    saveGistConfig(cfg);
    return { newGistId: result.id };
  }
  return {};
}

async function gistDownload({ token, gistId }) {
  if (!gistId) throw new Error('请先填写 Gist ID');
  const headers = new Headers({ Authorization: `token ${token}` });
  const resp = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
  if (!resp.ok) throw new Error(`获取失败 (HTTP ${resp.status})`);
  const data = await resp.json();
  const file = data.files?.['homepage-config.json'];
  if (!file?.content) throw new Error('Gist 中无配置文件');
  return file.content;
}

// ==================== UI 渲染 ====================
export function renderSyncTab(container) {
  container.innerHTML = '';

  // ---------- 本地文件 ----------
  const localSection = createElement('div', { className: 'sync-section' });
  localSection.appendChild(createElement('h3', {}, '📁 本地文件'));

  // 导出范围
  const exportDiv = createElement('div', { className: 'sync-sub' });
  exportDiv.appendChild(createElement('label', { style: { fontWeight: 500 } }, '导出数据范围'));
  const keysDiv = createElement('div', { className: 'checkbox-group', id: 'exportCheckboxes' });
  DATA_KEYS.forEach(dk => {
    const lbl = createElement('label', { className: 'checkbox-label' });
    lbl.appendChild(createElement('input', { type: 'checkbox', value: dk.key, checked: true }));
    lbl.appendChild(document.createTextNode(`${dk.icon} ${dk.label}`));
    keysDiv.appendChild(lbl);
  });
  exportDiv.appendChild(keysDiv);

  const exportBtnRow = createElement('div', { className: 'sync-btn-group' });
  exportBtnRow.appendChild(createElement('button', { className: 'btn-save', onclick: () => {
    const selected = [...keysDiv.querySelectorAll('input:checked')].map(cb => cb.value);
    const obj = exportConfig(selected);
    downloadJSON(obj, `homepage-backup-${new Date().toISOString().replace(/:/g, '-').substring(0,16)}.json`);
    addSyncLog({ timestamp: Date.now(), action: 'export', source: 'file', status: 'success', message: `导出 ${selected.length} 项` });
  } }, '⬇️ 导出所选'));
  exportBtnRow.appendChild(createElement('button', { className: 'btn-small', onclick: () => keysDiv.querySelectorAll('input').forEach(cb => cb.checked = true) }, '全选'));
  exportBtnRow.appendChild(createElement('button', { className: 'btn-small', onclick: () => keysDiv.querySelectorAll('input').forEach(cb => cb.checked = false) }, '取消全选'));
  exportDiv.appendChild(exportBtnRow);
  localSection.appendChild(exportDiv);

  // 导入文件
  const importDiv = createElement('div', { className: 'sync-sub' });
  importDiv.appendChild(createElement('label', { style: { fontWeight: 500 } }, '导入备份'));
  const fileInput = createElement('input', { type: 'file', accept: '.json', style: { marginTop: '6px' } });
  importDiv.appendChild(fileInput);
  const previewBox = createElement('div', { id: 'importPreview', style: { display: 'none', marginTop: '12px' } });
  importDiv.appendChild(previewBox);

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await readFile(file);
      const summary = previewImportData(text);
      showImportPreview(previewBox, text, summary);
    } catch (err) {
      alert('文件解析失败：' + err.message);
      previewBox.style.display = 'none';
    }
  });
  localSection.appendChild(importDiv);
  container.appendChild(localSection);

  // ---------- WebDAV ----------
  renderWebDAV(container);

  // ---------- GitHub Gist ----------
  renderGist(container);

  // ---------- 同步日志 ----------
  renderLog(container);
}

// ===== 导入预览面板 =====
function showImportPreview(box, jsonStr, summary) {
  box.style.display = 'block';
  box.innerHTML = '';
  box.appendChild(createElement('h4', {}, '导入预览'));

  const listDiv = createElement('div', { style: { maxHeight: '300px', overflowY: 'auto', marginBottom: '12px' } });
  const checks = summary.map(item => {
    const row = createElement('div', { style: { display: 'flex', alignItems: 'flex-start', marginBottom: '8px' } });
    const cb = createElement('input', { type: 'checkbox', checked: true, value: item.key });
    row.appendChild(cb);
    const info = createElement('div', { style: { flex: 1, marginLeft: '8px', fontSize: '13px' } });
    info.appendChild(createElement('span', { style: { fontWeight: 500 } }, `${item.icon} ${item.label}`));
    info.appendChild(document.createTextNode(' — ' + item.summaryText));
    if (item.expandable) {
      const btn = createElement('button', { textContent: '详情', className: 'btn-small', style: { marginLeft: '6px', fontSize: '11px' }, onclick: (e) => {
        const detail = e.target.nextElementSibling;
        detail.hidden = !detail.hidden;
        e.target.textContent = detail.hidden ? '详情' : '收起';
      } });
      info.appendChild(btn);
      const detail = createElement('pre', { hidden: true, style: { fontSize: '11px', maxHeight: '120px', overflow: 'auto', background: 'var(--color-bg)', padding: '4px', borderRadius: '4px', marginTop: '4px', whiteSpace: 'pre-wrap' } });
      if (item.key === 'bookmarks') {
        const cats = item.raw.categories?.map(c => c.name).join(', ') || '无';
        const bms = item.raw.bookmarks?.map(b => b.title).join(', ') || '无';
        detail.textContent = `分区: ${cats}\n书签: ${bms}`;
      } else if (item.key === 'custom_sources') {
        detail.textContent = item.raw.map(s => `${s.name}: ${s.url}`).join('\n');
      } else {
        detail.textContent = JSON.stringify(item.raw, null, 2);
      }
      info.appendChild(detail);
    }
    row.appendChild(info);
    listDiv.appendChild(row);
    return cb;
  });
  box.appendChild(listDiv);

  const btnRow = createElement('div', { className: 'sync-btn-group' });
  btnRow.appendChild(createElement('button', { className: 'btn-save', onclick: () => {
    const selected = [...listDiv.querySelectorAll('input:checked')].map(cb => cb.value);
    if (!selected.length) return alert('请至少选择一项');
    applyImport(selected, jsonStr);
    addSyncLog({ timestamp: Date.now(), action: 'import', source: 'file', status: 'success', message: `导入 ${selected.length} 项` });
    alert('导入成功！部分设置需刷新页面生效。');
    box.style.display = 'none';
  } }, '✅ 导入所选'));
  btnRow.appendChild(createElement('button', { className: 'btn-cancel', onclick: () => { box.style.display = 'none'; } }, '取消'));
  box.appendChild(btnRow);
}

// ===== WebDAV 区块 =====
function renderWebDAV(container) {
  const sec = createElement('div', { className: 'sync-section' });
  sec.appendChild(createElement('h3', {}, '☁️ WebDAV'));
  const cfg = getWebDAVConfig();

  const urlInp = createElement('input', { placeholder: 'https://dav.example.com/', value: cfg.url, className: 'sync-input' });
  const fileInp = createElement('input', { placeholder: '文件名', value: cfg.filename || 'homepage-config.json', className: 'sync-input' });
  const userInp = createElement('input', { placeholder: '用户名', value: cfg.username, className: 'sync-input' });
  const passInp = createElement('input', { type: 'password', placeholder: '密码', value: cfg.password, className: 'sync-input' });
  const form = createElement('div', { className: 'sync-config-form' });
  for (const [label, inp] of [['根地址',urlInp], ['文件名',fileInp], ['用户名',userInp], ['密码',passInp]]) {
    form.appendChild(createElement('label', { style: { display:'flex', flexDirection:'column', gap:'2px', fontSize:'13px' } }, label));
    form.appendChild(inp);
  }
  sec.appendChild(form);

  const btnRow = createElement('div', { className: 'sync-btn-group' });
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: () => {
    saveWebDAVConfig({ url: urlInp.value.trim(), filename: fileInp.value.trim() || 'homepage-config.json', username: userInp.value.trim(), password: passInp.value.trim() });
    alert('WebDAV 配置已保存');
  } }, '💾 保存配置'));
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: async () => {
    try {
      await webdavTest({ url: urlInp.value.trim(), filename: fileInp.value.trim(), username: userInp.value.trim(), password: passInp.value.trim() });
      alert('连接成功');
    } catch (e) { alert('连接失败：' + e.message + '\n可能由于跨域或网络问题'); }
  } }, '🔍 测试连接'));
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: async () => {
    try {
      const selectedKeys = [...document.querySelectorAll('#exportCheckboxes input:checked')].map(cb => cb.value);
      const jsonStr = JSON.stringify(exportConfig(selectedKeys));
      await webdavUpload({ url: urlInp.value.trim(), filename: fileInp.value.trim(), username: userInp.value.trim(), password: passInp.value.trim() }, jsonStr);
      addSyncLog({ timestamp: Date.now(), action: 'upload', source: 'webdav', status: 'success', message: '上传成功' });
      alert('上传成功');
    } catch (e) { alert('上传失败：' + e.message); }
  } }, '☁️ 上传'));
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: async () => {
    try {
      const text = await webdavDownload({ url: urlInp.value.trim(), filename: fileInp.value.trim(), username: userInp.value.trim(), password: passInp.value.trim() });
      const summary = previewImportData(text);
      const previewBox = document.getElementById('importPreview');
      if (previewBox) showImportPreview(previewBox, text, summary);
      addSyncLog({ timestamp: Date.now(), action: 'download', source: 'webdav', status: 'success', message: '下载成功' });
    } catch (e) { alert('下载失败：' + e.message); }
  } }, '🌐 下载'));
  sec.appendChild(btnRow);
  container.appendChild(sec);
}

// ===== GitHub Gist 区块 =====
function renderGist(container) {
  const sec = createElement('div', { className: 'sync-section' });
  sec.appendChild(createElement('h3', {}, '🐙 GitHub Gist'));
  const cfg = getGistConfig();

  const tokenInp = createElement('input', { placeholder: 'Personal Access Token', value: cfg.token, className: 'sync-input' });
  const gistIdInp = createElement('input', { placeholder: 'Gist ID（留空自动创建）', value: cfg.gistId, className: 'sync-input' });
  const form = createElement('div', { className: 'sync-config-form' });
  for (const [label, inp] of [['Token',tokenInp], ['Gist ID',gistIdInp]]) {
    form.appendChild(createElement('label', { style: { display:'flex', flexDirection:'column', gap:'2px', fontSize:'13px' } }, label));
    form.appendChild(inp);
  }
  sec.appendChild(form);

  const btnRow = createElement('div', { className: 'sync-btn-group' });
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: () => {
    saveGistConfig({ token: tokenInp.value.trim(), gistId: gistIdInp.value.trim() });
    alert('Gist 配置已保存');
  } }, '💾 保存配置'));
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: async () => {
    try { await gistTest({ token: tokenInp.value.trim() }); alert('Token 有效'); }
    catch (e) { alert('Token 无效或网络错误：' + e.message); }
  } }, '🔍 测试 Token'));
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: async () => {
    try {
      const selectedKeys = [...document.querySelectorAll('#exportCheckboxes input:checked')].map(cb => cb.value);
      const jsonStr = JSON.stringify(exportConfig(selectedKeys));
      const result = await gistUpload({ token: tokenInp.value.trim(), gistId: gistIdInp.value.trim() }, jsonStr);
      if (result.newGistId) {
        gistIdInp.value = result.newGistId;
        saveGistConfig({ token: tokenInp.value.trim(), gistId: result.newGistId });
      }
      addSyncLog({ timestamp: Date.now(), action: 'upload', source: 'gist', status: 'success', message: '上传成功' });
      alert('上传成功');
    } catch (e) { alert('上传失败：' + e.message); }
  } }, '☁️ 上传'));
  btnRow.appendChild(createElement('button', { className: 'btn-small', onclick: async () => {
    try {
      const text = await gistDownload({ token: tokenInp.value.trim(), gistId: gistIdInp.value.trim() });
      const summary = previewImportData(text);
      const previewBox = document.getElementById('importPreview');
      if (previewBox) showImportPreview(previewBox, text, summary);
      addSyncLog({ timestamp: Date.now(), action: 'download', source: 'gist', status: 'success', message: '下载成功' });
    } catch (e) { alert('下载失败：' + e.message); }
  } }, '🌐 下载'));
  sec.appendChild(btnRow);
  container.appendChild(sec);
}

// ===== 日志区域 =====
function renderLog(container) {
  const sec = createElement('div', { className: 'sync-section' });
  sec.appendChild(createElement('h3', {}, '📋 同步日志'));
  const logs = getSyncLogs();
  const logDiv = createElement('div', { style: { maxHeight: '200px', overflowY: 'auto', fontSize: '12px', marginTop: '8px' } });
  if (!logs.length) {
    logDiv.appendChild(document.createTextNode('暂无记录'));
  } else {
    logs.forEach(log => {
      const entry = createElement('div', { style: { marginBottom: '4px', padding: '4px', background: 'var(--color-bg)', borderRadius: '4px' } });
      const time = new Date(log.timestamp).toLocaleString();
      const icon = log.status === 'success' ? '✅' : '❌';
      const arrow = log.action === 'export' ? '↑' : (log.action === 'import' ? '↓' : (log.action === 'upload' ? '↑' : '↓'));
      entry.textContent = `${icon} ${log.source} ${arrow} ${log.message} (${time})`;
      logDiv.appendChild(entry);
    });
  }
  sec.appendChild(logDiv);
  sec.appendChild(createElement('button', { className: 'btn-small', style: { marginTop: '8px' }, onclick: () => {
    if (confirm('清空所有日志？')) { clearSyncLogs(); renderSyncTab(container); }
  } }, '清空日志'));
  container.appendChild(sec);
}

// ===== 辅助 =====
async function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
