import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import Header from '../../layout/Header';
import Modal from '../../common/Modal';
import Notification, { useNotification } from '../../common/Notification';
import WorkerForm from './WorkerForm';
import useWorkers from '../../../hooks/useWorkers';
import { WORKER_TYPES } from '../../../utils/constants';
import './trabajadores.css';

export default function Trabajadores() {
  const { workers, activos, inactivos, createWorker, updateWorker, deleteWorker } = useWorkers();
  const [search, setSearch] = useState('');
  const [showInactivos, setShowInactivos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { notif, show, close } = useNotification();

  const displayed = showInactivos ? inactivos : activos;
  const filtered = displayed.filter(w =>
    w.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setEditWorker(null);
    setModalOpen(true);
  };

  const handleEdit = (worker) => {
    setEditWorker(worker);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editWorker?.id) {
        await updateWorker(editWorker.id, data);
        show('Trabajador actualizado');
      } else {
        await createWorker(data);
        show('Trabajador creado');
      }
      setModalOpen(false);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteWorker(confirmDelete.id);
      show('Trabajador eliminado');
      setConfirmDelete(null);
    } catch (err) {
      show(err.message, 'error');
    }
  };

  return (
    <>
      <Header title="Trabajadores" />
      <Notification notif={notif} onClose={close} />

      <div className="trab-page">
        {/* Toolbar */}
        <div className="trab-toolbar">
          <div className="trab-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar trabajador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="trab-filters">
            <button
              className={`btn btn-sm ${!showInactivos ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowInactivos(false)}
            >
              <UserCheck size={14} /> Activos ({activos.length})
            </button>
            <button
              className={`btn btn-sm ${showInactivos ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowInactivos(true)}
            >
              <UserX size={14} /> Inactivos ({inactivos.length})
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleNew}>
            <Plus size={16} /> Nuevo
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="trab-empty">
            {search ? 'No se encontraron resultados' : 'No hay trabajadores'}
          </div>
        ) : (
          <div className="trab-table-wrap">
            <table className="trab-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Días/sem</th>
                  <th>Horas anuales</th>
                  <th>Vacaciones</th>
                  <th>Teléfono</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id}>
                    <td className="trab-name">{w.nombre}</td>
                    <td>
                      <span
                        className="trab-badge"
                        style={{ background: WORKER_TYPES[w.tipo]?.color || '#94a3b8' }}
                      >
                        {WORKER_TYPES[w.tipo]?.label || w.tipo}
                      </span>
                    </td>
                    <td>{w.diasTrabajoSemana}</td>
                    <td>{w.horasAnuales}h</td>
                    <td>{w.diasVacacionesBase}d</td>
                    <td className="trab-phone">{w.telefono || '—'}</td>
                    <td className="trab-actions">
                      <button className="trab-action-btn" onClick={() => handleEdit(w)} title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button className="trab-action-btn danger" onClick={() => setConfirmDelete(w)} title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editWorker?.id ? 'Editar trabajador' : 'Nuevo trabajador'}
        width={520}
      >
        <WorkerForm
          worker={editWorker}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          saving={saving}
        />
      </Modal>

      {/* Modal confirmar borrado */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar trabajador"
        width={400}
      >
        <p style={{ marginBottom: 16 }}>
          ¿Seguro que quieres eliminar a <strong>{confirmDelete?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </Modal>
    </>
  );
}
