import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Search, Filter, ChevronDown, Printer, Save, Download, Upload,
  ZoomIn, ZoomOut, RotateCcw, X,
} from 'lucide-react';
import Header from '../../layout/Header';
import CalendarGrid from './CalendarGrid';
import CalendarLegend from './CalendarLegend';
import { useApp } from '../../../context/AppContext';
import { useSettings } from '../../../context/SettingsContext';
import useCalendar from '../../../hooks/useCalendar';
import { MESES } from '../../../utils/constants';
import './calendario.css';

export default function Calendario() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const { workers } = useApp();
  const { settings } = useSettings();
  const { loading, error, getStatus, setStatus } = useCalendar(year);
  const gridRef = useRef(null);

  // --- Toolbar state ---
  const [viewMode, setViewMode] = useState('all');
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewCierreMonth, setViewCierreMonth] = useState(new Date().getMonth());
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [sortBy, setSortBy] = useState('number');
  const [displayMode, setDisplayMode] = useState('both');
  const [zoomH, setZoomH] = useState(() => {
    const s = localStorage.getItem('tw-zoomH'); return s ? parseInt(s) : 100;
  });
  const [zoomV, setZoomV] = useState(() => {
    const s = localStorage.getItem('tw-zoomV'); return s ? parseInt(s) : 100;
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [hiddenWorkers, setHiddenWorkers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tw-hiddenWorkers') || '{}'); } catch { return {}; }
  });
  const [filterSearch, setFilterSearch] = useState('');

  const activos = useMemo(() =>
    workers.filter(w => w.activo !== false)
      .sort((a, b) => (parseInt(a.numero) || 999) - (parseInt(b.numero) || 999)),
    [workers]
  );

  // Persist zoom + hidden
  useEffect(() => { localStorage.setItem('tw-zoomH', zoomH); }, [zoomH]);
  useEffect(() => { localStorage.setItem('tw-zoomV', zoomV); }, [zoomV]);
  useEffect(() => { localStorage.setItem('tw-hiddenWorkers', JSON.stringify(hiddenWorkers)); }, [hiddenWorkers]);

  // --- Toolbar helpers ---
  const isToolVisible = useCallback((id) => {
    const t = settings.calToolbar?.find(t => t.id === id);
    return t ? t.visible : true;
  }, [settings.calToolbar]);

  const adjustZoom = (dir, delta) => {
    if (dir === 'h') setZoomH(z => Math.max(50, Math.min(200, z + delta)));
    else setZoomV(z => Math.max(50, Math.min(200, z + delta)));
  };

  const resetZoom = () => { setZoomH(100); setZoomV(100); };

  // Scroll to today
  const scrollToToday = useCallback(() => {
    if (!gridRef.current) return;
    const todayEl = gridRef.current.querySelector('.cal-day-header.today');
    if (todayEl) {
      const container = gridRef.current;
      const scrollLeft = todayEl.offsetLeft - 200;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll on load
  useEffect(() => {
    if (!loading && year === currentYear && settings.calAutoScrollToday) {
      setTimeout(scrollToToday, 200);
    }
  }, [loading, year, currentYear, scrollToToday, settings.calAutoScrollToday]);

  // Filter helpers
  const hiddenCount = useMemo(() => Object.values(hiddenWorkers).filter(Boolean).length, [hiddenWorkers]);

  const toggleWorkerVisibility = (id) => {
    setHiddenWorkers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAll = () => setHiddenWorkers({});
  const deselectAll = () => {
    const h = {};
    activos.forEach(w => { h[w.id] = true; });
    setHiddenWorkers(h);
  };

  const filteredForPanel = useMemo(() => {
    if (!filterSearch) return activos;
    const q = filterSearch.toLowerCase();
    return activos.filter(w =>
      w.nombre.toLowerCase().includes(q) || (w.numero || '').toString().includes(q)
    );
  }, [activos, filterSearch]);

  return (
    <>
      <Header title="Calendario" year={year} onYearChange={setYear} />

      <div className="cal-page">
        {/* === TOOLBAR === */}
        <div className="cal-toolbar">
          {/* Legend row */}
          {settings.calShowLegend && (
            <div className="cal-toolbar-legend">
              <CalendarLegend />
            </div>
          )}

          {/* Tools row */}
          <div className="cal-toolbar-tools">
            {/* Vista */}
            {isToolVisible('view') && (
              <div className="cal-tool-group">
                <label>Vista:</label>
                <select value={viewMode} onChange={e => setViewMode(e.target.value)}>
                  <option value="all">Todos los meses</option>
                  <option value="month">Mes individual</option>
                  <option value="cierre">Cierre (26-25)</option>
                  <option value="last56">Últimos 56 días</option>
                  <option value="range">Rango de fechas</option>
                </select>
                {viewMode === 'month' && (
                  <select value={viewMonth} onChange={e => setViewMonth(parseInt(e.target.value))}>
                    {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                )}
                {viewMode === 'cierre' && (
                  <select value={viewCierreMonth} onChange={e => setViewCierreMonth(parseInt(e.target.value))}>
                    {MESES.map((m, i) => <option key={i} value={i}>{m} {year}</option>)}
                  </select>
                )}
                {viewMode === 'range' && (
                  <>
                    <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
                    <span className="cal-range-sep">hasta</span>
                    <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
                  </>
                )}
              </div>
            )}

            {/* Filter */}
            {isToolVisible('filter') && (
              <div className="cal-filter-wrap">
                <button
                  className="btn-tool"
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  <Filter size={14} />
                  Filtrar
                  {hiddenCount > 0 && <span className="cal-filter-badge">-{hiddenCount}</span>}
                </button>
                {filterOpen && (
                  <div className="cal-filter-panel">
                    <div className="cal-filter-panel-header">
                      <h4>Filtrar Conductores</h4>
                      <button className="cal-filter-close" onClick={() => setFilterOpen(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="cal-filter-search">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                      />
                    </div>
                    <div className="cal-filter-list">
                      {filteredForPanel.map(w => (
                        <label key={w.id} className="cal-filter-item">
                          <input
                            type="checkbox"
                            checked={!hiddenWorkers[w.id]}
                            onChange={() => toggleWorkerVisibility(w.id)}
                          />
                          <span>{w.numero ? `${w.numero}. ${w.nombre}` : w.nombre}</span>
                        </label>
                      ))}
                    </div>
                    <div className="cal-filter-actions">
                      <button className="btn btn-sm" onClick={selectAll}>Todos</button>
                      <button className="btn btn-sm" onClick={deselectAll}>Ninguno</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            {isToolVisible('search') && (
              <div className="cal-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar conductor..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            {/* Zoom */}
            {isToolVisible('zoom') && (
              <div className="cal-zoom">
                <span className="cal-zoom-label">Zoom:</span>
                <button className="cal-zoom-btn" onClick={() => adjustZoom('h', -10)} title="Reducir horizontal">H−</button>
                <span className="cal-zoom-val">{zoomH}%</span>
                <button className="cal-zoom-btn" onClick={() => adjustZoom('h', 10)} title="Aumentar horizontal">H+</button>
                <button className="cal-zoom-btn" onClick={() => adjustZoom('v', -10)} title="Reducir vertical">V−</button>
                <span className="cal-zoom-val">{zoomV}%</span>
                <button className="cal-zoom-btn" onClick={() => adjustZoom('v', 10)} title="Aumentar vertical">V+</button>
                <button className="cal-zoom-btn" onClick={resetZoom} title="Restablecer">↺</button>
              </div>
            )}

            {/* HOY */}
            {isToolVisible('today') && (
              <button className="btn-today" onClick={scrollToToday}>HOY</button>
            )}

            {/* Sort */}
            {isToolVisible('sort') && (
              <div className="cal-tool-group">
                <label>Ordenar:</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="number">Número</option>
                  <option value="name">Nombre</option>
                </select>
              </div>
            )}

            {/* Display */}
            {isToolVisible('display') && (
              <div className="cal-tool-group">
                <label>Mostrar:</label>
                <select value={displayMode} onChange={e => setDisplayMode(e.target.value)}>
                  <option value="both">Nº y Nombre</option>
                  <option value="number">Solo Nº</option>
                  <option value="name">Solo Nombre</option>
                </select>
              </div>
            )}

            {/* Print */}
            {isToolVisible('print') && (
              <button className="btn-tool" onClick={() => window.print()} title="Imprimir">
                <Printer size={14} /> Imprimir
              </button>
            )}

            {/* Save */}
            {isToolVisible('save') && (
              <button className="btn-tool btn-tool-success" title="Guardar">
                <Save size={14} /> Guardar
              </button>
            )}
          </div>
        </div>

        {/* === GRID === */}
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
            viewMode={viewMode}
            viewMonth={viewMonth}
            viewCierreMonth={viewCierreMonth}
            viewRangeStart={rangeStart}
            viewRangeEnd={rangeEnd}
            sortBy={sortBy}
            displayMode={displayMode}
            hiddenWorkers={hiddenWorkers}
            autoAdvance={settings.calAutoAdvance}
            zoomH={zoomH}
            zoomV={zoomV}
          />
        )}
      </div>
    </>
  );
}
