const { sql, queryOne } = require('../shared/db');

module.exports = async function (context, req) {
  try {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const anio = now.getFullYear();

    const trabajadores = await queryOne(
      `SELECT COUNT(*) as total, SUM(CASE WHEN tipo = 'fijo' THEN 1 ELSE 0 END) as fijos,
       SUM(CASE WHEN tipo = 'fijo-discontinuo' THEN 1 ELSE 0 END) as discontinuos,
       SUM(CASE WHEN tipo = 'extra' THEN 1 ELSE 0 END) as extras
       FROM trabajadores WHERE activo = 1`
    );
    const vacacionesHoy = await queryOne(
      `SELECT COUNT(DISTINCT trabajador_id) as count FROM calendario WHERE fecha = CAST(GETDATE() AS DATE) AND estado = 'V'`
    );
    const bajasActivas = await queryOne(`SELECT COUNT(*) as count FROM bajas WHERE fecha_fin IS NULL`);
    const horasExtraMes = await queryOne(
      `SELECT ISNULL(SUM(horas), 0) as total FROM horas_extra WHERE MONTH(fecha) = @mes AND YEAR(fecha) = @anio`,
      { mes: { type: sql.Int, value: mes }, anio: { type: sql.Int, value: anio } }
    );

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        trabajadores: { total: trabajadores.total, fijos: trabajadores.fijos, discontinuos: trabajadores.discontinuos, extras: trabajadores.extras },
        vacacionesHoy: vacacionesHoy.count,
        bajasActivas: bajasActivas.count,
        horasExtraMes: parseFloat(horasExtraMes.total) || 0,
        fecha: now.toISOString(),
      },
    };
  } catch (error) {
    context.log.error('Error en getStats:', error);
    context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'Error interno del servidor' } };
  }
};
