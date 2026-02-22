import { useState } from 'react';
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { MENU } from '../../utils/constants';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ activeModule, onNavigate }) {
  const [expanded, setExpanded] = useState(true);
  const { apiConnected } = useApp();

  return (
    <aside className={`sidebar ${expanded ? '' : 'collapsed'}`}>
      {/* Logo */}
      <div className="sidebar-logo" onClick={() => onNavigate('dashboard')}>
        {expanded ? (
          <>
            <span className="logo-text">UNITRAVEL</span>
            <span className="logo-sub">AUTOCARES</span>
          </>
        ) : (
          <span className="logo-mini">U</span>
        )}
      </div>

      {/* Toggle */}
      <button className="sidebar-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Menu */}
      <nav className="sidebar-nav">
        {MENU.map(group => (
          <div key={group.section} className="sidebar-group">
            {expanded && <div className="sidebar-section">{group.section}</div>}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={!expanded ? item.label : undefined}
                >
                  <Icon size={18} />
                  {expanded && <span>{item.label}</span>}
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
