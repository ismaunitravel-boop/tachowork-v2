const { sql, query, queryOne, execute } = require('../shared/db');

module.exports = async function (context, req) {
  const method = req.method;
  const id = req.params.id;

  try {
    if (method === 'GET') {
      if (id) {
        const trabajador = await queryOne('SELECT * FROM trabajadores WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
        if (!trabajador) { context.res = { status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Trabajador no encontrado' } }; return; }
        if (trabajador.tipo === 'fijo-discontinuo') {
          trabajador.ciclos = await query('SELECT * FROM ciclos WHERE trabajador_id = @id ORDER BY fecha_inicio DESC', { id: { type: sql.UniqueIdentifier, value: id } });
        }
        context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: trabajador };
      } else {
        const tipo = req.query.tipo;
        const activo = req.query.activo;
        let sqlQuery = 'SELECT * FROM trabajadores WHERE 1=1';
        const params = {};
        if (tipo && tipo !== 'todos') { sqlQuery += ' AND tipo = @tipo'; params.tipo = { type: sql.VarChar, value: tipo }; }
        if (activo !== undefined) { sqlQuery += ' AND activo = @activo'; params.activo = { type: sql.Bit, value: activo === 'true' ? 1 : 0 }; }
        sqlQuery += ' ORDER BY numero ASC';
        const trabajadores = await query(sqlQuery, params);
        context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: trabajadores };
      }
    } else if (method === 'POST') {
      const body = req.body;
      if (!body.nombre || !body.fecha_inicio) { context.res = { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'Nombre y fecha de inicio son obligatorios' } }; return; }
      const maxNumero = await queryOne('SELECT MAX(numero) as max FROM trabajadores');
      const nuevoNumero = (maxNumero?.max || 0) + 1;
      const result = await queryOne(
        `INSERT INTO trabajadores (numero, nombre, tipo, fecha_inicio, dias_trabajo_semana, horas_anuales, dias_vacaciones_base, email, telefono, notas) OUTPUT INSERTED.* VALUES (@numero, @nombre, @tipo, @fecha_inicio, @dias_trabajo_semana, @horas_anuales, @dias_vacaciones_base, @email, @telefono, @notas)`,
        {
          numero: { type: sql.Int, value: nuevoNumero },
          nombre: { type: sql.VarChar, value: body.nombre },
          tipo: { type: sql.VarChar, value: body.tipo || 'fijo' },
          fecha_inicio: { type: sql.Date, value: new Date(body.fecha_inicio) },
          dias_trabajo_semana: { type: sql.Int, value: body.dias_trabajo_semana || 5 },
          horas_anuales: { type: sql.Int, value: body.horas_anuales || 1777 },
          dias_vacaciones_base: { type: sql.Int, value: body.dias_vacaciones_base || 22 },
          email: { type: sql.VarChar, value: body.email || null },
          telefono: { type: sql.VarChar, value: body.telefono || null },
          notas: { type: sql.Text, value: body.notas || null },
        }
      );
      context.res = { status: 201, headers: { 'Content-Type': 'application/json' }, body: result };
    } else if (method === 'PUT' && id) {
      const body = req.body;
      const existe = await queryOne('SELECT id FROM trabajadores WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (!existe) { context.res = { status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Trabajador no encontrado' } }; return; }
      const result = await queryOne(
        `UPDATE trabajadores SET nombre = @nombre, tipo = @tipo, fecha_inicio = @fecha_inicio, fecha_fin = @fecha_fin, dias_trabajo_semana = @dias_trabajo_semana, horas_anuales = @horas_anuales, dias_vacaciones_base = @dias_vacaciones_base, email = @email, telefono = @telefono, notas = @notas, activo = @activo, updated_at = GETUTCDATE() OUTPUT INSERTED.* WHERE id = @id`,
        {
          id: { type: sql.UniqueIdentifier, value: id },
          nombre: { type: sql.VarChar, value: body.nombre },
          tipo: { type: sql.VarChar, value: body.tipo },
          fecha_inicio: { type: sql.Date, value: body.fecha_inicio ? new Date(body.fecha_inicio) : null },
          fecha_fin: { type: sql.Date, value: body.fecha_fin ? new Date(body.fecha_fin) : null },
          dias_trabajo_semana: { type: sql.Int, value: body.dias_trabajo_semana },
          horas_anuales: { type: sql.Int, value: body.horas_anuales },
          dias_vacaciones_base: { type: sql.Int, value: body.dias_vacaciones_base },
          email: { type: sql.VarChar, value: body.email || null },
          telefono: { type: sql.VarChar, value: body.telefono || null },
          notas: { type: sql.Text, value: body.notas || null },
          activo: { type: sql.Bit, value: body.activo !== false ? 1 : 0 },
        }
      );
      context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: result };
    } else if (method === 'DELETE' && id) {
      const rowsAffected = await execute('DELETE FROM trabajadores WHERE id = @id', { id: { type: sql.UniqueIdentifier, value: id } });
      if (rowsAffected === 0) { context.res = { status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Trabajador no encontrado' } }; return; }
      context.res = { status: 204 };
    }
  } catch (error) {
    context.log.error('Error en trabajadores:', error);
    context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'Error interno del servidor' } };
  }
};
