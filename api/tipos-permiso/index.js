const { query } = require('../shared/db');

module.exports = async function (context, req) {
  try {
    const activos = req.query.activos !== 'false';
    let sqlQuery = 'SELECT * FROM tipos_permiso';
    if (activos) sqlQuery += ' WHERE activo = 1';
    sqlQuery += ' ORDER BY nombre';
    const tipos = await query(sqlQuery);
    context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: tipos };
  } catch (error) {
    context.log.error('Error:', error);
    context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'Error interno del servidor' } };
  }
};
