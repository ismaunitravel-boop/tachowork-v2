import { useMemo, forwardRef, useCallback, useRef } from 'react';
import CalendarCell from './CalendarCell';
import { MESES, DIAS_SEMANA } from '../../../utils/constants';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const CalendarGrid = forwardRef(function CalendarGrid({
  year, workers, getStatus, setStatus, search,
  viewMode, viewMonth, viewCierreMonth, viewRangeStart, viewRangeEnd,
  sortBy, displayMode, hiddenWorkers, autoAdvance,
  zoomH, zoomV,
}, ref) {
  const tableRef = useRef(null);

  const today = useMemo(() => {
    const d = new Date();
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Build days based on view mode
  const allDays = useMemo(() => {
    let days = [];

    if (viewMode === 'month' && viewMonth !== undefined) {
      // Single month
      const daysCount = getDaysInMonth(year, viewMonth);
      for (let d = 1; d <= daysCount; d++) {
        days.push(makeDayObj(year, viewMonth, d));
      }
    } else if (viewMode === 'cierre' && viewCierreMonth !== undefined) {
      // Cierre: 26 of prev month → 25 of selected month
      let startYear = year, startMonth = viewCierreMonth - 1;
      if (viewCierreMonth === 0) { startYear = year - 1; startMonth = 11; }
      const startDay = 26;
      const endYear = year, endMonth = viewCierreMonth, endDay = 25;

      let cur = new Date(startYear, startMonth, startDay);
      const end = new Date(endYear, endMonth, endDay);
      while (cur <= end) {
        days.push(makeDayObj(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        cur.setDate(cur.getDate() + 1);
      }
    } else if (viewMode === 'last56') {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 55);
      let cur = new Date(start);
      while (cur <= end) {
        days.push(makeDayObj(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        cur.setDate(cur.getDate() + 1);
      }
    } else if (viewMode === 'range' && viewRangeStart && viewRangeEnd) {
      let cur = new Date(viewRangeStart);
      const end = new Date(viewRangeEnd);
      while (cur <= end) {
        days.push(makeDayObj(cur.getFullYear(), cur.getMonth(), cur.getDate()));
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      // All months (default) — include Nov-Dec of previous year
      for (let m = 10; m <= 11; m++) {
        const dc = getDaysInMonth(year - 1, m);
        for (let d = 1; d <= dc; d++) days.push(makeDayObj(year - 1, m, d));
      }
      for (let m = 0; m < 12; m++) {
        const dc = getDaysInMonth(year, m);
        for (let d = 1; d <= dc; d++) days.push(makeDayObj(year, m, d));
      }
    }
    return days;
  }, [year, viewMode, viewMonth, viewCierreMonth, viewRangeStart, viewRangeEnd, today]);

  function makeDayObj(y, m, d) {
    const dow = new Date(y, m, d).getDay();
    const fecha = formatDate(y, m, d);
    return {
      day: d, month: m, year: y, dow,
      dowLabel: DIAS_SEMANA[dow],
      isWeekend: dow === 0 || dow === 6,
      isSaturday: dow === 6,
      isSunday: dow === 0,
      isToday: fecha === today,
      fecha,
    };
  }

  // Group days by month for headers
  const monthGroups = useMemo(() => {
    const groups = [];
    let cur = null;
    allDays.forEach(d => {
      const key = `${d.year}-${d.month}`;
      if (!cur || cur.key !== key) {
        cur = { key, year: d.year, month: d.month, name: MESES[d.month], days: [] };
        groups.push(cur);
      }
      cur.days.push(d);
    });
    return groups;
  }, [allDays]);

  // Filter + sort workers
  const filtered = useMemo(() => {
    let list = workers.filter(w => {
      if (hiddenWorkers && hiddenWorkers[w.id]) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return w.nombre.toLowerCase().includes(q) || (w.numero || '').toString().includes(q);
    });

    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    // default is by number (already sorted from parent)
    return list;
  }, [workers, search, hiddenWorkers, sortBy]);

  // Display name helper
  const getDisplayName = useCallback((w) => {
    if (displayMode === 'number') return w.numero || '-';
    if (displayMode === 'name') return w.nombre;
    return w.numero ? `${w.numero}. ${w.nombre}` : w.nombre;
  }, [displayMode]);

  // Crosshair
  const handleCellFocus = useCallback((colIndex, inputEl) => {
    const table = tableRef.current;
    if (!table) return;

    // Clear previous
    table.querySelectorAll('.row-highlighted').forEach(el => el.classList.remove('row-highlighted'));
    table.querySelectorAll('.col-highlighted').forEach(el => el.classList.remove('col-highlighted'));

    // Highlight row
    const row = inputEl.closest('tr');
    if (row) row.classList.add('row-highlighted');

    // Highlight column header + all cells in column
    table.querySelectorAll(`[data-col-index="${colIndex}"]`).forEach(el => {
      el.classList.add('col-highlighted');
    });
  }, []);

  // Zoom styles
  const zoomStyles = useMemo(() => {
    const dayW = Math.round(32 * (zoomH / 100));
    const rowH = Math.round(36 * (zoomV / 100));
    const nameW = Math.round(180 * (zoomH / 100));
    const nameH = Math.round(40 * (zoomV / 100));
    const fontSize = 0.85 * (Math.min(zoomH, zoomV) / 100);
    const headerFontSize = 0.7 * (zoomH / 100);
    return { dayW, rowH, nameW, nameH, fontSize, headerFontSize };
  }, [zoomH, zoomV]);

  if (filtered.length === 0) {
    return (
      <div className="cal-empty">
        {search ? 'No se encontraron conductores' : 'No hay trabajadores activos'}
      </div>
    );
  }

  const { dayW, rowH, nameW, fontSize, headerFontSize } = zoomStyles;

  return (
    <div className="cal-grid-wrap" ref={ref}>
      <table className="cal-grid" ref={tableRef} onBlur={handleTableBlur}
        style={{
          '--zoom-day-w': dayW + 'px',
          '--zoom-row-h': rowH + 'px',
          '--zoom-name-w': nameW + 'px',
          '--zoom-font': fontSize + 'rem',
          '--zoom-header-font': headerFontSize + 'rem',
          '--zoom-name-h': Math.round(40 * (zoomV / 100)) + 'px',
          '--zoom-month-font': (0.9 * (zoomH / 100)) + 'rem',
        }}
      >
        <thead>
          {/* Row 1: Month names */}
          <tr>
            <th className="cal-corner" rowSpan={2}>
              Conductor
            </th>
            {monthGroups.map(m => {
              const label = m.year !== year ? `${m.name} ${m.year}` : m.name;
              return (
                <th key={m.key} className="cal-month-header" colSpan={m.days.length}>
                  {label}
                </th>
              );
            })}
          </tr>
          {/* Row 2: Day numbers */}
          <tr>
            {allDays.map((d, i) => (
              <th key={d.fecha}
                className={`cal-day-header ${d.isWeekend ? 'weekend' : ''} ${d.isToday ? 'today' : ''}`}
                data-col-index={i}
              >
                <span className="cal-day-num">{d.day}</span>
                <span className="cal-day-dow">{d.dowLabel}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(w => {
            const displayName = getDisplayName(w);
            return (
              <tr key={w.id}>
                <td className="cal-name-cell" title={displayName}>
                  <span className="cal-worker-name">{displayName}</span>
                </td>
                {allDays.map((d, i) => (
                  <CalendarCell
                    key={d.fecha}
                    status={getStatus(w.id, d.fecha)}
                    isWeekend={d.isWeekend}
                    isSaturday={d.isSaturday}
                    isSunday={d.isSunday}
                    isToday={d.isToday}
                    onChange={(val) => setStatus(w.id, d.fecha, val)}
                    workerId={w.id}
                    fecha={d.fecha}
                    colIndex={i}
                    onFocus={handleCellFocus}
                    autoAdvance={autoAdvance}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

// Clear crosshair when focus leaves table
function handleTableBlur(e) {
  // Only clear if focus moves outside the table
  setTimeout(() => {
    const table = e.currentTarget;
    if (table && !table.contains(document.activeElement)) {
      table.querySelectorAll('.row-highlighted').forEach(el => el.classList.remove('row-highlighted'));
      table.querySelectorAll('.col-highlighted').forEach(el => el.classList.remove('col-highlighted'));
    }
  }, 10);
}

export default CalendarGrid;
