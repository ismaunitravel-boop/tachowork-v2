const { sql, queryOne, execute, query } = require('../shared/db');

module.exports = async function (context, req) {
  try {
    const body = req.body;
    if (!body || !body.workers) {
      context.res = { status: 400, headers: { 'Content-Type': 'application/json' }, body: { error: 'Formato de datos inválido. Se espera {workers: [...]}' } };
      return;
    }

    const results = { trabajadores: { imported: 0, errors: 0 }, ciclos: { imported: 0, errors: 0 }, calendario: { imported: 0, errors: 0 }, vacaciones: { imported: 0, errors: 0 } };

    for (const worker of body.workers) {
      try {
        const trabajador = await queryOne(
          `INSERT INTO trabajadores (numero, nombre, tipo, fecha_inicio, fecha_fin, dias_trabajo_semana, activo) OUTPUT INSERTED.* VALUES (@numero, @nombre, @tipo, @fecha_inicio, @fecha_fin, @dias_trabajo_semana, @activo)`,
          {
            numero: { type: sql.Int, value: worker.number || worker.numero },
            nombre: { type: sql.VarChar, value: worker.name || worker.nombre },
            tipo: { type: sql.VarChar, value: worker.tipo || 'fijo' },
            fecha_inicio: { type: sql.Date, value: worker.startDate ? new Date(worker.startDate) : new Date() },
            fecha_fin: { type: sql.Date, value: worker.endDate ? new Date(worker.endDate) : null },
            dias_trabajo_semana: { type: sql.Int, value: worker.diasTrabajo || 5 },
            activo: { type: sql.Bit, value: worker.activo !== false ? 1 : 0 },
          }
        );
        results.trabajadores.imported++;

        if (worker.ciclos && Array.isArray(worker.ciclos)) {
          for (const ciclo of worker.ciclos) {
            try {
              await execute(`INSERT INTO ciclos (trabajador_id, fecha_inicio, fecha_fin, dias_vacaciones) VALUES (@trabajador_id, @fecha_inicio, @fecha_fin, @dias_vacaciones)`, {
                trabajador_id: { type: sql.UniqueIdentifier, value: trabajador.id },
                fecha_inicio: { type: sql.Date, value: new Date(ciclo.startDate || ciclo.inicio) },
                fecha_fin: { type: sql.Date, value: ciclo.endDate || ciclo.fin ? new Date(ciclo.endDate || ciclo.fin) : null },
                dias_vacaciones: { type: sql.Int, value: ciclo.diasVacaciones || 0 },
              });
              results.ciclos.imported++;
            } catch (e) { results.ciclos.errors++; }
          }
        }

        if (worker.calendar && typeof worker.calendar === 'object') {
          for (const [fecha, estado] of Object.entries(worker.calendar)) {
            try {
              await execute(`INSERT INTO calendario (trabajador_id, fecha, estado) VALUES (@trabajador_id, @fecha, @estado)`, {
                trabajador_id: { type: sql.UniqueIdentifier, value: trabajador.id },
                fecha: { type: sql.Date, value: new Date(fecha) },
                estado: { type: sql.VarChar, value: estado },
              });
              results.calendario.imported++;
            } catch (e) { results.calendario.errors++; }
          }
        }

        if (worker.vacaciones && Array.isArray(worker.vacaciones)) {
          for (const vac of worker.vacaciones) {
            try {
              await execute(`INSERT INTO vacaciones (trabajador_id, anio, fecha_inicio, fecha_fin, dias_totales, dias_habiles, estado) VALUES (@trabajador_id, @anio, @fecha_inicio, @fecha_fin, @dias_totales, @dias_habiles, @estado)`, {
                trabajador_id: { type: sql.UniqueIdentifier, value: trabajador.id },
                anio: { type: sql.Int, value: vac.anio || new Date(vac.inicio).getFullYear() },
                fecha_inicio: { type: sql.Date, value: new Date(vac.inicio) },
                fecha_fin: { type: sql.Date, value: new Date(vac.fin) },
                dias_totales: { type: sql.Int, value: vac.diasTotales || vac.dias || 0 },
                dias_habiles: { type: sql.Int, value: vac.diasHabiles || vac.dias || 0 },
                estado: { type: sql.VarChar, value: 'disfrutado' },
              });
              results.vacaciones.imported++;
            } catch (e) { results.vacaciones.errors++; }
          }
        }
      } catch (e) {
        context.log.error(`Error importando trabajador ${worker.name}:`, e);
        results.trabajadores.errors++;
      }
    }

    context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: { success: true, message: 'Migración completada', results } };
  } catch (error) {
    context.log.error('Error en migrateData:', error);
    context.res = { status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'Error interno del servidor', details: error.message } };
  }
};
