const { getConnection } = require('../shared/db');
const J = { 'Content-Type': 'application/json' };

module.exports = async function (context, req) {
  const method = req.method;
  const path = context.bindingData.restOfPath || '';
  const parts = path.split('/').filter(Boolean);

  try {
    const pool = await getConnection();

    // === TIPOS PERMISO ===
    if (parts[0] === 'tipos-permiso') {
      if (method === 'GET') {
        const incluirInactivos = req.query.incluir_inactivos === 'true';
        let q = 'SELECT * FROM tipos_permiso';
        if (!incluirInactivos) q += ' WHERE activo = 1';
        q += ' ORDER BY nombre';
        const result = await pool.request().query(q);
        context.res = { status: 200, headers: J, body: result.recordset };
      } else if (method === 'POST') {
        const body = req.body;
        if (!body.codigo || !body.nombre) { context.res = { status: 400, headers: J, body: { error: 'Código y nombre son obligatorios' } }; return; }
        const result = await pool.request().input('codigo', body.codigo).input('nombre', body.nombre).input('diasMax', body.dias_max || null).input('retribuido', body.retribuido !== false).input('requiereJustificante', body.requiere_justificante || false)
          .query('INSERT INTO tipos_permiso (codigo, nombre, dias_max, retribuido, requiere_justificante) OUTPUT INSERTED.* VALUES (@codigo, @nombre, @diasMax, @retribuido, @requiereJustificante)');
        context.res = { status: 201, headers: J, body: result.recordset[0] };
      } else if (method === 'PUT' && parts[1]) {
        const body = req.body;
        const fields = [];
        const request = pool.request().input('id', parts[1]);
        if (body.codigo !== undefined) { fields.push('codigo = @codigo'); request.input('codigo', body.codigo); }
        if (body.nombre !== undefined) { fields.push('nombre = @nombre'); request.input('nombre', body.nombre); }
        if (body.dias_max !== undefined) { fields.push('dias_max = @diasMax'); request.input('diasMax', body.dias_max); }
        if (body.retribuido !== undefined) { fields.push('retribuido = @retribuido'); request.input('retribuido', body.retribuido); }
        if (body.requiere_justificante !== undefined) { fields.push('requiere_justificante = @requiereJustificante'); request.input('requiereJustificante', body.requiere_justificante); }
        if (body.activo !== undefined) { fields.push('activo = @activo'); request.input('activo', body.activo); }
        if (fields.length === 0) { context.res = { status: 400, headers: J, body: { error: 'No hay campos para actualizar' } }; return; }
        const result = await request.query(`UPDATE tipos_permiso SET ${fields.join(', ')} OUTPUT INSERTED.* WHERE id = @id`);
        if (result.recordset.length === 0) { context.res = { status: 404, headers: J, body: { error: 'Tipo de permiso no encontrado' } }; return; }
        context.res = { status: 200, headers: J, body: result.recordset[0] };
      }
      return;
    }

    // === TIPOS FORMACION ===
    if (parts[0] === 'tipos-formacion') {
      if (method === 'GET') {
        const result = await pool.request().query('SELECT * FROM tipos_formacion WHERE activo = 1 ORDER BY nombre');
        context.res = { status: 200, headers: J, body: result.recordset };
      } else if (method === 'POST') {
        const body = req.body;
        if (!body.codigo || !body.nombre) { context.res = { status: 400, headers: J, body: { error: 'Código y nombre son obligatorios' } }; return; }
        const result = await pool.request().input('codigo', body.codigo).input('nombre', body.nombre).input('duracionHoras', body.duracion_horas || null).input('caducidadAnios', body.caducidad_anios || null).input('requiereCertificado', body.requiere_certificado || false)
          .query('INSERT INTO tipos_formacion (codigo, nombre, duracion_horas, caducidad_anios, requiere_certificado) OUTPUT INSERTED.* VALUES (@codigo, @nombre, @duracionHoras, @caducidadAnios, @requiereCertificado)');
        context.res = { status: 201, headers: J, body: result.recordset[0] };
      }
      return;
    }

    // === CONFIGURACION POR CATEGORIA ===
    if (method === 'GET' && parts[0]) {
      const result = await pool.request().input('categoria', parts[0]).query('SELECT clave, valor, descripcion FROM configuracion WHERE categoria = @categoria');
      const config = {};
      result.recordset.forEach(row => { try { config[row.clave] = JSON.parse(row.valor); } catch { config[row.clave] = row.valor; } });
      context.res = { status: 200, headers: J, body: config };
    }
    // === CONFIGURACION COMPLETA ===
    else if (method === 'GET') {
      const result = await pool.request().query('SELECT clave, valor, categoria, descripcion FROM configuracion');
      const config = {};
      result.recordset.forEach(row => {
        if (!config[row.categoria]) config[row.categoria] = {};
        try { config[row.categoria][row.clave] = JSON.parse(row.valor); } catch { config[row.categoria][row.clave] = row.valor; }
      });
      context.res = { status: 200, headers: J, body: config };
    }
    // === ACTUALIZAR CONFIGURACION ===
    else if (method === 'PUT') {
      const body = req.body;
      for (const [categoria, valores] of Object.entries(body)) {
        for (const [clave, valor] of Object.entries(valores)) {
          const valorStr = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
          await pool.request().input('categoria', categoria).input('clave', clave).input('valor', valorStr)
            .query('MERGE configuracion AS target USING (SELECT @categoria as categoria, @clave as clave) AS source ON target.categoria = source.categoria AND target.clave = source.clave WHEN MATCHED THEN UPDATE SET valor = @valor, updated_at = GETDATE() WHEN NOT MATCHED THEN INSERT (categoria, clave, valor) VALUES (@categoria, @clave, @valor);');
        }
      }
      context.res = { status: 200, headers: J, body: { success: true, message: 'Configuración actualizada' } };
    }
  } catch (error) {
    context.log.error('Error en configuracion:', error);
    context.res = { status: 500, headers: J, body: { error: error.message } };
  }
};
