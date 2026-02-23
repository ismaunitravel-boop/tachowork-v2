import { RotateCcw } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { STATUS_TYPES } from '../../../utils/constants';

export default function SectionLeyenda() {
  const { settings, updateStatusColor, resetStatusColors } = useSettings();

  const statuses = Object.entries(STATUS_TYPES);

  return (
    <div className="ajustes-section">
      <div className="ajustes-section-header">
        <div className="ajustes-section-icon icon-leyenda">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
        </div>
        <div>
          <h2>Colores de las Siglas</h2>
          <p>Personaliza los colores de T, D, V, P, B, G, GT y GI en el calendario</p>
        </div>
      </div>

      <div className="color-grid">
        {statuses.map(([key, def]) => {
          const custom = settings.statusColors[key] || { color: def.color, darkText: false };
          return (
            <div key={key} className="color-card">
              <div className="color-card-header">
                <span
                  className="color-badge"
                  style={{
                    background: custom.color,
                    color: custom.darkText ? '#1e293b' : '#fff',
                    fontSize: key.length > 1 ? '0.6rem' : '0.75rem',
                  }}
                >
                  {key}
                </span>
                <span className="color-card-label">{def.label}</span>
              </div>
              <input
                type="color"
                className="color-input"
                value={custom.color}
                onChange={e => updateStatusColor(key, e.target.value, custom.darkText)}
              />
              <label className="color-dark-check">
                <input
                  type="checkbox"
                  checked={custom.darkText || false}
                  onChange={e => updateStatusColor(key, custom.color, e.target.checked)}
                />
                <span>Oscura</span>
              </label>
            </div>
          );
        })}
      </div>

      <div className="color-reset-row">
        <button className="btn btn-secondary" onClick={resetStatusColors}>
          <RotateCcw size={14} />
          Restaurar colores por defecto
        </button>
      </div>
    </div>
  );
}
