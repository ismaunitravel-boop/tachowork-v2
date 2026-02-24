import { ChevronLeft, ChevronRight, RefreshCw, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ConnectionIndicator from './ConnectionIndicator';

export default function Header({ title, year, onYearChange }) {
  const { loading, theme, toggleTheme } = useApp();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>

      {onYearChange && (
        <div className="header-center">
          <div className="year-selector">
            <button className="year-btn" onClick={() => onYearChange(year - 1)}>
              <ChevronLeft size={18} />
            </button>
            <span className="year-label">{year}</span>
            <button className="year-btn" onClick={() => onYearChange(year + 1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="header-right">
        <ConnectionIndicator />
        {loading && <RefreshCw size={16} className="spin" />}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
