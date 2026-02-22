const { sql, query, queryOne, execute } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = context.bindingData.restOfPath || '';
  const parts = path.split('/').filter(Boolean);
  const id = parts[0] || null;

  try {
    if (method === 'GET') {
      if (id) {
        const permiso = await queryOne(`SELECT p.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero, tp.nombre as tipo_nombre, tp.codigo as tipo_codigo FROM permisos p JOIN trabajadores t ON p.trabajador_id = t.id JOIN tipos_permiso tp ON p.tipo_permiso_id = tp.id WHERE p.id = @id`, { id: { type: sql.UniqueIdentifier, value: id } });
        if (!permiso) { context.res = { status: 404, headers: J, body: { error: 'Permiso no encontrado' } }; return; }
        context.res = { status: 200, headers: J, body: permiso };
      } else {
        const trabajadorId = req.query.trabajador_id;
        const tipoId = req.query.tipo_permiso_id;
        const fechaDesde = req.query.fecha_desde;
        const fechaHasta = req.query.fecha_hasta;
        let sqlQuery = `SELECT p.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero, tp.nombre as tipo_nombre, tp.codigo as tipo_codigo FROM permisos p JOIN trabajadores t ON p.trabajador_id = t.id JOIN tipos_permiso tp ON p.tipo_permiso_id = tp.id WHERE 1=1`;
        const params = {};
        if (trabajadorId) { sqlQuery += ' AND p.trabajador_id = @trabajador_id'; params.trabajador_id = { type: sql.UniqueIdentifier, value: trabajadorId }; }
        if (tipoId) { sqlQuery += ' AND p.tipo_permiso_id = @tipo_id'; params.tipo_id = { type: sql.UniqueIdentifier, value: tipoId }; }
        if (fechaDesde) { sqlQuery += ' AND p.fecha_fin >= @fecha_desde'; params.fecha_desde = { type: sql.Date, value: new Date(fechaDesde) }; }
        if (fechaHasta) { sqlQuery += ' AND p.fecha_inicio <= @fecha_hasta'; params.fecha_hasta = { type: sql.Date, value: new Date(fechaHasta) }; }
        sqlQuery += ' ORDER BY p.fecha_inicio DESC';
        const permisos = await query(sqlQuery, params);
        context.res = { status: 200, headers: J, body: permisos };
      }
    } else if (method === 'POST') {
      const body = req.body;
      if (!body.trabajador_id || !body.tipo_permiso_id || !body.fecha_inicio || !body.fecha_fin) { context.res = { status: 400, headers: J, body: { error: 'trabajador_id, tipo_permiso_id, fecha_inicio y fecha_fin son obligatorios' } }; return; }
      const fechaInicio = new Date(body.fecha_inicio);
      const fechaFin = new Date(body.fecha_fin);
      const diasTotales = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
      const result = await queryOne(
        `INSERT INTO permisos (trabajador_id, tipo_permiso_id, fecha_inicio, fecha_fin, dias_totales, hecho_causante, descripcion, estado) OUTPUT INSERTED.* VALUES (@trabajador_id, @tipo_permiso_id, @fecha_inicio, @fecha_fin, @dias_totales, @hecho_causante, @descripcion, @estado)`,
        { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, tipo_permiso_id: { type: sql.UniqueIdentifier, value: body.tipo_permiso_id }, fecha_inicio: { type: sql.Date, value: fechaInicio }, fecha_fin: { type: sql.Date, value: fechaFin }, dias_totales: { type: sql.Int, value: diasTotales }, hecho_causante: { type: sql.Date, value: body.hecho_causante ? new Date(body.hecho_causante) : null }, descripcion: { type: sql.Text, value: body.descripcion || null }, estado: { type: sql.VarChar, value: body.estado || 'aprobado' } }
      );
      const tempDate = new Date(fechaInicio);
      while (tempDate <= fechaFin) {
        await execute(`MERGE calendario AS target USING (SELECT @trabajador_id as trabajador_id, @fecha as fecha) AS source ON target.trabajador_id = source.trabajador_id AND target.fecha = source.fecha WHEN MATCHED THEN UPDATE SET estado = 'P', updated_at = GETUTCDATE() WHEN NOT MATCHED THEN INSERT (trabajador_id, fecha, estado) VALUES (@trabajador_id, @fecha, 'P');`, { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(tempDate) } });
        tempDate.setDate(tempDate.getDate() + 1);
      }
      context.res = { status: 201, headers: J, body: result };
    } else if (method === 'DELETE' && id) {
      const permiso = await queryOne('SELECT * FROM permisos WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (!permiso) { context.res = { status: 404, headers: J, body: { error: 'Permiso no encontrado' } }; return; }
      await execute(`DELETE FROM calendario WHERE trabajador_id = @trabajador_id AND fecha BETWEEN @fecha_inicio AND @fecha_fin AND estado = 'P'`, { trabajador_id: { type: sql.UniqueIdentifier, value: permiso.trabajador_id }, fecha_inicio: { type: sql.Date, value: permiso.fecha_inicio }, fecha_fin: { type: sql.Date, value: permiso.fecha_fin } });
      await execute('DELETE FROM permisos WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      context.res = { status: 204 };
    }
  } catch (error) {
    context.log.error('Error en permisos:', error);
    context.res = { status: 500, headers: J, body: { error: 'Error interno del servidor' } };
  }
};
