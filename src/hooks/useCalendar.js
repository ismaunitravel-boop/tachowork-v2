import { useState, useEffect, useCallback, useRef } from 'react';
import { calendarioAPI } from '../api/calendario';

/**
 * Calendar hook - manages calendar entries for a given year
 * Data structure: { [workerId]: { ['2026-01-15']: 'T', ... } }
 */
export default function useCalendar(year) {
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const saveQueue = useRef([]);
  const saveTimer = useRef(null);

  // Load calendar data for year
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const raw = await calendarioAPI.getByYear(year);
        if (cancelled) return;
        // Transform array to nested map
        const map = {};
        if (Array.isArray(raw)) {
          raw.forEach(entry => {
            const wId = entry.trabajador_id;
            const fecha = entry.fecha?.split('T')[0];
            if (wId && fecha && entry.estado) {
              if (!map[wId]) map[wId] = {};
              map[wId][fecha] = entry.estado;
            }
          });
        }
        setEntries(map);
      } catch (err) {
        if (!cancelled) {
          console.warn('Calendar load error:', err.message);
          setError(err.message);
          setEntries({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year]);

  // Get status for a specific worker+date
  const getStatus = useCallback((workerId, fecha) => {
    return entries[workerId]?.[fecha] || null;
  }, [entries]);

  // Set status for a specific worker+date (optimistic update + debounced save)
  const setStatus = useCallback((workerId, fecha, estado) => {
    // Optimistic update
    setEntries(prev => {
      const next = { ...prev };
      if (!next[workerId]) next[workerId] = {};
      if (estado) {
        next[workerId] = { ...next[workerId], [fecha]: estado };
      } else {
        // Remove entry
        const copy = { ...next[workerId] };
        delete copy[fecha];
        next[workerId] = copy;
      }
      return next;
    });

    // Add to save queue
    saveQueue.current.push({ trabajador_id: workerId, fecha, estado: estado || '' });

    // Debounce: flush after 500ms of inactivity
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      flushSaves();
    }, 500);
  }, []);

  // Flush pending saves to API
  const flushSaves = useCallback(async () => {
    if (saveQueue.current.length === 0) return;
    const batch = [...saveQueue.current];
    saveQueue.current = [];
    try {
      await calendarioAPI.saveBulk(batch);
    } catch (err) {
      console.error('Calendar save error:', err.message);
      // Re-queue failed entries
      saveQueue.current.push(...batch);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      // Flush remaining saves
      if (saveQueue.current.length > 0) {
        calendarioAPI.saveBulk(saveQueue.current).catch(() => {});
      }
    };
  }, []);

  return { entries, loading, error, getStatus, setStatus, flushSaves };
}
