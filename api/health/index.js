const { getConnection, queryOne } = require('../shared/db');

module.exports = async function (context, req) {
  try {
    await getConnection();
    const dbCheck = await queryOne('SELECT 1 as ok');
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbCheck ? 'connected' : 'error',
        version: '2.0.0',
      },
    };
  } catch (error) {
    context.res = {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
      body: {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      },
    };
  }
};
