import { useState, useEffect } from 'react';
import { WORKER_TYPES } from '../../../utils/constants';

const EMPTY = {
  nombre: '',
  tipo: 'fijo',
  fechaInicio: '',
  fechaFin: '',
  diasTrabajoSemana: 5,
  horasAnuales: 1777,
  diasVacacionesBase: 22,
  email: '',
  telefono: '',
  notas: '',
  activo: true,
};

export default function WorkerForm({ worker, onSave, onCancel, saving }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (worker) {
      setForm({ ...EMPTY, ...worker });
    } else {
      setForm(EMPTY);
    }
  }, [worker]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="worker-form">
      {/* Nombre */}
      <div className="form-group">
        <label className="form-label">Nombre completo *</label>
        <input
          className="form-input"
          type="text"
          value={form.nombre}
          onChange={e => handleChange('nombre', e.target.value)}
          placeholder="Nombre y apellidos"
          required
          autoFocus
        />
      </div>

      {/* Tipo + Activo */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select
            className="form-select"
            value={form.tipo}
            onChange={e => handleChange('tipo', e.target.value)}
          >
            {Object.entries(WORKER_TYPES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estado</label>
          <select
            className="form-select"
            value={form.activo ? 'activo' : 'inactivo'}
            onChange={e => handleChange('activo', e.target.value === 'activo')}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Fechas */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Fecha inicio</label>
          <input
            className="form-input"
            type="date"
            value={form.fechaInicio}
            onChange={e => handleChange('fechaInicio', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Fecha fin</label>
          <input
            className="form-input"
            type="date"
            value={form.fechaFin}
            onChange={e => handleChange('fechaFin', e.target.value)}
          />
        </div>
      </div>

      {/* Jornada */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Días trabajo/semana</label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="7"
            value={form.diasTrabajoSemana}
            onChange={e => handleChange('diasTrabajoSemana', parseInt(e.target.value) || 5)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Horas anuales</label>
          <input
            className="form-input"
            type="number"
            min="0"
            value={form.horasAnuales}
            onChange={e => handleChange('horasAnuales', parseInt(e.target.value) || 1777)}
          />
        </div>
      </div>

      {/* Vacaciones */}
      <div className="form-group">
        <label className="form-label">Días vacaciones base</label>
        <input
          className="form-input"
          type="number"
          min="0"
          max="50"
          value={form.diasVacacionesBase}
          onChange={e => handleChange('diasVacacionesBase', parseInt(e.target.value) || 22)}
        />
      </div>

      {/* Contacto */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            placeholder="email@ejemplo.com"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono</label>
          <input
            className="form-input"
            type="tel"
            value={form.telefono}
            onChange={e => handleChange('telefono', e.target.value)}
            placeholder="600 000 000"
          />
        </div>
      </div>

      {/* Notas */}
      <div className="form-group">
        <label className="form-label">Notas</label>
        <textarea
          className="form-input"
          rows="3"
          value={form.notas}
          onChange={e => handleChange('notas', e.target.value)}
          placeholder="Observaciones..."
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || !form.nombre.trim()}>
          {saving ? 'Guardando...' : (worker?.id ? 'Guardar cambios' : 'Crear trabajador')}
        </button>
      </div>
    </form>
  );
}
