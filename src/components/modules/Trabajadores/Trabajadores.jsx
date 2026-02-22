import { useState, useEffect, useRef } from 'react';
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
  const [formDirty, setFormDirty] = useState(false);
  const { notif, show, close } = useNotification();
  const searchRef = useRef(null);

  // ESC clears search when no modal is open
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !modalOpen && !confirmDelete && search) {
        e.preventDefault();
        setSearch('');
        searchRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [modalOpen, confirmDelete, search]);

  const displayed = showInactivos ? inactivos : activos;
  const filtered = displayed.filter(w =>
    w.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setEditWorker(null);
    setFormDirty(false);
    setModalOpen(true);
  };

  const handleEdit = (worker) => {
    setEditWorker(worker);
    setFormDirty(false);
    setModalOpen(true);
  };

  const handleCloseForm = () => {
    setModalOpen(false);
    setFormDirty(false);
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
      setFormDirty(false);
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
              ref={searchRef}
              type="text"
              placeholder="Buscar trabajador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="trab-search-clear" onClick={() => setSearch('')}>
                <span>✕</span>
              </button>
            )}
          </div>

          <div className="trab-filters">
            <button
              className={`btn-filter ${!showInactivos ? 'active' : ''}`}
              onClick={() => setShowInactivos(false)}
            >
              <UserCheck size={14} /> Activos ({activos.length})
            </button>
            <button
              className={`btn-filter ${showInactivos ? 'active' : ''}`}
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
                  <th>Nº</th>
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
                    <td className="trab-numero">{w.numero || '—'}</td>
                    <td className="trab-name">{w.nombre}</td>
                    <td>
                      <span className={`trab-badge ${w.tipo === 'fijo' ? 'trab-badge-fijo' : 'trab-badge-fd'}`}>
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
        onClose={handleCloseForm}
        title={editWorker?.id ? 'Editar trabajador' : 'Nuevo trabajador'}
        width={520}
        dirty={formDirty}
      >
        <WorkerForm
          worker={editWorker}
          onSave={handleSave}
          onCancel={handleCloseForm}
          saving={saving}
          onDirtyChange={setFormDirty}
        />
      </Modal>

      {/* Modal confirmar borrado */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar trabajador"
        width={400}
      >
        <div className="delete-confirm">
          <p>
            ¿Seguro que quieres eliminar a <strong>{confirmDelete?.nombre}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="form-actions" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
