import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Loader } from 'lucide-react';
import { getConnectionState, onConnectionChange } from '../../api/client';
import { healthAPI } from '../../api/health';

export default function ConnectionIndicator() {
  const [state, setState] = useState(getConnectionState);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    return onConnectionChange(setState);
  }, []);

  const retry = useCallback(async () => {
    setChecking(true);
    try {
      await healthAPI.check();
    } catch { /* client.js handles status */ }
    setChecking(false);
  }, []);

  // Time ago helper
  const timeAgo = (date) => {
    if (!date) return '';
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 60) return 'ahora';
    if (secs < 3600) return `hace ${Math.floor(secs / 60)}m`;
    return `hace ${Math.floor(secs / 3600)}h`;
  };

  const { status, lastSync, error } = state;

  if (status === 'unknown') return null;

  const isOk = status === 'connected';
  const isRetrying = status === 'retrying';
  const isError = status === 'error';

  return (
    <div className={`conn-indicator ${isOk ? 'ok' : isRetrying ? 'retrying' : 'error'}`}>
      {isOk && (
        <>
          <Wifi size={13} />
          <span className="conn-text">{timeAgo(lastSync)}</span>
        </>
      )}
      {isRetrying && (
        <>
          <Loader size={13} className="spin" />
          <span className="conn-text">Conectando...</span>
        </>
      )}
      {isError && (
        <>
          <WifiOff size={13} />
          <span className="conn-text">Sin conexión</span>
          <button
            className="conn-retry-btn"
            onClick={retry}
            disabled={checking}
            title={error || 'Reintentar conexión'}
          >
            <RefreshCw size={12} className={checking ? 'spin' : ''} />
          </button>
        </>
      )}
    </div>
  );
}
