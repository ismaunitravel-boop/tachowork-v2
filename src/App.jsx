import { useState, useCallback } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './components/modules/Dashboard/Dashboard';
import Trabajadores from './components/modules/Trabajadores/Trabajadores';
import Calendario from './components/modules/Calendario/Calendario';
import Ajustes from './components/modules/Ajustes/Ajustes';
import Placeholder from './components/common/Placeholder';
import useKeyboardNav from './hooks/useKeyboardNav';

const MODULE_LABELS = {
  'dashboard': 'Dashboard',
  'calendario': 'Calendario',
  'horas-extra': 'Horas Extra',
  'festivos': 'Festivos',
  'fichas': 'Fichas',
  'agenda': 'Citas Personales',
  'formaciones': 'Formaciones',
  'vacaciones': 'Vacaciones',
  'permisos': 'Permisos / Bajas',
  'guardias': 'Guardias',
  'descansos': 'Descansos',
  'cierres': 'Cierres',
  'trabajadores': 'Trabajadores',
  'servicios': 'Servicios',
  'reglas': 'Reglas',
  'ajustes': 'Ajustes',
};

function renderModule(id) {
  switch (id) {
    case 'dashboard': return <Dashboard />;
    case 'trabajadores': return <Trabajadores />;
    case 'calendario': return <Calendario />;
    case 'ajustes': return <Ajustes />;
    default: return <Placeholder title={MODULE_LABELS[id] || id} />;
  }
}

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const navigate = useCallback((id) => setActiveModule(id), []);

  // Alt+1..9 keyboard shortcuts
  useKeyboardNav(navigate);

  return (
    <Layout activeModule={activeModule} onNavigate={navigate}>
      {renderModule(activeModule)}
    </Layout>
  );
}
