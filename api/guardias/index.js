const { sql, query, queryOne, execute } = require('../shared/db');

module.exports = async function (context, req) {
  const method = req.method;
  const id = req.params.id;

  try {
    if (method === 'GET') {
      const trabajadorId = req.query.trabajador_id;
      const mes = req.query.mes;
      const anio = req.query.anio;
      const fechaDesde = req.query.fecha_desde;
      const fechaHasta = req.query.fecha_hasta;

      let sqlQuery = `SELECT g.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero FROM guardias g JOIN trabajadores t ON g.trabajador_id = t.id WHERE 1=1`;
      const params = {};
      if (trabajadorId) { sqlQuery += ' AND g.trabajador_id = @trabajador_id'; params.trabajador_id = { type: sql.UniqueIdentifier, value: trabajadorId }; }
      if (mes && anio) { sqlQuery += ' AND MONTH(g.fecha) = @mes AND YEAR(g.fecha) = @anio'; params.mes = { type: sql.Int, value: parseInt(mes) }; params.anio = { type: sql.Int, value: parseInt(anio) }; }
      else if (fechaDesde && fechaHasta) { sqlQuery += ' AND g.fecha BETWEEN @fecha_desde AND @fecha_hasta'; params.fecha_desde = { type: sql.Date, value: new Date(fechaDesde) }; params.fecha_hasta = { type: sql.Date, value: new Date(fechaHasta) }; }
      sqlQuery += ' ORDER BY g.fecha ASC';
      const guardias = await query(sqlQuery, params);
      context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: guardias };
    } else if (method === 'POST') {
      const body = req.body;
      if (!body.trabajador_id || !body.fecha) { context.res = { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'trabajador_id y fecha son obligatorios' } }; return; }
      const existente = await queryOne('SELECT id FROM guardias WHERE trabajador_id = @trabajador_id AND fecha = @fecha', { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(body.fecha) } });
      if (existente) { context.res = { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'Ya existe una guardia para este trabajador en esta fecha' } }; return; }
      const result = await queryOne(
        `INSERT INTO guardias (trabajador_id, fecha, tipo, turno, activada, horas_trabajadas, notas) OUTPUT INSERTED.* VALUES (@trabajador_id, @fecha, @tipo, @turno, @activada, @horas_trabajadas, @notas)`,
        {
          trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id },
          fecha: { type: sql.Date, value: new Date(body.fecha) },
          tipo: { type: sql.VarChar, value: body.tipo || 'localizable' },
          turno: { type: sql.VarChar, value: body.turno || null },
          activada: { type: sql.Bit, value: body.activada ? 1 : 0 },
          horas_trabajadas: { type: sql.Decimal, value: body.horas_trabajadas || null },
          notas: { type: sql.Text, value: body.notas || null },
        }
      );
      await execute(`MERGE calendario AS target USING (SELECT @trabajador_id as trabajador_id, @fecha as fecha) AS source ON target.trabajador_id = source.trabajador_id AND target.fecha = source.fecha WHEN MATCHED THEN UPDATE SET estado = 'G', updated_at = GETUTCDATE() WHEN NOT MATCHED THEN INSERT (trabajador_id, fecha, estado) VALUES (@trabajador_id, @fecha, 'G');`, { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(body.fecha) } });
      context.res = { status: 201, headers: { 'Content-Type': 'application/json' }, body: result };
    } else if (method === 'PUT' && id) {
      const body = req.body;
      const result = await queryOne(
        `UPDATE guardias SET tipo = COALESCE(@tipo, tipo), turno = @turno, activada = @activada, horas_trabajadas = @horas_trabajadas, notas = @notas, updated_at = GETUTCDATE() OUTPUT INSERTED.* WHERE id = @id`,
        {
          id: { type: sql.UniqueIdentifier, value: id },
          tipo: { type: sql.VarChar, value: body.tipo || null },
          turno: { type: sql.VarChar, value: body.turno || null },
          activada: { type: sql.Bit, value: body.activada ? 1 : 0 },
          horas_trabajadas: { type: sql.Decimal, value: body.horas_trabajadas || null },
          notas: { type: sql.Text, value: body.notas || null },
        }
      );
      if (!result) { context.res = { status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Guardia no encontrada' } }; return; }
      context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: result };
    } else if (method === 'DELETE' && id) {
      const guardia = await queryOne('SELECT * FROM guardias WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (!guardia) { context.res = { status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Guardia no encontrada' } }; return; }
      await execute(`DELETE FROM calendario WHERE trabajador_id = @trabajador_id AND fecha = @fecha AND estado = 'G'`, { trabajador_id: { type: sql.UniqueIdentifier, value: guardia.trabajador_id }, fecha: { type: sql.Date, value: guardia.fecha } });
      await execute('DELETE FROM guardias WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      context.res = { status: 204 };
    }
  } catch (error) {
    context.log.error('Error en guardias:', error);
    context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'Error interno del servidor' } };
  }
};
