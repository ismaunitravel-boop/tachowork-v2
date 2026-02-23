import { useState, useRef, useCallback, useEffect } from 'react';
import Header from '../../layout/Header';
import CalendarGrid from './CalendarGrid';
import CalendarLegend from './CalendarLegend';
import { useApp } from '../../../context/AppContext';
import useCalendar from '../../../hooks/useCalendar';
import './calendario.css';

export default function Calendario() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { workers } = useApp();
  const { loading, error, getStatus, setStatus } = useCalendar(year);
  const gridRef = useRef(null);

  const activos = workers.filter(w => w.activo !== false)
    .sort((a, b) => (parseInt(a.numero) || 999) - (parseInt(b.numero) || 999));

  // Scroll to today
  const scrollToToday = useCallback(() => {
    if (!gridRef.current) return;
    const todayEl = gridRef.current.querySelector('.cal-day-header.today');
    if (todayEl) {
      const container = gridRef.current;
      const nameColWidth = 160;
      const scrollLeft = todayEl.offsetLeft - nameColWidth - 100;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll to today on load
  useEffect(() => {
    if (!loading && year === currentYear) {
      setTimeout(scrollToToday, 100);
    }
  }, [loading, year, currentYear, scrollToToday]);

  return (
    <>
      <Header title="Calendario" year={year} onYearChange={setYear} />

      <div className="cal-page">
        {/* Toolbar */}
        <div className="cal-toolbar">
          <div className="cal-toolbar-left">
            <button className="btn btn-primary btn-today" onClick={scrollToToday}>
              HOY
            </button>
            <CalendarLegend />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="cal-loading">Cargando calendario...</div>
        ) : error ? (
          <div className="cal-error">
            <p>No se pudieron cargar los datos</p>
            <p className="cal-error-detail">{error}</p>
          </div>
        ) : (
          <CalendarGrid
            ref={gridRef}
            year={year}
            workers={activos}
            getStatus={getStatus}
            setStatus={setStatus}
          />
        )}
      </div>
    </>
  );
}
