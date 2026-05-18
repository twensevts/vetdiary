require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

pool.query('SELECT NOW() as now')
  .then(res => { console.log('OK', res.rows[0]); return pool.end(); })
  .catch(err => { console.error('ERR', err); return pool.end(); });
