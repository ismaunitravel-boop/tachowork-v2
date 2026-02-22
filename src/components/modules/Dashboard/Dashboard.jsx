import { Users, Wifi, WifiOff, Calendar } from 'lucide-react';
import Header from '../../layout/Header';
import { useApp } from '../../../context/AppContext';

export default function Dashboard() {
  const { workers, apiConnected, loading } = useApp();
  const activos = workers.filter(w => w.activo !== false);

  return (
    <>
      <Header title="Dashboard" />
      <div className="dashboard">
        {loading ? (
          <div className="dashboard-loading">Cargando datos...</div>
        ) : (
          <div className="dashboard-cards">
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: '#3b82f6' }}>
                <Users size={24} color="#fff" />
              </div>
              <div className="dash-card-info">
                <span className="dash-card-value">{activos.length}</span>
                <span className="dash-card-label">Trabajadores activos</span>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: apiConnected ? '#10b981' : '#ef4444' }}>
                {apiConnected ? <Wifi size={24} color="#fff" /> : <WifiOff size={24} color="#fff" />}
              </div>
              <div className="dash-card-info">
                <span className="dash-card-value">{apiConnected ? 'Online' : 'Offline'}</span>
                <span className="dash-card-label">Base de datos</span>
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: '#8b5cf6' }}>
                <Calendar size={24} color="#fff" />
              </div>
              <div className="dash-card-info">
                <span className="dash-card-value">{new Date().getFullYear()}</span>
                <span className="dash-card-label">Año actual</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
