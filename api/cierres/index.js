const { getConnection } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = context.bindingData.restOfPath || '';
  const parts = path.split('/').filter(Boolean);

  try {
    const pool = await getConnection();

    // GET /cierres/verificar/{fecha}
    if (method === 'GET' && parts[0] === 'verificar' && parts[1]) {
      const [anio, mes] = parts[1].split('-');
      const result = await pool.request().input('anio', parseInt(anio)).input('mes', parseInt(mes)).query('SELECT cerrado FROM cierres_mensuales WHERE anio = @anio AND mes = @mes');
      const cerrado = result.recordset.length > 0 && result.recordset[0].cerrado;
      context.res = { status: 200, headers: J, body: { fecha: parts[1], cerrado } };
    }
    // GET /cierres/{anio}/{mes}/preview
    else if (method === 'GET' && parts[2] === 'preview') {
      const anio = parts[0]; const mes = parts[1];
      const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const fechaFin = new Date(parseInt(anio), parseInt(mes), 0).toISOString().split('T')[0];
      const trabajadoresResult = await pool.request().input('fechaInicio', fechaInicio).input('fechaFin', fechaFin)
        .query(`SELECT t.id, t.numero, t.nombre, t.tipo, (SELECT COUNT(*) FROM calendario c WHERE c.trabajador_id = t.id AND c.fecha BETWEEN @fechaInicio AND @fechaFin AND c.estado = 'T') as dias_trabajados, (SELECT COUNT(*) FROM calendario c WHERE c.trabajador_id = t.id AND c.fecha BETWEEN @fechaInicio AND @fechaFin AND c.estado = 'D') as dias_descanso, (SELECT COUNT(*) FROM calendario c WHERE c.trabajador_id = t.id AND c.fecha BETWEEN @fechaInicio AND @fechaFin AND c.estado = 'V') as dias_vacaciones, (SELECT COUNT(*) FROM calendario c WHERE c.trabajador_id = t.id AND c.fecha BETWEEN @fechaInicio AND @fechaFin AND c.estado = 'P') as dias_permisos, (SELECT COUNT(*) FROM calendario c WHERE c.trabajador_id = t.id AND c.fecha BETWEEN @fechaInicio AND @fechaFin AND c.estado = 'BM') as dias_baja, (SELECT COUNT(*) FROM calendario c WHERE c.trabajador_id = t.id AND c.fecha BETWEEN @fechaInicio AND @fechaFin AND c.estado = 'G') as guardias, (SELECT ISNULL(SUM(c.horas_extra), 0) FROM calendario c WHERE c.trabajador_id = t.id AND c.fecha BETWEEN @fechaInicio AND @fechaFin) as horas_extra FROM trabajadores t WHERE t.activo = 1 ORDER BY t.numero`);
      const trabajadores = trabajadoresResult.recordset;
      const totales = trabajadores.reduce((acc, t) => ({ dias_trabajados: acc.dias_trabajados + (t.dias_trabajados || 0), dias_descanso: acc.dias_descanso + (t.dias_descanso || 0), dias_vacaciones: acc.dias_vacaciones + (t.dias_vacaciones || 0), dias_permisos: acc.dias_permisos + (t.dias_permisos || 0), dias_baja: acc.dias_baja + (t.dias_baja || 0), guardias: acc.guardias + (t.guardias || 0), horas_extra: acc.horas_extra + (t.horas_extra || 0) }), { dias_trabajados: 0, dias_descanso: 0, dias_vacaciones: 0, dias_permisos: 0, dias_baja: 0, guardias: 0, horas_extra: 0 });
      context.res = { status: 200, headers: J, body: { anio: parseInt(anio), mes: parseInt(mes), fecha_inicio: fechaInicio, fecha_fin: fechaFin, trabajadores, totales, num_trabajadores: trabajadores.length } };
    }
    // GET /cierres/{anio}/{mes}
    else if (method === 'GET' && parts[0] && parts[1] && !parts[2]) {
      const result = await pool.request().input('anio', parseInt(parts[0])).input('mes', parseInt(parts[1])).query('SELECT * FROM cierres_mensuales WHERE anio = @anio AND mes = @mes');
      if (result.recordset.length === 0) { context.res = { status: 200, headers: J, body: { cerrado: false, anio: parseInt(parts[0]), mes: parseInt(parts[1]) } }; return; }
      const cierre = result.recordset[0];
      cierre.datos_resumen = cierre.datos_resumen ? JSON.parse(cierre.datos_resumen) : null;
      context.res = { status: 200, headers: J, body: cierre };
    }
    // GET /cierres
    else if (method === 'GET') {
      const anio = req.query.anio;
      let q = 'SELECT * FROM cierres_mensuales WHERE 1=1';
      const request = pool.request();
      if (anio) { q += ' AND anio = @anio'; request.input('anio', parseInt(anio)); }
      q += ' ORDER BY anio DESC, mes DESC';
      const result = await request.query(q);
      const cierres = result.recordset.map(c => ({ ...c, datos_resumen: c.datos_resumen ? JSON.parse(c.datos_resumen) : null }));
      context.res = { status: 200, headers: J, body: cierres };
    }
    // POST /cierres/{anio}/{mes}/cerrar
    else if (method === 'POST' && parts[2] === 'cerrar') {
      const anio = parts[0]; const mes = parts[1];
      const body = req.body;
      const existente = await pool.request().input('anio', parseInt(anio)).input('mes', parseInt(mes)).query('SELECT id, cerrado FROM cierres_mensuales WHERE anio = @anio AND mes = @mes');
      if (existente.recordset.length > 0 && existente.recordset[0].cerrado) { context.res = { status: 400, headers: J, body: { error: 'El mes ya está cerrado' } }; return; }
      const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
      const fechaFin = new Date(parseInt(anio), parseInt(mes), 0).toISOString().split('T')[0];
      const resumenResult = await pool.request().input('fechaInicio', fechaInicio).input('fechaFin', fechaFin)
        .query(`SELECT COUNT(DISTINCT c.trabajador_id) as trabajadores, SUM(CASE WHEN c.estado = 'T' THEN 1 ELSE 0 END) as dias_trabajados, SUM(CASE WHEN c.estado = 'D' THEN 1 ELSE 0 END) as dias_descanso, SUM(CASE WHEN c.estado = 'V' THEN 1 ELSE 0 END) as dias_vacaciones, SUM(CASE WHEN c.estado = 'P' THEN 1 ELSE 0 END) as dias_permisos, SUM(CASE WHEN c.estado = 'BM' THEN 1 ELSE 0 END) as dias_baja, SUM(CASE WHEN c.estado = 'G' THEN 1 ELSE 0 END) as guardias, SUM(ISNULL(c.horas_extra, 0)) as horas_extra FROM calendario c JOIN trabajadores t ON c.trabajador_id = t.id WHERE c.fecha BETWEEN @fechaInicio AND @fechaFin AND t.activo = 1`);
      const resumen = resumenResult.recordset[0];
      if (existente.recordset.length > 0) {
        await pool.request().input('anio', parseInt(anio)).input('mes', parseInt(mes)).input('cerradoPor', (body && body.cerrado_por) || 'Sistema').input('notas', (body && body.notas) || null).input('datosResumen', JSON.stringify(resumen))
          .query('UPDATE cierres_mensuales SET cerrado = 1, fecha_cierre = GETDATE(), cerrado_por = @cerradoPor, datos_resumen = @datosResumen, notas = @notas, updated_at = GETDATE() WHERE anio = @anio AND mes = @mes');
      } else {
        await pool.request().input('anio', parseInt(anio)).input('mes', parseInt(mes)).input('cerradoPor', (body && body.cerrado_por) || 'Sistema').input('notas', (body && body.notas) || null).input('datosResumen', JSON.stringify(resumen))
          .query('INSERT INTO cierres_mensuales (anio, mes, cerrado, fecha_cierre, cerrado_por, datos_resumen, notas) VALUES (@anio, @mes, 1, GETDATE(), @cerradoPor, @datosResumen, @notas)');
      }
      context.res = { status: 200, headers: J, body: { success: true, message: `Mes ${mes}/${anio} cerrado correctamente`, resumen } };
    }
    // POST /cierres/{anio}/{mes}/reabrir
    else if (method === 'POST' && parts[2] === 'reabrir') {
      const result = await pool.request().input('anio', parseInt(parts[0])).input('mes', parseInt(parts[1]))
        .query('UPDATE cierres_mensuales SET cerrado = 0, updated_at = GETDATE() OUTPUT INSERTED.* WHERE anio = @anio AND mes = @mes');
      if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Cierre no encontrado' } }; return; }
      context.res = { status: 200, headers: J, body: { success: true, message: `Mes ${parts[1]}/${parts[0]} reabierto` } };
    }
  } catch (error) {
    context.log.error('Error en cierres:', error);
    context.res = { status: 500, headers: J, body: { error: error.message } };
  }
};
