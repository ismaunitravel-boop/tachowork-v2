import { useState, useRef, useEffect, useMemo } from 'react';
import { useSettings } from '../../../context/SettingsContext';

export default function CalendarCell({ status, isWeekend, isSaturday, isSunday, isToday, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const cellRef = useRef(null);
  const pickerRef = useRef(null);
  const { getStatusTypes } = useSettings();
  const statusTypes = useMemo(() => getStatusTypes(), [getStatusTypes]);
  const statusKeys = useMemo(() => Object.keys(statusTypes), [statusTypes]);

  // Close picker on outside click or ESC
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

  const statusInfo = status ? statusTypes[status] : null;

  const classes = [
    'cal-cell',
    isWeekend ? 'weekend' : '',
    isSaturday ? 'saturday' : '',
    isSunday ? 'sunday' : '',
    isToday ? 'today' : '',
    status ? 'has-status' : '',
  ].filter(Boolean).join(' ');

  return (
    <td
      ref={cellRef}
      className={classes}
      onClick={() => setShowPicker(!showPicker)}
    >
      <span
        className="cal-status-letter"
        style={statusInfo ? {
          background: statusInfo.color,
          color: statusInfo.darkText ? '#1e293b' : '#fff',
          fontSize: status && status.length > 1 ? '0.65rem' : '0.85rem',
        } : undefined}
      >
        {status || ''}
      </span>

      {showPicker && (
        <div className="cal-picker" ref={pickerRef}>
          {statusKeys.map(key => (
            <button
              key={key}
              className={`cal-picker-btn ${status === key ? 'active' : ''}`}
              style={{
                background: statusTypes[key].color,
                color: statusTypes[key].darkText ? '#1e293b' : '#fff',
                fontSize: key.length > 1 ? '0.55rem' : '0.7rem',
              }}
              onClick={(e) => { e.stopPropagation(); handleSelect(key); }}
              title={statusTypes[key].label}
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
