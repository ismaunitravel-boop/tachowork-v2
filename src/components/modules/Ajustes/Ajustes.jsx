import { useState } from 'react';
import { CalendarDays, Palette, Settings as SettingsIcon } from 'lucide-react';
import Header from '../../layout/Header';
import SectionLeyenda from './SectionLeyenda';
import SectionCalendario from './SectionCalendario';
import './ajustes.css';

const SECTIONS = [
  { id: 'leyenda',    label: 'Leyenda',    icon: Palette,      desc: 'Colores de las siglas del calendario' },
  { id: 'calendario', label: 'Calendario',  icon: CalendarDays, desc: 'Comportamiento y barra de herramientas' },
];

export default function Ajustes() {
  const [activeSection, setActiveSection] = useState('leyenda');

  return (
    <>
      <Header title="Ajustes" />
      <div className="ajustes-page">
        {/* Sidebar de secciones */}
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

        {/* Contenido */}
        <div className="ajustes-content">
          {activeSection === 'leyenda' && <SectionLeyenda />}
          {activeSection === 'calendario' && <SectionCalendario />}
        </div>
      </div>
    </>
  );
}
