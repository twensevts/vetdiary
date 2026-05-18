const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

pool.on('connect', () => {
    console.log('Подключение к базе данных PostgreSQL успешно установлено.');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к базе данных:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};