import { useMemo, forwardRef } from 'react';
import CalendarCell from './CalendarCell';
import { MESES, DIAS_SEMANA } from '../../../utils/constants';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

const CalendarGrid = forwardRef(function CalendarGrid({ year, workers, getStatus, setStatus, search }, ref) {
  const today = useMemo(() => {
    const d = new Date();
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Filter workers by search
  const filtered = useMemo(() => {
    if (!search) return workers;
    const q = search.toLowerCase();
    return workers.filter(w =>
      w.nombre.toLowerCase().includes(q) ||
      (w.numero || '').toString().includes(q)
    );
  }, [workers, search]);

  // Build all 12 months
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const daysCount = getDaysInMonth(year, m);
      const days = Array.from({ length: daysCount }, (_, i) => {
        const day = i + 1;
        const dow = new Date(year, m, day).getDay();
        const fecha = formatDate(year, m, day);
        return {
          day,
          dow,
          dowLabel: DIAS_SEMANA[dow],
          isWeekend: dow === 0 || dow === 6,
          isSaturday: dow === 6,
          isSunday: dow === 0,
          isToday: fecha === today,
          fecha,
        };
      });
      return { month: m, name: MESES[m], days };
    });
  }, [year, today]);

  if (filtered.length === 0) {
    return (
      <div className="cal-empty">
        {search ? 'No se encontraron conductores' : 'No hay trabajadores activos'}
      </div>
    );
  }

  return (
    <div className="cal-grid-wrap" ref={ref}>
      <table className="cal-grid">
        <thead>
          {/* Row 1: Month names + "Conductor" (rowspan=2) */}
          <tr>
            <th className="cal-corner" rowSpan={2}>Conductor</th>
            {months.map(m => (
              <th
                key={m.month}
                className="cal-month-header"
                colSpan={m.days.length}
              >
                {m.name}
              </th>
            ))}
          </tr>
          {/* Row 2: Day numbers + dow */}
          <tr>
            {months.flatMap(m =>
              m.days.map(d => (
                <th
                  key={d.fecha}
                  className={`cal-day-header ${d.isWeekend ? 'weekend' : ''} ${d.isToday ? 'today' : ''}`}
                >
                  <span className="cal-day-num">{d.day}</span>
                  <span className="cal-day-dow">{d.dowLabel}</span>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {filtered.map(w => {
            const displayName = w.numero
              ? `${w.numero}. ${w.nombre}`
              : w.nombre;

            return (
              <tr key={w.id}>
                <td className="cal-name-cell" title={displayName}>
                  <span className="cal-worker-name">{displayName}</span>
                </td>
                {months.flatMap(m =>
                  m.days.map(d => (
                    <CalendarCell
                      key={d.fecha}
                      status={getStatus(w.id, d.fecha)}
                      isWeekend={d.isWeekend}
                      isSaturday={d.isSaturday}
                      isSunday={d.isSunday}
                      isToday={d.isToday}
                      onChange={(estado) => setStatus(w.id, d.fecha, estado)}
                    />
                  ))
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

export default CalendarGrid;
