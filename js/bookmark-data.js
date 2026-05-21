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
