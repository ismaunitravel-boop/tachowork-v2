import { useEffect } from 'react';
import { MENU } from '../utils/constants';

// Flatten menu items to get ordered list
const FLAT_ITEMS = MENU.flatMap(group => group.items);

/**
 * Alt+1..9 navigates to modules (flat order)
 * Alt+0 navigates to last item (Ajustes)
 * Only active when no modal is open
 */
export default function useKeyboardNav(onNavigate) {
  useEffect(() => {
    const handleKey = (e) => {
      // Only Alt+number shortcuts
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

      // Don't fire if a modal is open
      if (document.querySelector('.modal-overlay')) return;

      const num = parseInt(e.key);
      if (isNaN(num)) return;

      // Alt+1..9 = items 0..8, Alt+0 = item 9
      const index = num === 0 ? 9 : num - 1;
      if (index >= 0 && index < FLAT_ITEMS.length) {
        e.preventDefault();
        onNavigate(FLAT_ITEMS[index].id);
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onNavigate]);
}
