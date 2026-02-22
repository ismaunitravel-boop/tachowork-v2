import { get, post } from './client';

export const calendarioAPI = {
  getAll: () => get('/calendario'),
  save: (trabajadorId, fecha, estado) =>
    post('/calendario', { trabajador_id: trabajadorId, fecha, estado }),
  saveBulk: (entries) =>
    post('/calendario/bulk', { entries }),
};
