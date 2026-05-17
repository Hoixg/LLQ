import { getFromStorage, setToStorage } from './utils.js';

const STORAGE_KEY = 'layout_expanded';

export function initLayoutToggle() {
  const toggleBtn = document.getElementById('toggleBtn');
  const expandable = document.getElementById('expandableArea');
  const icon = toggleBtn.querySelector('.toggle-icon');
  const label = toggleBtn.querySelector('.toggle-label');

  let isExpanded = getFromStorage(STORAGE_KEY);
  if (isExpanded === null) {
    isExpanded = localStorage.getItem('defaultExpand') === 'true';
  }

  function updateUI() {
    if (isExpanded) {
      expandable.classList.add('expanded');
      icon.textContent = '▲';
      label.textContent = '收起';
    } else {
      expandable.classList.remove('expanded');
      icon.textContent = '▼';
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
