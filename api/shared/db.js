const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getConnection() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

async function executeQuery(query, params = {}) {
  const conn = await getConnection();
  const request = conn.request();
  for (const [name, param] of Object.entries(params)) {
    request.input(name, param.type, param.value);
  }
  const result = await request.query(query);
  return result;
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

module.exports = { sql, getConnection, executeQuery, query, queryOne, execute };
