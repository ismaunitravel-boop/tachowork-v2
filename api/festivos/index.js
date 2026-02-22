const { getConnection } = require('../shared/db');

module.exports = async function (context, req) {
  const method = req.method;
  const id = req.params.id;

  try {
    const pool = await getConnection();

    if (method === 'GET') {
      const anio = req.query.anio;
      let sqlQuery = 'SELECT id, fecha, nombre, tipo FROM festivos WHERE 1=1';
      const request = pool.request();
      if (anio) { sqlQuery += ' AND YEAR(fecha) = @anio'; request.input('anio', parseInt(anio)); }
      sqlQuery += ' ORDER BY fecha';
      const result = await request.query(sqlQuery);
      context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: result.recordset };
    } else if (method === 'POST') {
      const body = req.body;
      if (!body.fecha || !body.nombre) { context.res = { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'Fecha y nombre son obligatorios' } }; return; }
      const result = await pool.request()
        .input('fecha', body.fecha).input('nombre', body.nombre).input('tipo', body.tipo || 'nacional')
        .query('INSERT INTO festivos (fecha, nombre, tipo) OUTPUT INSERTED.* VALUES (@fecha, @nombre, @tipo)');
      context.res = { status: 201, headers: { 'Content-Type': 'application/json' }, body: result.recordset[0] };
    } else if (method === 'DELETE' && id) {
      const result = await pool.request().input('id', id).query('DELETE FROM festivos OUTPUT DELETED.id WHERE id = @id');
      if (result.recordset.length === 0) { context.res = { status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Festivo no encontrado' } }; return; }
      context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: { success: true, deleted: id } };
    }
  } catch (error) {
    context.log.error('Error en festivos:', error);
    context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: error.message } };
  }
};
