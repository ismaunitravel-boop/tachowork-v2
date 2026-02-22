const { getConnection } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = context.bindingData.restOfPath || '';
  const parts = path.split('/').filter(Boolean);

  try {
    const pool = await getConnection();

    // GET /agenda/resumen
    if (method === 'GET' && parts[0] === 'resumen') {
      const result = await pool.request().query(`SELECT COUNT(*) as total, SUM(CASE WHEN completado = 0 THEN 1 ELSE 0 END) as pendientes, SUM(CASE WHEN fecha = CAST(GETDATE() AS DATE) AND completado = 0 THEN 1 ELSE 0 END) as hoy, SUM(CASE WHEN tipo = 'tarea' AND completado = 0 THEN 1 ELSE 0 END) as tareas_pendientes, SUM(CASE WHEN fecha < CAST(GETDATE() AS DATE) AND completado = 0 THEN 1 ELSE 0 END) as vencidos FROM agenda_eventos`);
      context.res = { status: 200, headers: J, body: result.recordset[0] };
    }
    // GET /agenda/eventos/hoy
    else if (method === 'GET' && parts[0] === 'eventos' && parts[1] === 'hoy') {
      const result = await pool.request().query(`SELECT id, titulo, descripcion, tipo, fecha, hora, duracion, lugar, completado, trabajador_id, notas FROM agenda_eventos WHERE fecha = CAST(GETDATE() AS DATE) AND completado = 0 ORDER BY hora ASC`);
      context.res = { status: 200, headers: J, body: result.recordset };
    }
    // PATCH /agenda/eventos/{id}/toggle
    else if (method === 'PATCH' && parts[0] === 'eventos' && parts[2] === 'toggle') {
      const result = await pool.request().input('id', parts[1]).query(`UPDATE agenda_eventos SET completado = CASE WHEN completado = 1 THEN 0 ELSE 1 END, updated_at = GETDATE() OUTPUT INSERTED.* WHERE id = @id`);
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Evento no encontrado' } }; return; }
      context.res = { status: 200, headers: J, body: result.recordset[0] };
    }
    // GET /agenda/eventos/{id}
    else if (method === 'GET' && parts[0] === 'eventos' && parts[1]) {
      const result = await pool.request().input('id', parts[1]).query(`SELECT e.*, t.nombre as trabajador_nombre FROM agenda_eventos e LEFT JOIN trabajadores t ON e.trabajador_id = t.id WHERE e.id = @id`);
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Evento no encontrado' } }; return; }
      context.res = { status: 200, headers: J, body: result.recordset[0] };
    }
    // GET /agenda/eventos
    else if (method === 'GET' && parts[0] === 'eventos') {
      const tipo = req.query.tipo;
      const fechaDesde = req.query.fecha_desde;
      const fechaHasta = req.query.fecha_hasta;
      const completado = req.query.completado;
      let q = 'SELECT id, titulo, descripcion, tipo, fecha, hora, duracion, lugar, completado, trabajador_id, notas, created_at FROM agenda_eventos WHERE 1=1';
      const request = pool.request();
      if (tipo && tipo !== 'todos') { q += ' AND tipo = @tipo'; request.input('tipo', tipo); }
      if (fechaDesde) { q += ' AND fecha >= @fechaDesde'; request.input('fechaDesde', fechaDesde); }
      if (fechaHasta) { q += ' AND fecha <= @fechaHasta'; request.input('fechaHasta', fechaHasta); }
      if (completado !== undefined && completado !== null) { q += ' AND completado = @completado'; request.input('completado', completado === 'true' || completado === '1'); }
      q += ' ORDER BY fecha ASC, hora ASC';
      const result = await request.query(q);
      context.res = { status: 200, headers: J, body: result.recordset };
    }
    // POST /agenda/eventos
    else if (method === 'POST' && parts[0] === 'eventos') {
      const body = req.body;
      if (!body.titulo || !body.fecha) { context.res = { status: 400, headers: J, body: { error: 'Título y fecha son obligatorios' } }; return; }
      const result = await pool.request()
        .input('titulo', body.titulo).input('descripcion', body.descripcion || null).input('tipo', body.tipo || 'cita')
        .input('fecha', body.fecha).input('hora', body.hora || null).input('duracion', body.duracion || null)
        .input('lugar', body.lugar || null).input('trabajadorId', body.trabajador_id || null).input('notas', body.notas || null)
        .query('INSERT INTO agenda_eventos (titulo, descripcion, tipo, fecha, hora, duracion, lugar, trabajador_id, notas) OUTPUT INSERTED.* VALUES (@titulo, @descripcion, @tipo, @fecha, @hora, @duracion, @lugar, @trabajadorId, @notas)');
      context.res = { status: 201, headers: J, body: result.recordset[0] };
    }
    // PUT /agenda/eventos/{id}
    else if (method === 'PUT' && parts[0] === 'eventos' && parts[1]) {
      const body = req.body;
      const fields = [];
      const request = pool.request().input('id', parts[1]);
      if (body.titulo !== undefined) { fields.push('titulo = @titulo'); request.input('titulo', body.titulo); }
      if (body.descripcion !== undefined) { fields.push('descripcion = @descripcion'); request.input('descripcion', body.descripcion); }
      if (body.tipo !== undefined) { fields.push('tipo = @tipo'); request.input('tipo', body.tipo); }
      if (body.fecha !== undefined) { fields.push('fecha = @fecha'); request.input('fecha', body.fecha); }
      if (body.hora !== undefined) { fields.push('hora = @hora'); request.input('hora', body.hora); }
      if (body.duracion !== undefined) { fields.push('duracion = @duracion'); request.input('duracion', body.duracion); }
      if (body.lugar !== undefined) { fields.push('lugar = @lugar'); request.input('lugar', body.lugar); }
      if (body.completado !== undefined) { fields.push('completado = @completado'); request.input('completado', body.completado); }
      if (body.notas !== undefined) { fields.push('notas = @notas'); request.input('notas', body.notas); }
      if (fields.length === 0) { context.res = { status: 400, headers: J, body: { error: 'No hay campos para actualizar' } }; return; }
      fields.push('updated_at = GETDATE()');
      const result = await request.query(`UPDATE agenda_eventos SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`);
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Evento no encontrado' } }; return; }
      context.res = { status: 200, headers: J, body: result.recordset[0] };
    }
    // DELETE /agenda/eventos/{id}
    else if (method === 'DELETE' && parts[0] === 'eventos' && parts[1]) {
      const result = await pool.request().input('id', parts[1]).query('DELETE FROM agenda_eventos OUTPUT DELETED.id WHERE id = @id');
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Evento no encontrado' } }; return; }
      context.res = { status: 200, headers: J, body: { success: true, deleted: parts[1] } };
    }
  } catch (error) {
    context.log.error('Error en agenda:', error);
    context.res = { status: 500, headers: J, body: { error: error.message } };
  }
};
