import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { trabajadoresAPI, workerFromAPI } from '../api';
import { healthAPI } from '../api/health';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState(null);

  // Load workers from API on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const health = await healthAPI.check();
        if (cancelled) return;
        if (health?.status === 'ok') {
          setApiConnected(true);
          const raw = await trabajadoresAPI.getAll();
          if (!cancelled) {
            setWorkers(raw.map(workerFromAPI));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError('No se pudo conectar con el servidor');
          console.warn('API no disponible:', err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Refresh workers
  const refreshWorkers = useCallback(async () => {
    try {
      const raw = await trabajadoresAPI.getAll();
      setWorkers(raw.map(workerFromAPI));
    } catch (err) {
      console.error('Error refreshing workers:', err);
    }
  }, []);

  const value = {
    workers,
    setWorkers,
    loading,
    apiConnected,
    error,
    refreshWorkers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}

export default AppContext;
