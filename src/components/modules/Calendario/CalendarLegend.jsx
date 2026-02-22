import { STATUS_TYPES } from '../../../utils/constants';

export default function CalendarLegend() {
  return (
    <div className="cal-legend">
      {Object.entries(STATUS_TYPES).map(([key, { label, color }]) => (
        <div key={key} className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: color }}>{key}</span>
          <span className="cal-legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
