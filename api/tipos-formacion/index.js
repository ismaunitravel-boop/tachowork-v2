const { getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(
      'SELECT id, codigo, nombre, duracion_horas, caducidad_anios, requiere_certificado, activo, created_at FROM tipos_formacion WHERE activo = 1 ORDER BY nombre'
    );
    context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: result.recordset };
  } catch (error) {
    context.log.error('Error:', error);
    context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: error.message } };
  }
};
