import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { trabajadoresAPI, workerFromAPI, workerToAPI } from '../api';

export default function useWorkers() {
  const { workers, refreshWorkers, apiConnected } = useApp();

  const createWorker = useCallback(async (data) => {
    if (!apiConnected) throw new Error('Sin conexión a la API');
    const result = await trabajadoresAPI.create(workerToAPI(data));
    await refreshWorkers();
    return result;
  }, [apiConnected, refreshWorkers]);

  const updateWorker = useCallback(async (id, data) => {
    if (!apiConnected) throw new Error('Sin conexión a la API');
    const result = await trabajadoresAPI.update(id, workerToAPI(data));
    await refreshWorkers();
    return result;
  }, [apiConnected, refreshWorkers]);

  const deleteWorker = useCallback(async (id) => {
    if (!apiConnected) throw new Error('Sin conexión a la API');
    await trabajadoresAPI.delete(id);
    await refreshWorkers();
  }, [apiConnected, refreshWorkers]);

  const activos = workers.filter(w => w.activo !== false);
  const inactivos = workers.filter(w => w.activo === false);

  return {
    workers,
    activos,
    inactivos,
    createWorker,
    updateWorker,
    deleteWorker,
  };
}
