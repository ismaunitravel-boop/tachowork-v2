import { get, post } from './client';

export const calendarioAPI = {
  getByYear: (year) => get(`/calendario?year=${year}`),
  getAll: () => get('/calendario'),
  save: (trabajadorId, fecha, estado) =>
    post('/calendario', { trabajador_id: trabajadorId, fecha, estado }),
  saveBulk: (entries) =>
    post('/calendario/bulk', { entries }),
};
