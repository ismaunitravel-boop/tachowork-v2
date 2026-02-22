const { sql, query, queryOne } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = (context.bindingData.restOfPath || '').toLowerCase();

  try {
    if (method === 'GET' && path === 'resumen') {
      const mes = req.query.mes;
      const anio = req.query.anio;
      const trabajadorId = req.query.trabajador_id;
      if (!mes || !anio) { context.res = { status: 400, headers: J, body: { error: 'mes y anio son obligatorios' } }; return; }
      let sqlQuery = `SELECT c.trabajador_id, t.numero, t.nombre, t.tipo, COUNT(*) as total_dias, SUM(CASE WHEN c.estado = 'T' THEN 1 ELSE 0 END) as dias_trabajo, SUM(CASE WHEN c.estado = 'D' THEN 1 ELSE 0 END) as dias_descanso, SUM(CASE WHEN c.estado = 'V' THEN 1 ELSE 0 END) as dias_vacaciones, SUM(CASE WHEN c.estado = 'P' THEN 1 ELSE 0 END) as dias_permiso, SUM(CASE WHEN c.estado IN ('BM', 'BA') THEN 1 ELSE 0 END) as dias_baja, SUM(CASE WHEN c.estado = 'G' THEN 1 ELSE 0 END) as dias_guardia, SUM(ISNULL(c.horas_trabajadas, 0)) as horas_totales, SUM(ISNULL(c.horas_extra, 0)) as horas_extra_totales FROM calendario c JOIN trabajadores t ON c.trabajador_id = t.id WHERE MONTH(c.fecha) = @mes AND YEAR(c.fecha) = @anio`;
      const params = { mes: { type: sql.Int, value: parseInt(mes) }, anio: { type: sql.Int, value: parseInt(anio) } };
      if (trabajadorId) { sqlQuery += ' AND c.trabajador_id = @trabajador_id'; params.trabajador_id = { type: sql.UniqueIdentifier, value: trabajadorId }; }
      sqlQuery += ' GROUP BY c.trabajador_id, t.numero, t.nombre, t.tipo ORDER BY t.numero';
      const resumen = await query(sqlQuery, params);
      context.res = { status: 200, headers: J, body: resumen };
    } else if (method === 'GET') {
      const trabajadorId = req.query.trabajador_id;
      const mes = req.query.mes;
      const anio = req.query.anio;
      const fechaInicio = req.query.fecha_inicio;
      const fechaFin = req.query.fecha_fin;
      let sqlQuery = `SELECT c.*, t.nombre as trabajador_nombre, t.numero as trabajador_numero FROM calendario c JOIN trabajadores t ON c.trabajador_id = t.id WHERE 1=1`;
      const params = {};
      if (trabajadorId) { sqlQuery += ' AND c.trabajador_id = @trabajador_id'; params.trabajador_id = { type: sql.UniqueIdentifier, value: trabajadorId }; }
      if (mes && anio) { sqlQuery += ' AND MONTH(c.fecha) = @mes AND YEAR(c.fecha) = @anio'; params.mes = { type: sql.Int, value: parseInt(mes) }; params.anio = { type: sql.Int, value: parseInt(anio) }; }
      else if (fechaInicio && fechaFin) { sqlQuery += ' AND c.fecha BETWEEN @fecha_inicio AND @fecha_fin'; params.fecha_inicio = { type: sql.Date, value: new Date(fechaInicio) }; params.fecha_fin = { type: sql.Date, value: new Date(fechaFin) }; }
      sqlQuery += ' ORDER BY c.fecha ASC, t.numero ASC';
      const calendario = await query(sqlQuery, params);
      context.res = { status: 200, headers: J, body: calendario };
    } else if (method === 'POST' && path === 'bulk') {
      const body = req.body;
      if (!body.trabajador_id || !body.entradas || !Array.isArray(body.entradas)) { context.res = { status: 400, headers: J, body: { error: 'trabajador_id y entradas son obligatorios' } }; return; }
      const results = [];
      for (const entrada of body.entradas) {
        const result = await queryOne(
          `MERGE calendario AS target USING (SELECT @trabajador_id as trabajador_id, @fecha as fecha) AS source ON target.trabajador_id = source.trabajador_id AND target.fecha = source.fecha WHEN MATCHED THEN UPDATE SET estado = @estado, subestado = @subestado, updated_at = GETUTCDATE() WHEN NOT MATCHED THEN INSERT (trabajador_id, fecha, estado, subestado) VALUES (@trabajador_id, @fecha, @estado, @subestado) OUTPUT INSERTED.*;`,
          { trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id }, fecha: { type: sql.Date, value: new Date(entrada.fecha) }, estado: { type: sql.VarChar, value: entrada.estado }, subestado: { type: sql.VarChar, value: entrada.subestado || null } }
        );
        results.push(result);
      }
      context.res = { status: 200, headers: J, body: { updated: results.length, results } };
    } else if (method === 'POST') {
      const body = req.body;
      if (!body.trabajador_id || !body.fecha || !body.estado) { context.res = { status: 400, headers: J, body: { error: 'trabajador_id, fecha y estado son obligatorios' } }; return; }
      const result = await queryOne(
        `MERGE calendario AS target USING (SELECT @trabajador_id as trabajador_id, @fecha as fecha) AS source ON target.trabajador_id = source.trabajador_id AND target.fecha = source.fecha WHEN MATCHED THEN UPDATE SET estado = @estado, subestado = @subestado, horas_trabajadas = @horas_trabajadas, horas_extra = @horas_extra, notas = @notas, updated_at = GETUTCDATE() WHEN NOT MATCHED THEN INSERT (trabajador_id, fecha, estado, subestado, horas_trabajadas, horas_extra, notas) VALUES (@trabajador_id, @fecha, @estado, @subestado, @horas_trabajadas, @horas_extra, @notas) OUTPUT INSERTED.*;`,
        {
          trabajador_id: { type: sql.UniqueIdentifier, value: body.trabajador_id },
          fecha: { type: sql.Date, value: new Date(body.fecha) },
          estado: { type: sql.VarChar, value: body.estado },
          subestado: { type: sql.VarChar, value: body.subestado || null },
          horas_trabajadas: { type: sql.Decimal, value: body.horas_trabajadas || null },
          horas_extra: { type: sql.Decimal, value: body.horas_extra || null },
          notas: { type: sql.Text, value: body.notas || null },
        }
      );
      context.res = { status: 200, headers: J, body: result };
    }
  } catch (error) {
    context.log.error('Error en calendario:', error);
    context.res = { status: 500, headers: J, body: { error: 'Error interno del servidor' } };
  }
};
