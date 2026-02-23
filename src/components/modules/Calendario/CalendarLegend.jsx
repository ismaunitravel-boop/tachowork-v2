import { useSettings } from '../../../context/SettingsContext';

export default function CalendarLegend() {
  const { getStatusTypes } = useSettings();
  const statuses = getStatusTypes();

  return (
    <div className="cal-legend">
      {Object.entries(statuses).map(([key, { label, color, darkText }]) => (
        <div key={key} className="cal-legend-item">
          <span
            className="cal-legend-dot"
            style={{
              background: color,
              color: darkText ? '#1e293b' : '#fff',
              fontSize: key.length > 1 ? '0.55rem' : '0.7rem',
            }}
          >
            {key}
          </span>
          <span className="cal-legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
