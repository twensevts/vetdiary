const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Make sure correct path is used
// or just standard if we run from backend
require('dotenv').config();

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const pass = await bcrypt.hash('admin123', 10);
        await pool.query(
            `INSERT INTO "User" (username, email, password_hash, role) 
             VALUES ('Главный Админ', 'admin@vetdiary.ru', $1, 'admin') 
             ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = $1`,
            [pass]
        );
        console.log('Аккаунт администратора зарегистрирован/обновлен!');
        console.log('Логин: admin@vetdiary.ru');
        console.log('Пароль: admin123');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

createAdmin();