import { useState } from 'react';
import Header from '../../layout/Header';
import CalendarGrid from './CalendarGrid';
import CalendarLegend from './CalendarLegend';
import { useApp } from '../../../context/AppContext';
import useCalendar from '../../../hooks/useCalendar';
import { MESES_CORTO } from '../../../utils/constants';
import './calendario.css';

export default function Calendario() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const { workers } = useApp();
  const { loading, error, getStatus, setStatus } = useCalendar(year);

  const activos = workers.filter(w => w.activo !== false);

  return (
    <>
      <Header title="Calendario" year={year} onYearChange={setYear} />

      <div className="cal-page">
        {/* Month tabs */}
        <div className="cal-toolbar">
          <div className="cal-month-tabs">
            {MESES_CORTO.map((m, i) => (
              <button
                key={i}
                className={`cal-month-tab ${month === i ? 'active' : ''} ${year === currentYear && i === currentMonth ? 'current' : ''}`}
                onClick={() => setMonth(i)}
              >
                {m}
              </button>
            ))}
          </div>
          <CalendarLegend />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="cal-loading">Cargando calendario...</div>
        ) : error ? (
          <div className="cal-error">
            <p>No se pudieron cargar los datos del calendario</p>
            <p className="cal-error-detail">{error}</p>
          </div>
        ) : (
          <CalendarGrid
            year={year}
            month={month}
            workers={activos}
            getStatus={getStatus}
            setStatus={setStatus}
          />
        )}
      </div>
    </>
  );
}
