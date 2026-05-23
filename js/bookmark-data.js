import { getFromStorage, setToStorage } from './utils.js';

const STORAGE_KEY = 'bookmarks';

const DEFAULT_DATA = {
  categories: [
    { id: 'default', name: '未分类', order: 999, isDefault: true }
  ],
  bookmarks: []
};

let data = getFromStorage(STORAGE_KEY);
if (!data || !data.categories) {
  data = { ...DEFAULT_DATA };
  setToStorage(STORAGE_KEY, data);
}

function save() {
  setToStorage(STORAGE_KEY, data);
}

function genId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

export function getData() {
  return JSON.parse(JSON.stringify(data));
}

export function addCategory(name) {
  const newCat = { id: genId('cat'), name, order: data.categories.length };
  data.categories.push(newCat);
  save();
  return newCat;
}

export function updateCategory(id, newName) {
  const cat = data.categories.find(c => c.id === id);
  if (!cat || cat.isDefault) return false;
  cat.name = newName;
  save();
  return true;
}

export function deleteCategory(id) {
  if (id === 'default') return false;
  data.categories = data.categories.filter(c => c.id !== id);
  data.bookmarks.forEach(b => {
    if (b.categoryId === id) b.categoryId = 'default';
  });
  save();
  return true;
}

export function addBookmark({ title, url, categoryId = 'default', iconUrl = '' }) {
  const bookmark = {
    id: genId('bkm'),
    title,
    url: url.trim(),
    categoryId,
    iconUrl: iconUrl.trim(),
    order: Date.now()
  };
  data.bookmarks.push(bookmark);
  save();
  return bookmark;
}

export function updateBookmark(id, updates) {
  const bm = data.bookmarks.find(b => b.id === id);
  if (!bm) return false;
  Object.assign(bm, updates);
  save();
  return true;
}

export function deleteBookmark(id) {
  data.bookmarks = data.bookmarks.filter(b => b.id !== id);
  save();
  return true;
}

export function getBookmarksByCategory(catId) {
  return data.bookmarks
    .filter(b => b.categoryId === catId)
    .sort((a, b) => a.order - b.order);
}

export function searchBookmarks(query) {
  const q = query.toLowerCase();
  return data.bookmarks.filter(b =>
    b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
  );
}

export function moveBookmark(bookmarkId, targetCategoryId) {
  const bm = data.bookmarks.find(b => b.id === bookmarkId);
  if (!bm) return false;
  bm.categoryId = targetCategoryId;
  save();
  return true;
}

export function reorderBookmarks(orderedIds) {
  orderedIds.forEach((id, idx) => {
    const bm = data.bookmarks.find(b => b.id === id);
    if (bm) bm.order = idx;
  });
  save();
}

export function reorderCategories(orderedIds) {
  orderedIds.forEach((id, idx) => {
    const cat = data.categories.find(c => c.id === id);
    if (cat && !cat.isDefault) cat.order = idx;
  });
  save();
}

export function getCategoryById(id) {
  return data.categories.find(c => c.id === id);
}

export function getAllCategories() {
  return [...data.categories].sort((a, b) => {
    if (a.isDefault) return 1;
    if (b.isDefault) return -1;
    return a.order - b.order;
  });
}

// ==================== 浏览器书签导入 ====================

const ROOT_FOLDER_NAMES = /^(Bookmarks|书签|Bookmarks Bar|书签栏|Other Bookmarks|其他书签|Mobile Bookmarks|移动书签)$/i;

export function importBookmarksFromHTML(htmlString) {
  const lines = htmlString.split(/\r?\n/);
  const existingUrls = new Set(data.bookmarks.map(b => b.url));
  let orderCounter = Date.now();

  let currentFolder = null;
  const folders = [];
  const topLevelBookmarks = [];

  for (const line of lines) {
    const h3Match = line.match(/<H3[^>]*>([^<]*)<\/H3>/i);
    if (h3Match) {
      const name = h3Match[1].trim();
      if (name && !ROOT_FOLDER_NAMES.test(name)) {
        currentFolder = { name, bookmarks: [] };
        folders.push(currentFolder);
      } else {
        currentFolder = null;
      }
      continue;
    }

    const aMatch = line.match(/<A\s+[^>]*HREF="([^"]*)"([^>]*)>([^<]*)<\/A>/i);
    if (aMatch) {
      const url = aMatch[1];
      const restAttrs = aMatch[2] || '';
      const title = aMatch[3].trim();
      if (!url || !title) continue;

      let icon = '';
      const iconMatch = restAttrs.match(/ICON="([^"]*)"/i);
      if (iconMatch) icon = iconMatch[1];

      const bm = { title, url, icon };
      if (currentFolder) {
        currentFolder.bookmarks.push(bm);
      } else {
        topLevelBookmarks.push(bm);
      }
    }
  }

  const result = { categoriesCreated: 0, bookmarksImported: 0, duplicatesSkipped: 0 };
  const catMap = {};

  for (const folder of folders) {
    let cat = data.categories.find(c => c.name === folder.name);
    if (!cat) {
      cat = { id: genId('cat'), name: folder.name, order: data.categories.length };
      data.categories.push(cat);
      result.categoriesCreated++;
    }
    catMap[folder.name] = cat.id;
  }

  function importOne(bm, catId) {
    if (existingUrls.has(bm.url)) {
      result.duplicatesSkipped++;
      return;
    }
    data.bookmarks.push({
      id: genId('bkm'),
      title: bm.title,
      url: bm.url,
      categoryId: catId,
      iconUrl: bm.icon || '',
      order: orderCounter++,
    });
    existingUrls.add(bm.url);
    result.bookmarksImported++;
  }

  for (const bm of topLevelBookmarks) importOne(bm, 'default');
  for (const folder of folders) {
    const catId = catMap[folder.name];
    for (const bm of folder.bookmarks) importOne(bm, catId);
  }

  save();
  return result;
}
