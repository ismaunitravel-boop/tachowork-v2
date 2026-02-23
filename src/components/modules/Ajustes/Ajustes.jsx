import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import Header from '../../layout/Header';
import SectionCalendario from './SectionCalendario';
import './ajustes.css';

const SECTIONS = [
  { id: 'calendario', label: 'Calendario',  icon: CalendarDays, desc: 'Leyenda, comportamiento y barra de herramientas' },
];

export default function Ajustes() {
  const [activeSection, setActiveSection] = useState('calendario');

  return (
    <>
      <Header title="Ajustes" />
      <div className="ajustes-page">
        <div className="ajustes-nav">
          <div className="ajustes-nav-title">Configuración</div>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                className={`ajustes-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <div className={`ajustes-nav-icon icon-${s.id}`}>
                  <Icon size={18} />
                </div>
                <div className="ajustes-nav-text">
                  <span className="ajustes-nav-label">{s.label}</span>
                  <span className="ajustes-nav-desc">{s.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="ajustes-content">
          {activeSection === 'calendario' && <SectionCalendario />}
        </div>
      </div>
    </>
  );
}
