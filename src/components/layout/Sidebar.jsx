import { useState } from 'react';
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { MENU } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

// Flat index for shortcut hints (Alt+1..9, Alt+0)
const FLAT_ITEMS = MENU.flatMap(g => g.items);
function getShortcut(itemId) {
  const idx = FLAT_ITEMS.findIndex(i => i.id === itemId);
  if (idx < 0 || idx > 9) return null;
  return idx === 9 ? '0' : String(idx + 1);
}

export default function Sidebar({ activeModule, onNavigate }) {
  const [expanded, setExpanded] = useState(true);
  const { apiConnected } = useApp();

  return (
    <aside className={`sidebar ${expanded ? '' : 'collapsed'}`}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => onNavigate('dashboard')}>
        {expanded ? (
          <span className="logo-text">TachoWork</span>
        ) : (
          <span className="logo-mini">TW</span>
        )}
      </div>

      {/* Toggle */}
      <button className="sidebar-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Menu */}
      <nav className="sidebar-nav">
        {MENU.map(group => (
          <div key={group.section} className="sidebar-group">
            {expanded && <div className="sidebar-section">{group.section}</div>}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              const shortcut = getShortcut(item.id);
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={!expanded ? `${item.label}${shortcut ? ` (Alt+${shortcut})` : ''}` : undefined}
                >
                  <Icon size={18} />
                  {expanded && (
                    <>
                      <span>{item.label}</span>
                      {shortcut && <kbd className="sidebar-kbd">Alt+{shortcut}</kbd>}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Status */}
      <div className="sidebar-footer">
        {expanded ? (
          <div className={`api-status ${apiConnected ? 'connected' : 'disconnected'}`}>
            {apiConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{apiConnected ? 'Conectado' : 'Sin conexión'}</span>
          </div>
        ) : (
          <div className={`api-status-dot ${apiConnected ? 'connected' : 'disconnected'}`} />
        )}
      </div>
    </aside>
  );
}
