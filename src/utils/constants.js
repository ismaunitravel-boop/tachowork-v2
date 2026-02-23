import {
  LayoutDashboard, CalendarDays, Clock, Star, Users,
  CalendarHeart, GraduationCap, Umbrella, FileText,
  Shield, Timer, CalendarCheck,
  UserCog, Bus, BookOpen, Settings,
} from 'lucide-react';

// Sidebar menu structure
export const MENU = [
  {
    section: 'PANEL DE CONTROL',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'PLANIFICACIÓN',
    items: [
      { id: 'calendario', label: 'Calendario', icon: CalendarDays },
    ],
  },
  {
    section: 'CONTROL DE JORNADA',
    items: [
      { id: 'guardias', label: 'Guardias', icon: Shield },
      { id: 'descansos', label: 'Descansos', icon: Timer },
      { id: 'cierres', label: 'Cierres', icon: CalendarCheck },
    ],
  },
  {
    section: 'AUSENCIAS',
    items: [
      { id: 'agenda', label: 'Citas Personales', icon: CalendarHeart },
      { id: 'formaciones', label: 'Formaciones', icon: GraduationCap },
      { id: 'vacaciones', label: 'Vacaciones', icon: Umbrella },
      { id: 'permisos', label: 'Permisos/Bajas', icon: FileText },
    ],
  },
  {
    section: 'EXTRAS',
    items: [
      { id: 'horas-extra', label: 'Horas', icon: Clock },
      { id: 'festivos', label: 'Festivos', icon: Star },
      { id: 'fichas', label: 'Fichas', icon: Users },
    ],
  },
  {
    section: 'PLANTILLA',
    items: [
      { id: 'trabajadores', label: 'Trabajadores', icon: UserCog },
    ],
  },
  {
    section: 'CONFIGURACIÓN',
    items: [
      { id: 'servicios', label: 'Servicios', icon: Bus },
      { id: 'reglas', label: 'Reglas', icon: BookOpen },
      { id: 'ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
];

// Calendar status types - matching Control Laboral default colors
export const STATUS_TYPES = {
  T:  { label: 'Trabajo',            color: '#f7b23b' },
  D:  { label: 'Descanso',           color: '#08bf82' },
  V:  { label: 'Vacaciones',         color: '#a6d3af' },
  P:  { label: 'Permiso',            color: '#8b5cf6' },
  B:  { label: 'Baja Médica',        color: '#a7a5a5' },
  G:  { label: 'Guardia',            color: '#eaed0c', darkText: true },
  GT: { label: 'Guardia Trabajada',  color: '#e49101' },
  GI: { label: 'Guardia Inactiva',   color: '#ffd88a' },
  F:  { label: 'Formación',          color: '#06b6d4' },
};

// Worker types
export const WORKER_TYPES = {
  fijo: { label: 'Fijo', color: '#3b82f6' },
  'fijo-discontinuo': { label: 'Fijo Discontinuo', color: '#f59e0b' },
};

// Month names
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MESES_CORTO = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
