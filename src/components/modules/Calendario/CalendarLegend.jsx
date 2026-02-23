import { STATUS_TYPES } from '../../../utils/constants';

export default function CalendarLegend() {
  return (
    <div className="cal-legend">
      {Object.entries(STATUS_TYPES).map(([key, { label, color, darkText }]) => (
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
