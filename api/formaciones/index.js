const { getConnection } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = context.bindingData.restOfPath || '';
  const parts = path.split('/').filter(Boolean);

  try {
    const pool = await getConnection();

    // GET /formaciones/alertas/caducidad
    if (method === 'GET' && parts[0] === 'alertas' && parts[1] === 'caducidad') {
      const dias = parseInt(req.query.dias) || 90;
      const result = await pool.request().input('dias', dias).query(`SELECT f.id, f.titulo, f.fecha_caducidad, t.id as trabajador_id, t.nombre as trabajador_nombre, t.numero as trabajador_numero, tf.nombre as tipo_nombre, DATEDIFF(day, GETDATE(), f.fecha_caducidad) as dias_restantes FROM formaciones f JOIN trabajadores t ON f.trabajador_id = t.id LEFT JOIN tipos_formacion tf ON f.tipo_formacion_id = tf.id WHERE f.fecha_caducidad IS NOT NULL AND f.fecha_caducidad <= DATEADD(day, @dias, GETDATE()) AND t.activo = 1 ORDER BY f.fecha_caducidad ASC`);
      context.res = { status: 200, headers: J, body: result.recordset };
    }
    // GET /formaciones/{id}
    else if (method === 'GET' && parts[0] && parts[0] !== 'alertas') {
      const result = await pool.request().input('id', parts[0]).query(`SELECT f.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero, tf.nombre as tipo_nombre, tf.codigo as tipo_codigo, tf.caducidad_anios FROM formaciones f JOIN trabajadores t ON f.trabajador_id = t.id LEFT JOIN tipos_formacion tf ON f.tipo_formacion_id = tf.id WHERE f.id = @id`);
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Formación no encontrada' } }; return; }
      context.res = { status: 200, headers: J, body: result.recordset[0] };
    }
    // GET /formaciones
    else if (method === 'GET') {
      const trabajadorId = req.query.trabajador_id;
      const tipoId = req.query.tipo_id;
      const estado = req.query.estado;
      let sqlQuery = `SELECT f.id, f.trabajador_id, f.tipo_formacion_id, f.titulo, f.fecha_inicio, f.fecha_fin, f.horas, f.centro, f.fecha_caducidad, f.certificado_url, f.notas, f.created_at, t.nombre as trabajador_nombre, t.numero as trabajador_numero, tf.nombre as tipo_nombre, tf.codigo as tipo_codigo FROM formaciones f JOIN trabajadores t ON f.trabajador_id = t.id LEFT JOIN tipos_formacion tf ON f.tipo_formacion_id = tf.id WHERE 1=1`;
      const request = pool.request();
      if (trabajadorId) { sqlQuery += ' AND f.trabajador_id = @trabajadorId'; request.input('trabajadorId', trabajadorId); }
      if (tipoId) { sqlQuery += ' AND f.tipo_formacion_id = @tipoId'; request.input('tipoId', tipoId); }
      if (estado === 'caducado') sqlQuery += ' AND f.fecha_caducidad < GETDATE()';
      else if (estado === 'proximo') sqlQuery += ' AND f.fecha_caducidad >= GETDATE() AND f.fecha_caducidad <= DATEADD(day, 90, GETDATE())';
      else if (estado === 'vigente') sqlQuery += ' AND (f.fecha_caducidad IS NULL OR f.fecha_caducidad > DATEADD(day, 90, GETDATE()))';
      sqlQuery += ' ORDER BY f.fecha_caducidad ASC, f.fecha_inicio DESC';
      const result = await request.query(sqlQuery);
      context.res = { status: 200, headers: J, body: result.recordset };
    }
    // POST /formaciones
    else if (method === 'POST') {
      const body = req.body;
      if (!body.trabajador_id || !body.titulo || !body.fecha_inicio) { context.res = { status: 400, headers: J, body: { error: 'Faltan campos requeridos' } }; return; }
      let caducidadFinal = body.fecha_caducidad;
      if (!caducidadFinal && body.tipo_formacion_id && body.fecha_fin) {
        const tipoResult = await pool.request().input('tipoId', body.tipo_formacion_id).query('SELECT caducidad_anios FROM tipos_formacion WHERE id = @tipoId');
        if (tipoResult.recordset.length > 0 && tipoResult.recordset[0].caducidad_anios) {
          const fechaBase = new Date(body.fecha_fin);
          fechaBase.setFullYear(fechaBase.getFullYear() + tipoResult.recordset[0].caducidad_anios);
          caducidadFinal = fechaBase.toISOString().split('T')[0];
        }
      }
      const result = await pool.request()
        .input('trabajadorId', body.trabajador_id).input('tipoId', body.tipo_formacion_id || null)
        .input('titulo', body.titulo).input('fechaInicio', body.fecha_inicio).input('fechaFin', body.fecha_fin || null)
        .input('horas', body.horas || null).input('centro', body.centro || null)
        .input('fechaCaducidad', caducidadFinal || null).input('certificadoUrl', body.certificado_url || null).input('notas', body.notas || null)
        .query(`INSERT INTO formaciones (trabajador_id, tipo_formacion_id, titulo, fecha_inicio, fecha_fin, horas, centro, fecha_caducidad, certificado_url, notas) OUTPUT INSERTED.* VALUES (@trabajadorId, @tipoId, @titulo, @fechaInicio, @fechaFin, @horas, @centro, @fechaCaducidad, @certificadoUrl, @notas)`);
      context.res = { status: 201, headers: J, body: result.recordset[0] };
    }
    // PUT /formaciones/{id}
    else if (method === 'PUT' && parts[0]) {
      const body = req.body;
      const fields = [];
      const request = pool.request().input('id', parts[0]);
      if (body.titulo !== undefined) { fields.push('titulo = @titulo'); request.input('titulo', body.titulo); }
      if (body.tipo_formacion_id !== undefined) { fields.push('tipo_formacion_id = @tipoId'); request.input('tipoId', body.tipo_formacion_id); }
      if (body.fecha_inicio !== undefined) { fields.push('fecha_inicio = @fechaInicio'); request.input('fechaInicio', body.fecha_inicio); }
      if (body.fecha_fin !== undefined) { fields.push('fecha_fin = @fechaFin'); request.input('fechaFin', body.fecha_fin); }
      if (body.horas !== undefined) { fields.push('horas = @horas'); request.input('horas', body.horas); }
      if (body.centro !== undefined) { fields.push('centro = @centro'); request.input('centro', body.centro); }
      if (body.fecha_caducidad !== undefined) { fields.push('fecha_caducidad = @fechaCaducidad'); request.input('fechaCaducidad', body.fecha_caducidad); }
      if (body.certificado_url !== undefined) { fields.push('certificado_url = @certificadoUrl'); request.input('certificadoUrl', body.certificado_url); }
      if (body.notas !== undefined) { fields.push('notas = @notas'); request.input('notas', body.notas); }
      if (fields.length === 0) { context.res = { status: 400, headers: J, body: { error: 'No hay campos para actualizar' } }; return; }
      fields.push('updated_at = GETDATE()');
      const result = await request.query(`UPDATE formaciones SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`);
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Formación no encontrada' } }; return; }
      context.res = { status: 200, headers: J, body: result.recordset[0] };
    }
    // DELETE /formaciones/{id}
    else if (method === 'DELETE' && parts[0]) {
      const result = await pool.request().input('id', parts[0]).query('DELETE FROM formaciones OUTPUT DELETED.id WHERE id = @id');
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Formación no encontrada' } }; return; }
      context.res = { status: 200, headers: J, body: { success: true, deleted: parts[0] } };
    }
  } catch (error) {
    context.log.error('Error en formaciones:', error);
    context.res = { status: 500, headers: J, body: { error: error.message } };
  }
};
