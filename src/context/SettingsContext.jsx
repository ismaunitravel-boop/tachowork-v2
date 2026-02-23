import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STATUS_TYPES as DEFAULT_STATUS } from '../utils/constants';

const SettingsContext = createContext(null);

const LS_KEY = 'tw-settings';

// Default settings
const DEFAULTS = {
  // -- Leyenda: colores de siglas --
  statusColors: Object.fromEntries(
    Object.entries(DEFAULT_STATUS).map(([k, v]) => [k, { color: v.color, darkText: !!v.darkText }])
  ),

  // -- Calendario: comportamiento --
  calAutoScrollToday: true,
  calShowLegend: true,
  calAutoAdvance: true,

  // -- Calendario: barra de herramientas (orden + visibilidad) --
  calToolbar: [
    { id: 'search',   label: 'Buscar conductor',     visible: true },
    { id: 'filter',   label: 'Filtrar conductores',   visible: true },
    { id: 'today',    label: 'Botón HOY',             visible: true },
    { id: 'zoom',     label: 'Zoom',                  visible: true },
    { id: 'sort',     label: 'Ordenar',               visible: false },
    { id: 'display',  label: 'Mostrar (Nº/Nombre)',   visible: false },
    { id: 'view',     label: 'Selector de vista',     visible: true },
    { id: 'export',   label: 'Exportar',              visible: false },
    { id: 'import',   label: 'Importar',              visible: false },
    { id: 'print',    label: 'Imprimir',              visible: true },
    { id: 'save',     label: 'Guardar',               visible: true },
    { id: 'guardias', label: 'Guardias',              visible: true },
  ],
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new fields
      return {
        ...DEFAULTS,
        ...parsed,
        statusColors: { ...DEFAULTS.statusColors, ...(parsed.statusColors || {}) },
        calToolbar: parsed.calToolbar || DEFAULTS.calToolbar,
      };
    }
  } catch (e) {
    console.warn('Error loading settings:', e);
  }
  return { ...DEFAULTS };
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update a status color
  const updateStatusColor = useCallback((statusKey, color, darkText) => {
    setSettings(prev => ({
      ...prev,
      statusColors: {
        ...prev.statusColors,
        [statusKey]: { color, darkText },
      },
    }));
  }, []);

  // Reset status colors to defaults
  const resetStatusColors = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      statusColors: { ...DEFAULTS.statusColors },
    }));
  }, []);

  // Toggle toolbar item visibility
  const toggleToolbarItem = useCallback((itemId) => {
    setSettings(prev => ({
      ...prev,
      calToolbar: prev.calToolbar.map(t =>
        t.id === itemId ? { ...t, visible: !t.visible } : t
      ),
    }));
  }, []);

  // Reorder toolbar items
  const reorderToolbar = useCallback((newOrder) => {
    setSettings(prev => ({ ...prev, calToolbar: newOrder }));
  }, []);

  // Show all / hide all toolbar
  const setAllToolbarVisible = useCallback((visible) => {
    setSettings(prev => ({
      ...prev,
      calToolbar: prev.calToolbar.map(t => ({ ...t, visible })),
    }));
  }, []);

  // Get effective status types (colors from settings, labels from defaults)
  const getStatusTypes = useCallback(() => {
    const result = {};
    for (const [key, def] of Object.entries(DEFAULT_STATUS)) {
      const custom = settings.statusColors[key];
      result[key] = {
        label: def.label,
        color: custom?.color || def.color,
        darkText: custom?.darkText ?? def.darkText ?? false,
      };
    }
    return result;
  }, [settings.statusColors]);

  const value = {
    settings,
    updateSetting,
    updateStatusColor,
    resetStatusColors,
    toggleToolbarItem,
    reorderToolbar,
    setAllToolbarVisible,
    getStatusTypes,
    DEFAULTS,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return ctx;
}
