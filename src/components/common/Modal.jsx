import { useEffect, useRef, useState, useCallback } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function Modal({ open, onClose, title, children, width = 500, dirty = false }) {
  const overlayRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Try to close: if dirty, show confirm first
  const tryClose = useCallback(() => {
    if (dirty) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }, [dirty, onClose]);

  // Force close (after confirm)
  const forceClose = useCallback(() => {
    setShowConfirm(false);
    onClose();
  }, [onClose]);

  // Cancel close attempt
  const cancelClose = useCallback(() => {
    setShowConfirm(false);
  }, []);

  // Reset confirm state when modal opens/closes
  useEffect(() => {
    if (!open) setShowConfirm(false);
  }, [open]);

  // ESC key handler
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showConfirm) {
          cancelClose();
        } else {
          tryClose();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, showConfirm, tryClose, cancelClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={(e) => {
      if (e.target === overlayRef.current) tryClose();
    }}>
      <div className="modal-content" style={{ maxWidth: width }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={tryClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {showConfirm ? (
            <div className="modal-confirm-dirty">
              <div className="confirm-icon">
                <AlertTriangle size={32} />
              </div>
              <p>Tienes cambios sin guardar.</p>
              <p className="confirm-sub">¿Seguro que quieres salir? Los cambios se perderán.</p>
              <div className="confirm-actions">
                <button className="btn btn-secondary" onClick={cancelClose}>
                  Seguir editando
                </button>
                <button className="btn btn-danger" onClick={forceClose}>
                  Descartar cambios
                </button>
              </div>
            </div>
          ) : children}
        </div>
      </div>
    </div>
  );
}
