import { useState, useRef, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import Header from '../../layout/Header';
import CalendarGrid from './CalendarGrid';
import CalendarLegend from './CalendarLegend';
import { useApp } from '../../../context/AppContext';
import { useSettings } from '../../../context/SettingsContext';
import useCalendar from '../../../hooks/useCalendar';
import './calendario.css';

export default function Calendario() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const { workers } = useApp();
  const { settings } = useSettings();
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
      const nameColWidth = 180;
      const scrollLeft = todayEl.offsetLeft - nameColWidth - 100;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll to today on load (respects setting)
  useEffect(() => {
    if (!loading && year === currentYear && settings.calAutoScrollToday) {
      setTimeout(scrollToToday, 150);
    }
  }, [loading, year, currentYear, scrollToToday, settings.calAutoScrollToday]);

  return (
    <>
      <Header title="Calendario" year={year} onYearChange={setYear} />

      <div className="cal-page">
        {/* Toolbar */}
        <div className="cal-toolbar">
          {/* Row 1: Legend (respects setting) */}
          {settings.calShowLegend && (
            <div className="cal-toolbar-legend">
              <CalendarLegend />
            </div>
          )}
          {/* Row 2: Tools */}
          <div className="cal-toolbar-tools">
            <div className="cal-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar conductor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button className="btn-today" onClick={scrollToToday}>
              HOY
            </button>
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
            search={search}
          />
        )}
      </div>
    </>
  );
}
