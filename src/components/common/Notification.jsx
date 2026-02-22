import { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

// Hook
export function useNotification() {
  const [notif, setNotif] = useState(null);

  const show = useCallback((message, type = 'success') => {
    setNotif({ message, type });
    setTimeout(() => setNotif(null), 3000);
  }, []);

  const close = useCallback(() => setNotif(null), []);

  return { notif, show, close };
}

// Component
export default function Notification({ notif, onClose }) {
  if (!notif) return null;

  return (
    <div className={`notification ${notif.type}`}>
      {notif.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span>{notif.message}</span>
      <button className="notif-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
}
