import { useRef, useCallback, useMemo } from 'react';
import { useSettings } from '../../../context/SettingsContext';

// Valid statuses user can type (P, B, V come from other tabs)
const TYPEABLE = new Set(['T', 'D', 'G']);

export default function CalendarCell({
  status, isWeekend, isSaturday, isSunday, isToday,
  onChange, workerId, fecha, colIndex, onFocus, autoAdvance,
}) {
  const inputRef = useRef(null);
  const { getStatusTypes } = useSettings();
  const statusTypes = useMemo(() => getStatusTypes(), [getStatusTypes]);
  const statusInfo = status ? statusTypes[status] : null;

  const classes = [
    'cal-cell',
    isWeekend ? 'weekend' : '',
    isSaturday ? 'saturday' : '',
    isSunday ? 'sunday' : '',
    isToday ? 'today' : '',
    status ? 'has-status' : '',
  ].filter(Boolean).join(' ');

  // Handle keydown: arrow nav + validation
  const handleKeyDown = useCallback((e) => {
    // Arrow keys → navigate
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const table = e.target.closest('table');
      if (table) navigateFromCell(table, e.target, e.key, autoAdvance);
      return;
    }

    // Tab → next cell
    if (e.key === 'Tab') {
      e.preventDefault();
      const table = e.target.closest('table');
      if (table) navigateFromCell(table, e.target, e.shiftKey ? 'ArrowLeft' : 'ArrowRight', autoAdvance);
      return;
    }

    // Delete / Backspace → clear
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (status) onChange(null);
      return;
    }

    // Letter keys
    const key = e.key.toUpperCase();
    if (key.length === 1 && /[A-Z]/.test(key)) {
      e.preventDefault();
      if (TYPEABLE.has(key)) {
        onChange(key === status ? null : key);
        // Auto-advance after typing
        if (autoAdvance) {
          setTimeout(() => {
            const table = e.target.closest('table');
            if (table) navigateFromCell(table, e.target, 'ArrowRight', true);
          }, 30);
        }
      }
      return;
    }
  }, [status, onChange, autoAdvance]);

  // Handle focus → crosshair
  const handleFocus = useCallback((e) => {
    if (onFocus) onFocus(colIndex, e.target);
  }, [colIndex, onFocus]);

  return (
    <td className={classes} data-col-index={colIndex}>
      <input
        ref={inputRef}
        type="text"
        className="cal-input"
        readOnly
        value={status || ''}
        data-worker={workerId}
        data-fecha={fecha}
        data-col-index={colIndex}
        style={statusInfo ? {
          background: statusInfo.color,
          color: statusInfo.darkText ? '#1e293b' : '#fff',
          fontSize: status && status.length > 1 ? '0.65rem' : undefined,
        } : undefined}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        tabIndex={0}
      />
    </td>
  );
}

// Navigate to next editable cell, skipping locked ones
function navigateFromCell(table, currentInput, direction) {
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const currentRow = currentInput.closest('tr');
  const rowIdx = rows.indexOf(currentRow);
  const cells = Array.from(currentRow.querySelectorAll('.cal-input'));
  let cellIdx = cells.indexOf(currentInput);

  let r = rowIdx;
  let c = cellIdx;
  const maxIter = rows.length * 400;
  let iter = 0;

  while (iter++ < maxIter) {
    switch (direction) {
      case 'ArrowRight':
        c++;
        if (c >= cells.length) { c = 0; r++; }
        break;
      case 'ArrowLeft':
        c--;
        if (c < 0) {
          r--;
          if (r >= 0) {
            const prevCells = rows[r].querySelectorAll('.cal-input');
            c = prevCells.length - 1;
          }
        }
        break;
      case 'ArrowDown':
        r++;
        break;
      case 'ArrowUp':
        r--;
        break;
    }

    if (r < 0 || r >= rows.length) return;

    const targetRow = rows[r];
    const targetCells = Array.from(targetRow.querySelectorAll('.cal-input'));
    const ci = Math.min(c, targetCells.length - 1);
    const target = targetCells[ci];

    if (target && !target.hasAttribute('data-locked')) {
      target.focus();
      target.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
      return;
    }

    // For vertical, keep trying same direction
    if (direction === 'ArrowUp' || direction === 'ArrowDown') {
      c = ci;
    }
  }
}
