const { sql, query, queryOne, execute } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = context.bindingData.restOfPath || '';
  const parts = path.split('/').filter(Boolean);

  try {
    // PUT /bajas/{id}/cerrar
    if (method === 'PUT' && parts[1] === 'cerrar') {
      const id = parts[0];
      const body = req.body;
      if (!body.fecha_fin) { context.res = { status: 400, headers: J, body: { error: 'fecha_fin es obligatoria para cerrar la baja' } }; return; }
      const baja = await queryOne('SELECT * FROM bajas WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (!baja) { context.res = { status: 404, headers: J, body: { error: 'Baja no encontrada' } }; return; }
      const fechaFin = new Date(body.fecha_fin);
      const diasTotales = Math.ceil((fechaFin - new Date(baja.fecha_inicio)) / (1000 * 60 * 60 * 24)) + 1;
      const result = await queryOne(`UPDATE bajas SET fecha_fin = @fecha_fin, dias_totales = @dias_totales, updated_at = GETUTCDATE() OUTPUT INSERTED.* WHERE id = @id`, { id: { type: sql.UniqueIdentifier, value: id }, fecha_fin: { type: sql.Date, value: fechaFin }, dias_totales: { type: sql.Int, value: diasTotales } });
      context.res = { status: 200, headers: J, body: result };
    }
    // GET /bajas/{id} or GET /bajas
    else if (method === 'GET') {
      if (parts[0]) {
        const baja = await queryOne(`SELECT b.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero FROM bajas b JOIN trabajadores t ON b.trabajador_id = t.id WHERE b.id = @id`, { id: { type: sql.UniqueIdentifier, value: parts[0] } });
        if (!baja) { context.res = { status: 404, headers: J, body: { error: 'Baja no encontrada' } }; return; }
        context.res = { status: 200, headers: J, body: baja };
      } else {
        const trabajadorId = req.query.trabajador_id;
        const activas = req.query.activas;
        let sqlQuery = `SELECT b.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero FROM bajas b JOIN trabajadores t ON b.trabajador_id = t.id WHERE 1=1`;
        const params = {};
        if (trabajadorId) { sqlQuery += ' AND b.trabajador_id = @trabajador_id'; params.trabajador_id = { type: sql.UniqueIdentifier, value: trabajadorId }; }
        if (activas === 'true') { sqlQuery += ' AND b.fecha_fin IS NULL'; }
        sqlQuery += ' ORDER BY b.fecha_inicio DESC';
        const bajas = await query(sqlQuery, params);
        context.res = { status: 200, headers: J, body: bajas };
      }
    }
    // POST /bajas
    else if (method === 'POST') {
      const body = req.body;
      if (!body.trabajador_id || !body.fecha_inicio) { context.res = { status: 400, headers: J, body: { error: 'trabajador_id y fecha_inicio son obligatorios' } }; return; }
      const result = await queryOne(
        `INSERT INTO bajas (trabajador_id, tipo, fecha_inicio, fecha_fin, diagnostico, notas) OUTPUT INSERTED.* VALUES (@trabajador_id, @tipo, @fecha_inicio, @fecha_fin, @diagnostico, @notas)`,
        { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, tipo: { type: sql.VarChar, value: body.tipo || 'comun' }, fecha_inicio: { type: sql.Date, value: new Date(body.fecha_inicio) }, fecha_fin: { type: sql.Date, value: body.fecha_fin ? new Date(body.fecha_fin) : null }, diagnostico: { type: sql.Text, value: body.diagnostico || null }, notas: { type: sql.Text, value: body.notas || null } }
      );
      const fechaInicio = new Date(body.fecha_inicio);
      const fechaFin = body.fecha_fin ? new Date(body.fecha_fin) : new Date();
      const tempDate = new Date(fechaInicio);
      while (tempDate <= fechaFin) {
        await execute(`MERGE calendario AS target USING (SELECT @trabajador_id as trabajador_id, @fecha as fecha) AS source ON target.trabajador_id = source.trabajador_id AND target.fecha = source.fecha WHEN MATCHED THEN UPDATE SET estado = 'BM', updated_at = GETUTCDATE() WHEN NOT MATCHED THEN INSERT (trabajador_id, fecha, estado) VALUES (@trabajador_id, @fecha, 'BM');`, { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(tempDate) } });
        tempDate.setDate(tempDate.getDate() + 1);
      }
      context.res = { status: 201, headers: J, body: result };
    }
    // DELETE /bajas/{id}
    else if (method === 'DELETE' && parts[0]) {
      const id = parts[0];
      const baja = await queryOne('SELECT * FROM bajas WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (!baja) { context.res = { status: 404, headers: J, body: { error: 'Baja no encontrada' } }; return; }
      const fechaFin = baja.fecha_fin || new Date();
      await execute(`DELETE FROM calendario WHERE trabajador_id = @trabajador_id AND fecha BETWEEN @fecha_inicio AND @fecha_fin AND estado = 'BM'`, { trabajador_id: { type: sql.UniqueIdentifier, value: baja.trabajador_id }, fecha_inicio: { type: sql.Date, value: baja.fecha_inicio }, fecha_fin: { type: sql.Date, value: fechaFin } });
      await execute('DELETE FROM bajas WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      context.res = { status: 204 };
    }
  } catch (error) {
    context.log.error('Error en bajas:', error);
    context.res = { status: 500, headers: J, body: { error: 'Error interno del servidor' } };
  }
};
