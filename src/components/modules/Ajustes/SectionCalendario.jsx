import { GripVertical, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { STATUS_TYPES } from '../../../utils/constants';

export default function SectionCalendario() {
  const { settings, updateSetting, updateStatusColor, resetStatusColors, toggleToolbarItem, setAllToolbarVisible } = useSettings();
  const [colorsOpen, setColorsOpen] = useState(true);

  const toggles = [
    {
      key: 'calAutoScrollToday',
      label: 'Ir al día actual automáticamente',
      desc: 'Al abrir el calendario, se desplazará automáticamente hasta el día de hoy',
    },
    {
      key: 'calShowLegend',
      label: 'Mostrar leyenda de códigos',
      desc: 'Muestra u oculta la leyenda de colores (T, D, V, P, B) en el calendario',
    },
    {
      key: 'calAutoAdvance',
      label: 'Auto-avance inteligente',
      desc: 'Al escribir un valor (T, D, etc.), salta automáticamente a la siguiente celda editable, omitiendo las bloqueadas',
    },
  ];

  const statuses = Object.entries(STATUS_TYPES);

  return (
    <div className="ajustes-section">

      {/* --- Toggles --- */}
      <div className="ajustes-toggles-card">
        {toggles.map((t, i) => (
          <div key={t.key} className={`ajustes-toggle-row ${i < toggles.length - 1 ? 'with-border' : ''}`}>
            <div className="ajustes-toggle-text">
              <strong>{t.label}</strong>
              <span>{t.desc}</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings[t.key]}
                onChange={() => updateSetting(t.key, !settings[t.key])}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* --- Leyenda: Colores de Siglas --- */}
      <div className="ajustes-collapsible">
        <button className="ajustes-collapsible-header" onClick={() => setColorsOpen(!colorsOpen)}>
          <div className="ajustes-collapsible-icon icon-leyenda">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
          </div>
          <div className="ajustes-collapsible-text">
            <h3>Colores de las Siglas</h3>
            <p>Personaliza los colores de T, D, V, P, B, G, GT y GI en el calendario</p>
          </div>
          {colorsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {colorsOpen && (
          <div className="ajustes-collapsible-body">
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
        )}
      </div>

      {/* --- Barra de herramientas --- */}
      <div className="ajustes-toolbar-section">
        <div className="ajustes-toolbar-header">
          <div className="ajustes-toolbar-icon">☰</div>
          <div>
            <h3>Barra de Herramientas</h3>
            <p>Selecciona las herramientas que quieres mostrar y arrástralas (☰) para reordenar.</p>
          </div>
        </div>

        <div className="toolbar-items-list">
          {settings.calToolbar.map((item) => (
            <div key={item.id} className={`toolbar-item-row ${item.visible ? 'is-visible' : ''}`}>
              <div className="toolbar-item-grip">
                <GripVertical size={16} />
              </div>
              <label className="toolbar-item-check">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={() => toggleToolbarItem(item.id)}
                />
                <span className="toolbar-checkmark"></span>
              </label>
              <span className="toolbar-item-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="toolbar-bulk-actions">
          <button className="btn btn-secondary" onClick={() => setAllToolbarVisible(true)}>
            Mostrar todo
          </button>
          <button className="btn btn-secondary" onClick={() => setAllToolbarVisible(false)}>
            Ocultar todo
          </button>
        </div>
      </div>
    </div>
  );
}
