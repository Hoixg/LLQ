import { getFromStorage, setToStorage } from './utils.js';

const STORAGE_KEY = 'layout_expanded';

export function initLayoutToggle() {
  const toggleBtn = document.getElementById('toggleBtn');
  const expandable = document.getElementById('expandableArea');
  if (!toggleBtn || !expandable) return;
  const label = toggleBtn.querySelector('.toggle-label');

  let isExpanded = getFromStorage(STORAGE_KEY);
  if (isExpanded === null) {
    isExpanded = getFromStorage('defaultExpand', false);
  }

  function updateUI() {
    if (isExpanded) {
      expandable.classList.add('expanded');
      toggleBtn.classList.add('expanded');
      label.textContent = '收起';
    } else {
      expandable.classList.remove('expanded');
      toggleBtn.classList.remove('expanded');
      label.textContent = '展开';
    }
  }
  updateUI();

  toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    setToStorage(STORAGE_KEY, isExpanded);
    updateUI();
  });
}
