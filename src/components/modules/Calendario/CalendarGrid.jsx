import { useMemo } from 'react';
import CalendarCell from './CalendarCell';
import { DIAS_SEMANA } from '../../../utils/constants';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getDayOfWeek(year, month, day) {
  return new Date(year, month, day).getDay();
}

function formatDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function CalendarGrid({ year, month, workers, getStatus, setStatus }) {
  const today = useMemo(() => {
    const d = new Date();
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const daysCount = getDaysInMonth(year, month);

  // Build day headers
  const days = useMemo(() => {
    return Array.from({ length: daysCount }, (_, i) => {
      const day = i + 1;
      const dow = getDayOfWeek(year, month, day);
      const fecha = formatDate(year, month, day);
      return {
        day,
        dow,
        dowLabel: DIAS_SEMANA[dow],
        isWeekend: dow === 0 || dow === 6,
        isToday: fecha === today,
        fecha,
      };
    });
  }, [year, month, daysCount, today]);

  if (workers.length === 0) {
    return <div className="cal-empty">No hay trabajadores activos</div>;
  }

  return (
    <div className="cal-grid-wrap">
      <table className="cal-grid">
        <thead>
          <tr>
            <th className="cal-name-header">Trabajador</th>
            {days.map(d => (
              <th
                key={d.day}
                className={`cal-day-header ${d.isWeekend ? 'weekend' : ''} ${d.isToday ? 'today' : ''}`}
              >
                <span className="cal-day-num">{d.day}</span>
                <span className="cal-day-dow">{d.dowLabel}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workers.map(w => (
            <tr key={w.id}>
              <td className="cal-name-cell">
                <span className="cal-worker-name">{w.nombre}</span>
              </td>
              {days.map(d => (
                <CalendarCell
                  key={d.fecha}
                  status={getStatus(w.id, d.fecha)}
                  isWeekend={d.isWeekend}
                  isToday={d.isToday}
                  onChange={(estado) => setStatus(w.id, d.fecha, estado)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
