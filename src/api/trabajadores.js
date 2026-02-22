import { get, post, put, del } from './client';

export const trabajadoresAPI = {
  getAll: () => get('/trabajadores'),
  create: (data) => post('/trabajadores', data),
  update: (id, data) => put(`/trabajadores/${id}`, data),
  delete: (id) => del(`/trabajadores/${id}`),
};

// API → Frontend mapping
export function fromAPI(w) {
  return {
    id: w.id,
    numero: w.numero,
    nombre: w.nombre,
    tipo: w.tipo || 'fijo',
    fechaInicio: w.fecha_inicio?.split('T')[0] || '',
    fechaFin: w.fecha_fin?.split('T')[0] || '',
    diasTrabajoSemana: w.dias_trabajo_semana || 5,
    horasAnuales: w.horas_anuales || 1777,
    diasVacacionesBase: w.dias_vacaciones_base || 22,
    email: w.email || '',
    telefono: w.telefono || '',
    notas: w.notas || '',
    activo: w.activo !== false,
  };
}

// Frontend → API mapping
export function toAPI(w) {
  return {
    nombre: w.nombre,
    tipo: w.tipo || 'fijo',
    fecha_inicio: w.fechaInicio || null,
    fecha_fin: w.fechaFin || null,
    dias_trabajo_semana: w.diasTrabajoSemana || 5,
    horas_anuales: w.horasAnuales || 1777,
    dias_vacaciones_base: w.diasVacacionesBase || 22,
    email: w.email || null,
    telefono: w.telefono || null,
    notas: w.notas || null,
    activo: w.activo !== false,
  };
}
