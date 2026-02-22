const { sql, query, queryOne, execute } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = (context.bindingData.restOfPath || '');
  const parts = path.split('/').filter(Boolean);

  try {
    // GET /vacaciones/resumen/{anio}
    if (method === 'GET' && parts[0] === 'resumen') {
      const anio = parts[1] || new Date().getFullYear();
      const resumen = await query(
        `SELECT t.id as trabajador_id, t.numero, t.nombre, t.tipo, t.dias_vacaciones_base, ISNULL(SUM(v.dias_habiles), 0) as dias_disfrutados, t.dias_vacaciones_base - ISNULL(SUM(v.dias_habiles), 0) as dias_pendientes FROM trabajadores t LEFT JOIN vacaciones v ON t.id = v.trabajador_id AND v.anio = @anio AND v.estado IN ('aprobado', 'disfrutado') WHERE t.activo = 1 GROUP BY t.id, t.numero, t.nombre, t.tipo, t.dias_vacaciones_base ORDER BY t.numero`,
        { anio: { type: sql.Int, value: parseInt(anio) } }
      );
      context.res = { status: 200, headers: J, body: resumen };
    }
    // GET /vacaciones/{id}
    else if (method === 'GET' && parts[0]) {
      const vacacion = await queryOne(
        `SELECT v.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero FROM vacaciones v JOIN trabajadores t ON v.trabajador_id = t.id WHERE v.id = @id`,
        { id: { type: sql.UniqueIdentifier, value: parts[0] } }
      );
      if (!vacacion) { context.res = { status: 404, headers: J, body: { error: 'Vacaciones no encontradas' } }; return; }
      context.res = { status: 200, headers: J, body: vacacion };
    }
    // GET /vacaciones
    else if (method === 'GET') {
      const trabajadorId = req.query.trabajador_id;
      const anio = req.query.anio;
      const estado = req.query.estado;
      let sqlQuery = `SELECT v.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero FROM vacaciones v JOIN trabajadores t ON v.trabajador_id = t.id WHERE 1=1`;
      const params = {};
      if (trabajadorId) { sqlQuery += ' AND v.trabajador_id = @trabajador_id'; params.trabajador_id = { type: sql.UniqueIdentifier, value: trabajadorId }; }
      if (anio) { sqlQuery += ' AND v.anio = @anio'; params.anio = { type: sql.Int, value: parseInt(anio) }; }
      if (estado) { sqlQuery += ' AND v.estado = @estado'; params.estado = { type: sql.VarChar, value: estado }; }
      sqlQuery += ' ORDER BY v.fecha_inicio DESC';
      const vacaciones = await query(sqlQuery, params);
      context.res = { status: 200, headers: J, body: vacaciones };
    }
    // POST /vacaciones
    else if (method === 'POST') {
      const body = req.body;
      if (!body.trabajador_id || !body.fecha_inicio || !body.fecha_fin) { context.res = { status: 400, headers: J, body: { error: 'trabajador_id, fecha_inicio y fecha_fin son obligatorios' } }; return; }
      const fechaInicio = new Date(body.fecha_inicio);
      const fechaFin = new Date(body.fecha_fin);
      const anio = body.anio || fechaInicio.getFullYear();
      const diasTotales = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
      let diasHabiles = 0;
      const tempDate = new Date(fechaInicio);
      while (tempDate <= fechaFin) { if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6) diasHabiles++; tempDate.setDate(tempDate.getDate() + 1); }
      const result = await queryOne(
        `INSERT INTO vacaciones (trabajador_id, ciclo_id, anio, fecha_inicio, fecha_fin, dias_totales, dias_habiles, estado, notas) OUTPUT INSERTED.* VALUES (@trabajador_id, @ciclo_id, @anio, @fecha_inicio, @fecha_fin, @dias_totales, @dias_habiles, @estado, @notas)`,
        {
          trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id },
          ciclo_id: { type: sql.UniqueIdentifier, value: body.ciclo_id || null },
          anio: { type: sql.Int, value: anio },
          fecha_inicio: { type: sql.Date, value: fechaInicio },
          fecha_fin: { type: sql.Date, value: fechaFin },
          dias_totales: { type: sql.Int, value: diasTotales },
          dias_habiles: { type: sql.Int, value: diasHabiles },
          estado: { type: sql.VarChar, value: body.estado || 'aprobado' },
          notas: { type: sql.Text, value: body.notas || null },
        }
      );
      const tempDate2 = new Date(fechaInicio);
      while (tempDate2 <= fechaFin) {
        await execute(`MERGE calendario AS target USING (SELECT @trabajador_id as trabajador_id, @fecha as fecha) AS source ON target.trabajador_id = source.trabajador_id AND target.fecha = source.fecha WHEN MATCHED THEN UPDATE SET estado = 'V', updated_at = GETUTCDATE() WHEN NOT MATCHED THEN INSERT (trabajador_id, fecha, estado) VALUES (@trabajador_id, @fecha, 'V');`, { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(tempDate2) } });
        tempDate2.setDate(tempDate2.getDate() + 1);
      }
      context.res = { status: 201, headers: J, body: result };
    }
    // DELETE /vacaciones/{id}
    else if (method === 'DELETE' && parts[0]) {
      const id = parts[0];
      const vacacion = await queryOne('SELECT * FROM vacaciones WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (!vacacion) { context.res = { status: 404, headers: J, body: { error: 'Vacaciones no encontradas' } }; return; }
      await execute(`DELETE FROM calendario WHERE trabajador_id = @trabajador_id AND fecha BETWEEN @fecha_inicio AND @fecha_fin AND estado = 'V'`, { trabajador_id: { type: sql.UniqueIdentifier, value: vacacion.trabajador_id }, fecha_inicio: { type: sql.Date, value: vacacion.fecha_inicio }, fecha_fin: { type: sql.Date, value: vacacion.fecha_fin } });
      await execute('DELETE FROM vacaciones WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      context.res = { status: 204 };
    }
  } catch (error) {
    context.log.error('Error en vacaciones:', error);
    context.res = { status: 500, headers: J, body: { error: 'Error interno del servidor' } };
  }
};
