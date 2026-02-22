const { sql, query, queryOne, execute } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = (context.bindingData.restOfPath || '');
  const parts = path.split('/').filter(Boolean);

  try {
    // GET /horas-extra/resumen/{anio}/{mes?}
    if (method === 'GET' && parts[0] === 'resumen') {
      const anio = parseInt(parts[1]);
      const mes = parts[2] ? parseInt(parts[2]) : null;
      let sqlQuery = `SELECT t.id as trabajador_id, t.numero, t.nombre, ISNULL(SUM(h.horas), 0) as total_horas, COUNT(h.id) as num_registros, ISNULL(SUM(CASE WHEN h.tipo = 'normal' THEN h.horas ELSE 0 END), 0) as horas_normales, ISNULL(SUM(CASE WHEN h.tipo = 'festivo' THEN h.horas ELSE 0 END), 0) as horas_festivo, ISNULL(SUM(CASE WHEN h.tipo = 'nocturna' THEN h.horas ELSE 0 END), 0) as horas_nocturnas FROM trabajadores t LEFT JOIN horas_extra h ON t.id = h.trabajador_id AND YEAR(h.fecha) = @anio`;
      const params = { anio: { type: sql.Int, value: anio } };
      if (mes) { sqlQuery = sqlQuery.replace('AND YEAR(h.fecha) = @anio', 'AND YEAR(h.fecha) = @anio AND MONTH(h.fecha) = @mes'); params.mes = { type: sql.Int, value: mes }; }
      sqlQuery += ' WHERE t.activo = 1 GROUP BY t.id, t.numero, t.nombre ORDER BY t.numero';
      const resumen = await query(sqlQuery, params);
      context.res = { status: 200, headers: J, body: resumen };
    }
    // GET /horas-extra
    else if (method === 'GET') {
      const trabajadorId = req.query.trabajador_id;
      const mes = req.query.mes;
      const anio = req.query.anio;
      let sqlQuery = `SELECT h.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero FROM horas_extra h JOIN trabajadores t ON h.trabajador_id = t.id WHERE 1=1`;
      const params = {};
      if (trabajadorId) { sqlQuery += ' AND h.trabajador_id = @trabajador_id'; params.trabajador_id = { type: sql.UniqueIdentifier, value: trabajadorId }; }
      if (mes && anio) { sqlQuery += ' AND MONTH(h.fecha) = @mes AND YEAR(h.fecha) = @anio'; params.mes = { type: sql.Int, value: parseInt(mes) }; params.anio = { type: sql.Int, value: parseInt(anio) }; }
      else if (anio) { sqlQuery += ' AND YEAR(h.fecha) = @anio'; params.anio = { type: sql.Int, value: parseInt(anio) }; }
      sqlQuery += ' ORDER BY h.fecha DESC';
      const horas = await query(sqlQuery, params);
      context.res = { status: 200, headers: J, body: horas };
    }
    // POST /horas-extra
    else if (method === 'POST') {
      const body = req.body;
      if (!body.trabajador_id || !body.fecha || !body.horas) { context.res = { status: 400, headers: J, body: { error: 'trabajador_id, fecha y horas son obligatorios' } }; return; }
      const result = await queryOne(
        `INSERT INTO horas_extra (trabajador_id, fecha, horas, tipo, motivo, aprobado) OUTPUT INSERTED.* VALUES (@trabajador_id, @fecha, @horas, @tipo, @motivo, @aprobado)`,
        { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(body.fecha) }, horas: { type: sql.Decimal, value: parseFloat(body.horas) }, tipo: { type: sql.VarChar, value: body.tipo || 'normal' }, motivo: { type: sql.Text, value: body.motivo || null }, aprobado: { type: sql.Bit, value: body.aprobado !== false ? 1 : 0 } }
      );
      await execute(`UPDATE calendario SET horas_extra = ISNULL(horas_extra, 0) + @horas, updated_at = GETUTCDATE() WHERE trabajador_id = @trabajador_id AND fecha = @fecha`, { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(body.fecha) }, horas: { type: sql.Decimal, value: parseFloat(body.horas) } });
      context.res = { status: 201, headers: J, body: result };
    }
    // DELETE /horas-extra/{id}
    else if (method === 'DELETE' && parts[0]) {
      const id = parts[0];
      const hora = await queryOne('SELECT * FROM horas_extra WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (!hora) { context.res = { status: 404, headers: J, body: { error: 'Registro no encontrado' } }; return; }
      await execute(`UPDATE calendario SET horas_extra = ISNULL(horas_extra, 0) - @horas, updated_at = GETUTCDATE() WHERE trabajador_id = @trabajador_id AND fecha = @fecha`, { trabajador_id: { type: sql.UniqueIdentifier, value: hora.trabajador_id }, fecha: { type: sql.Date, value: hora.fecha }, horas: { type: sql.Decimal, value: hora.horas } });
      await execute('DELETE FROM horas_extra WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      context.res = { status: 204 };
    }
  } catch (error) {
    context.log.error('Error en horas-extra:', error);
    context.res = { status: 500, headers: J, body: { error: 'Error interno del servidor' } };
  }
};
