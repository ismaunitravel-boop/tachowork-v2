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

const CalendarGrid = forwardRef(function CalendarGrid({ year, workers, getStatus, setStatus }, ref) {
  const today = useMemo(() => {
    const d = new Date();
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // Build all 12 months of day data
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
          isToday: fecha === today,
          fecha,
        };
      });
      return { month: m, name: MESES[m], days };
    });
  }, [year, today]);

  if (workers.length === 0) {
    return <div className="cal-empty">No hay trabajadores activos</div>;
  }

  return (
    <div className="cal-grid-wrap" ref={ref}>
      <table className="cal-grid">
        {/* HEADER: 3 rows - Month names, Day numbers, Day-of-week */}
        <thead>
          {/* Row 1: Month names */}
          <tr className="cal-month-row">
            <th className="cal-name-header cal-corner">Conductor</th>
            {months.map(m => (
              <th
                key={m.month}
                className={`cal-month-header`}
                colSpan={m.days.length}
              >
                {m.name.toUpperCase()}
              </th>
            ))}
          </tr>
          {/* Row 2: Day numbers + dow */}
          <tr className="cal-days-row">
            <th className="cal-name-header cal-name-sub">&nbsp;</th>
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
          {workers.map(w => (
            <tr key={w.id}>
              <td className="cal-name-cell">
                <span className="cal-worker-num">{w.numero || '—'}</span>
                <span className="cal-worker-name">{w.nombre}</span>
              </td>
              {months.flatMap(m =>
                m.days.map(d => (
                  <CalendarCell
                    key={d.fecha}
                    status={getStatus(w.id, d.fecha)}
                    isWeekend={d.isWeekend}
                    isToday={d.isToday}
                    onChange={(estado) => setStatus(w.id, d.fecha, estado)}
                  />
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default CalendarGrid;
