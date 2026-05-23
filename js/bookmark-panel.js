import { createElement } from './utils.js';
import {
  addCategory, updateCategory, deleteCategory,
  addBookmark, updateBookmark, deleteBookmark,
  getBookmarksByCategory, searchBookmarks, getAllCategories,
  getCategoryById, reorderBookmarks, reorderCategories,
  importBookmarksFromHTML
} from './bookmark-data.js';

let panelEl = null;
let overlayEl = null;
let isOpen = false;
let closeTimer = null;

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}`;
  } catch {
    return '';
  }
}

export function closePanel() {
  if (!isOpen) return;
  isOpen = false;
  if (panelEl) panelEl.classList.add('closing');
  if (overlayEl) overlayEl.classList.add('closing');
  closeTimer = setTimeout(() => {
    closeTimer = null;
    if (panelEl) panelEl.classList.remove('open', 'closing');
    if (overlayEl) overlayEl.classList.remove('open', 'closing');
  }, 250);
}

export function openPanel() {
  if (isOpen) return;
  clearTimeout(closeTimer);
  if (panelEl) panelEl.classList.remove('closing');
  if (overlayEl) overlayEl.classList.remove('closing');
  document.dispatchEvent(new CustomEvent('close-all-panels', { detail: { source: 'bookmarks' } }));
  isOpen = true;
  if (!panelEl) {
    createPanelElements();
  }
  panelEl.classList.add('open');
  overlayEl.classList.add('open');
  renderMainView();
}

function createPanelElements() {
  overlayEl = createElement('div', { className: 'bookmarks-overlay', onclick: closePanel });
  document.body.appendChild(overlayEl);

  panelEl = createElement('div', { className: 'bookmarks-panel' });
  panelEl.innerHTML = `
    <div class="bookmarks-header">
      <h2>收藏夹</h2>
      <button class="close-btn" id="bookmarksCloseBtn">✕</button>
    </div>
    <div class="bookmarks-content" id="bookmarksContent"></div>
  `;
  document.body.appendChild(panelEl);
  panelEl.querySelector('#bookmarksCloseBtn').addEventListener('click', closePanel);
}

function renderMainView() {
  const content = document.getElementById('bookmarksContent');
  content.innerHTML = '';

  const searchRow = createElement('div', { className: 'bookmarks-search-row' });
  const searchInput = createElement('input', {
    type: 'text',
    className: 'bookmarks-search-input',
    placeholder: '搜索收藏...',
    oninput: (e) => handleSearch(e.target.value, searchResultsContainer),
  });
  searchRow.appendChild(searchInput);
  content.appendChild(searchRow);

  const searchResultsContainer = createElement('div', { className: 'search-results' });
  searchResultsContainer.style.display = 'none';
  content.appendChild(searchResultsContainer);

  const categoryListContainer = createElement('div', { className: 'category-list' });
  const cats = getAllCategories();
  cats.forEach(cat => {
    categoryListContainer.appendChild(renderCategoryItem(cat));
  });
  content.appendChild(categoryListContainer);

  const addCatBtn = createElement('button', {
    className: 'btn-add-category',
    onclick: () => showAddCategoryDialog()
  }, '+ 新建分区');
  content.appendChild(addCatBtn);

  const importBtn = createElement('button', {
    className: 'btn-add-category',
    style: { marginTop: '4px' },
    onclick: () => triggerBookmarkImport()
  }, '📥 导入浏览器书签');
  content.appendChild(importBtn);
}

function renderCategoryItem(cat) {
  const bookmarks = getBookmarksByCategory(cat.id);
  const count = bookmarks.length;
  const isDefault = cat.id === 'default';

  const item = createElement('div', { className: 'category-item', draggable: isDefault ? 'false' : 'true', data: { catId: cat.id } });
  const header = createElement('div', { className: 'category-header' });

  const expandIcon = createElement('span', { className: 'expand-icon collapsed' }, '▼');
  const nameSpan = createElement('span', { className: 'category-name' }, `${cat.name} (${count})`);
  const actions = createElement('div', { className: 'category-actions' });

  if (!isDefault) {
    actions.appendChild(createElement('button', {
      className: 'bookmark-btn-icon', title: '编辑',
      onclick: (e) => { e.stopPropagation(); showEditCategoryDialog(cat); }
    }, '✎'));
    actions.appendChild(createElement('button', {
      className: 'bookmark-btn-icon', title: '删除',
      onclick: (e) => { e.stopPropagation(); deleteCategoryWithConfirm(cat.id); }
    }, '✕'));
  }

  header.appendChild(expandIcon);
  header.appendChild(nameSpan);
  header.appendChild(actions);

  const bookmarkContainer = createElement('div', { className: 'bookmark-list collapsed' });
  const inner = createElement('div', { className: 'bookmark-list-inner' });
  bookmarkContainer.appendChild(inner);

  header.addEventListener('click', () => {
    const isExpanded = !bookmarkContainer.classList.contains('collapsed');
    document.querySelectorAll('.bookmark-list:not(.collapsed)').forEach(el => {
      if (el !== bookmarkContainer) el.classList.add('collapsed');
    });
    document.querySelectorAll('.expand-icon:not(.collapsed)').forEach(el => {
      if (el !== expandIcon) el.classList.add('collapsed');
    });
    if (isExpanded) {
      bookmarkContainer.classList.add('collapsed');
      expandIcon.classList.add('collapsed');
    } else {
      bookmarkContainer.classList.remove('collapsed');
      expandIcon.classList.remove('collapsed');
      if (inner.children.length === 0) {
        renderBookmarksList(inner, cat.id);
      }
    }
  });

  item.appendChild(header);
  item.appendChild(bookmarkContainer);

  item.addEventListener('dragstart', handleCatDragStart);
  item.addEventListener('dragend', handleCatDragEnd);
  item.addEventListener('dragover', handleCatDragOver);
  item.addEventListener('dragleave', handleCatDragLeave);
  item.addEventListener('drop', handleCatDrop);

  return item;
}

function renderBookmarksList(container, catId) {
  container.innerHTML = '';
  const bookmarks = getBookmarksByCategory(catId);
  if (bookmarks.length === 0) {
    container.appendChild(createElement('div', { className: 'empty-hint' }, '暂无收藏'));
  } else {
    bookmarks.forEach(bm => {
      const bmItem = createElement('div', { className: 'bookmark-item', draggable: 'true', data: { bmId: bm.id, catId: catId } });
      const handle = createElement('span', { className: 'drag-handle', title: '拖拽排序' }, '\u2630');
      const icon = createElement('img', {
        className: 'bookmark-icon',
        src: bm.iconUrl || getFaviconUrl(bm.url),
        onerror: (e) => { e.target.style.display = 'none'; }
      });
      const info = createElement('div', { className: 'bookmark-info' });
      const title = createElement('a', {
        href: bm.url, target: '_blank', rel: 'noopener',
        className: 'bookmark-title',
        onclick: (e) => e.stopPropagation()
      }, bm.title);
      const urlText = createElement('span', { className: 'bookmark-url' }, bm.url);
      info.appendChild(title);
      info.appendChild(urlText);

      const actions = createElement('div', { className: 'bookmark-actions' });
      actions.appendChild(createElement('button', {
        className: 'bookmark-btn-icon', title: '编辑',
        onclick: (e) => { e.stopPropagation(); showEditBookmarkDialog(bm); }
      }, '✎'));
      actions.appendChild(createElement('button', {
        className: 'bookmark-btn-icon', title: '删除',
        onclick: (e) => { e.stopPropagation(); deleteBookmarkHandler(bm.id); }
      }, '✕'));

      bmItem.appendChild(handle);
      bmItem.appendChild(icon);
      bmItem.appendChild(info);
      bmItem.appendChild(actions);

      bmItem.addEventListener('dragstart', handleBmDragStart);
      bmItem.addEventListener('dragend', handleBmDragEnd);
      bmItem.addEventListener('dragover', handleBmDragOver);
      bmItem.addEventListener('dragleave', handleBmDragLeave);
      bmItem.addEventListener('drop', handleBmDrop);

      container.appendChild(bmItem);
    });
  }

  const addBtn = createElement('button', {
    className: 'btn-add-bookmark',
    onclick: () => showAddBookmarkDialog(catId)
  }, '+ 添加网站');
  container.appendChild(addBtn);
}

function handleSearch(query, resultsContainer) {
  const catList = document.querySelector('.category-list');
  if (!query.trim()) {
    // 修复：增加空值检查
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (catList) catList.style.display = '';
    return;
  }
  if (catList) catList.style.display = 'none';
  if (resultsContainer) resultsContainer.style.display = 'block';
  const results = searchBookmarks(query.trim());
  resultsContainer.innerHTML = '';
  if (results.length === 0) {
    resultsContainer.appendChild(createElement('div', { className: 'empty-hint' }, '无结果'));
    return;
  }
  results.forEach(bm => {
    const cat = getCategoryById(bm.categoryId);
    const catName = cat ? cat.name : '未分类';
    const item = createElement('div', { className: 'search-result-item' });
    const icon = createElement('img', {
      className: 'bookmark-icon small',
      src: bm.iconUrl || getFaviconUrl(bm.url),
      onerror: (e) => { e.target.style.display = 'none'; }
    });
    const infoDiv = createElement('div', { className: 'bookmark-info' });
    const titleLink = createElement('a', {
      href: bm.url, target: '_blank', rel: 'noopener',
      className: 'bookmark-title'
    }, bm.title);
    const catSpan = createElement('span', { className: 'bookmark-category' }, `分类: ${catName}`);
    infoDiv.appendChild(titleLink);
    infoDiv.appendChild(catSpan);
    item.appendChild(icon);
    item.appendChild(infoDiv);
    resultsContainer.appendChild(item);
  });
}

function triggerBookmarkImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.html,.htm';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = importBookmarksFromHTML(text);
      if (result.bookmarksImported === 0 && result.categoriesCreated === 0) {
        alert(result.duplicatesSkipped > 0
          ? `未导入新书签，${result.duplicatesSkipped} 条已存在（重复跳过）。`
          : '未找到可导入的书签，请检查文件格式。');
      } else {
        const parts = [];
        if (result.categoriesCreated > 0) parts.push(`新增分区：${result.categoriesCreated}`);
        if (result.bookmarksImported > 0) parts.push(`导入书签：${result.bookmarksImported}`);
        if (result.duplicatesSkipped > 0) parts.push(`跳过重复：${result.duplicatesSkipped}`);
        alert('导入完成！\n' + parts.join('\n'));
      }
      renderMainView();
    } catch (err) {
      alert('导入失败：文件格式不正确或无法读取。');
      console.error('书签导入错误：', err);
    }
  };
  input.click();
}

function showAddCategoryDialog() {
  const name = prompt('请输入分区名称：');
  if (name && name.trim()) {
    addCategory(name.trim());
    renderMainView();
  }
}

function showEditCategoryDialog(cat) {
  const newName = prompt('编辑分区名称：', cat.name);
  if (newName && newName.trim() && newName.trim() !== cat.name) {
    updateCategory(cat.id, newName.trim());
    renderMainView();
  }
}

function deleteCategoryWithConfirm(catId) {
  if (confirm('确定删除该分区？网站将移至“未分类”。')) {
    deleteCategory(catId);
    renderMainView();
  }
}

function showAddBookmarkDialog(catId) {
  showBookmarkForm(catId, null);
}

function showEditBookmarkDialog(bookmark) {
  showBookmarkForm(null, bookmark);
}

function showBookmarkForm(defaultCatId, editData) {
  const content = document.getElementById('bookmarksContent');
  content.innerHTML = '';

  const form = createElement('div', { className: 'bookmark-form' });

  const titleInput = createElement('input', { type: 'text', id: 'bmTitle', placeholder: '网站名称', value: editData ? editData.title : '' });
  const urlInput = createElement('input', { type: 'text', id: 'bmUrl', placeholder: '网站URL', value: editData ? editData.url : '' });
  const iconInput = createElement('input', { type: 'text', id: 'bmIcon', placeholder: '图标URL (留空自动获取)', value: editData ? editData.iconUrl || '' : '' });

  const catSelect = createElement('select', { id: 'bmCategory' });
  const cats = getAllCategories();
  const currentCatId = editData ? editData.categoryId : (defaultCatId || 'default');
  cats.forEach(cat => {
    catSelect.appendChild(createElement('option', { value: cat.id, selected: cat.id === currentCatId }, cat.name));
  });

  const actionsDiv = createElement('div', { className: 'form-actions' });
  const saveBtn = createElement('button', {
    className: 'btn-save',
    onclick: () => {
      const title = document.getElementById('bmTitle').value.trim();
      let url = document.getElementById('bmUrl').value.trim();
      const iconUrl = document.getElementById('bmIcon').value.trim();
      const categoryId = document.getElementById('bmCategory').value;

      if (!title || !url) return alert('名称和URL为必填');
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

      if (editData) {
        updateBookmark(editData.id, { title, url, iconUrl, categoryId });
      } else {
        addBookmark({ title, url, iconUrl, categoryId });
      }
      renderMainView();
    }
  }, '保存');
  const cancelBtn = createElement('button', {
    className: 'btn-cancel',
    onclick: () => renderMainView()
  }, '取消');
  actionsDiv.appendChild(saveBtn);
  actionsDiv.appendChild(cancelBtn);

  form.appendChild(createElement('label', {}, '名称'));
  form.appendChild(titleInput);
  form.appendChild(createElement('label', {}, 'URL'));
  form.appendChild(urlInput);
  form.appendChild(createElement('label', {}, '图标URL (可选)'));
  form.appendChild(iconInput);
  form.appendChild(createElement('label', {}, '分类'));
  form.appendChild(catSelect);
  form.appendChild(actionsDiv);

  content.appendChild(form);
}

function deleteBookmarkHandler(bookmarkId) {
  if (confirm('确定删除该网站？')) {
    deleteBookmark(bookmarkId);
    renderMainView();
  }
}

document.addEventListener('close-all-panels', (e) => {
  if (e.detail && e.detail.source === 'bookmarks') return;
  closePanel();
});

export function initBookmarkPanel(triggerBtn) {
  triggerBtn.addEventListener('click', () => {
    if (isOpen) closePanel();
    else openPanel();
  });
}

let draggedBmEl = null;

function handleBmDragStart(e) {
  draggedBmEl = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.bmId);
}

function handleBmDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.bookmark-item.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedBmEl = null;
}

function handleBmDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this !== draggedBmEl) {
    this.classList.add('drag-over');
  }
}

function handleBmDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleBmDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove('drag-over');
  if (!draggedBmEl || draggedBmEl === this) return;
  const parent = this.parentElement;
  const items = [...parent.querySelectorAll('.bookmark-item')];
  const orderedIds = items.map(item => item.dataset.bmId);
  const draggedId = draggedBmEl.dataset.bmId;
  const targetId = this.dataset.bmId;
  const draggedIdx = orderedIds.indexOf(draggedId);
  orderedIds.splice(draggedIdx, 1);
  let targetIdx = orderedIds.indexOf(targetId);
  const rect = this.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertIdx = e.clientY < midY ? targetIdx : targetIdx + 1;
  orderedIds.splice(insertIdx, 0, draggedId);
  reorderBookmarks(orderedIds);
  const catId = this.dataset.catId;
  parent.querySelector('.btn-add-bookmark')?.remove();
  renderBookmarksList(parent, catId);
}

let draggedCatEl = null;

function handleCatDragStart(e) {
  if (this.dataset.catId === 'default') { e.preventDefault(); return; }
  draggedCatEl = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.catId);
}

function handleCatDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.category-item.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedCatEl = null;
}

function handleCatDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this !== draggedCatEl && this.dataset.catId !== 'default') {
    this.classList.add('drag-over');
  }
}

function handleCatDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleCatDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  this.classList.remove('drag-over');
  if (!draggedCatEl || draggedCatEl === this) return;
  const items = [...document.querySelectorAll('.category-item')];
  const orderedIds = items.map(item => item.dataset.catId);
  const draggedId = draggedCatEl.dataset.catId;
  const targetId = this.dataset.catId;
  const draggedIdx = orderedIds.indexOf(draggedId);
  orderedIds.splice(draggedIdx, 1);
  let targetIdx = orderedIds.indexOf(targetId);
  const rect = this.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertIdx = e.clientY < midY ? targetIdx : targetIdx + 1;
  orderedIds.splice(insertIdx, 0, draggedId);
  reorderCategories(orderedIds);
  renderMainView();
}
