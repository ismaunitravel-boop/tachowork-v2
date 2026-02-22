import { get } from './client';

export const healthAPI = {
  check: () => get('/health'),
};
