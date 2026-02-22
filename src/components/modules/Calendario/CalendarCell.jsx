import { useState, useRef, useEffect } from 'react';
import { STATUS_TYPES } from '../../../utils/constants';

const STATUS_KEYS = Object.keys(STATUS_TYPES);

export default function CalendarCell({ status, isWeekend, isToday, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const cellRef = useRef(null);
  const pickerRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          cellRef.current && !cellRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showPicker]);

  const handleSelect = (key) => {
    onChange(status === key ? null : key);
    setShowPicker(false);
  };

  const statusInfo = status ? STATUS_TYPES[status] : null;

  return (
    <td
      ref={cellRef}
      className={`cal-cell ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''} ${status ? 'has-status' : ''}`}
      onClick={() => setShowPicker(!showPicker)}
    >
      {status && (
        <span
          className="cal-status"
          style={{ background: statusInfo?.color }}
        >
          {status}
        </span>
      )}

      {showPicker && (
        <div className="cal-picker" ref={pickerRef}>
          {STATUS_KEYS.map(key => (
            <button
              key={key}
              className={`cal-picker-btn ${status === key ? 'active' : ''}`}
              style={{ background: STATUS_TYPES[key].color }}
              onClick={(e) => { e.stopPropagation(); handleSelect(key); }}
              title={STATUS_TYPES[key].label}
            >
              {key}
            </button>
          ))}
          {status && (
            <button
              className="cal-picker-btn cal-picker-clear"
              onClick={(e) => { e.stopPropagation(); handleSelect(status); }}
              title="Quitar"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </td>
  );
}
