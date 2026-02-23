import { GripVertical } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

export default function SectionCalendario() {
  const { settings, updateSetting, toggleToolbarItem, setAllToolbarVisible } = useSettings();

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

  return (
    <div className="ajustes-section">
      {/* Toggles */}
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

      {/* Toolbar config */}
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
