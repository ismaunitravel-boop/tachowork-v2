/**
 * TachoWork API - Database Connection (IMPROVED)
 * Conexión a Azure SQL Database con retry para cold starts
 */

const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 60000,   // 60s → da tiempo a que Azure SQL despierte
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 60000,   // 60s antes de cerrar conexiones idle
    acquireTimeoutMillis: 60000, // 60s para adquirir conexión del pool
  },
};

let pool = null;
let connecting = false;

/**
 * Obtiene una conexión con retry automático para cold starts
 * Azure SQL Serverless puede tardar 30-60s en despertar
 */
async function getConnection(retries = 3) {
  // Si ya hay pool activo, usarlo
  if (pool && pool.connected) {
    return pool;
  }

  // Evitar múltiples intentos simultáneos
  if (connecting) {
    // Esperar a que el intento actual termine
    await new Promise(r => setTimeout(r, 2000));
    if (pool && pool.connected) return pool;
  }

  connecting = true;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`DB connection attempt ${attempt}/${retries}...`);

      // Cerrar pool anterior si existe pero está desconectado
      if (pool) {
        try { await pool.close(); } catch {}
        pool = null;
      }

      pool = await sql.connect(config);
      console.log(`DB connected on attempt ${attempt}`);

      // Listener para reconectar si se cae
      pool.on('error', (err) => {
        console.error('Pool error:', err.message);
        pool = null;
      });

      connecting = false;
      return pool;

    } catch (err) {
      lastError = err;
      console.warn(`DB attempt ${attempt} failed: ${err.message}`);

      if (attempt < retries) {
        // Backoff: 5s, 10s, 15s
        const delay = attempt * 5000;
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  connecting = false;
  throw lastError;
}

async function executeQuery(queryStr, params = {}) {
  const conn = await getConnection();
  const request = conn.request();
  for (const [name, param] of Object.entries(params)) {
    request.input(name, param.type, param.value);
  }
  return request.query(queryStr);
}

async function query(sqlQuery, params = {}) {
  const result = await executeQuery(sqlQuery, params);
  return result.recordset;
}

async function queryOne(sqlQuery, params = {}) {
  const result = await executeQuery(sqlQuery, params);
  return result.recordset[0] || null;
}

async function execute(sqlQuery, params = {}) {
  const result = await executeQuery(sqlQuery, params);
  return result.rowsAffected[0];
}

module.exports = {
  sql,
  getConnection,
  executeQuery,
  query,
  queryOne,
  execute,
};
