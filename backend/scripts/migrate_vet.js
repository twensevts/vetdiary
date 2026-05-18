const db = require('../config/db');

async function migrate() {
    try {
        // Добавляем колонку vet_status в таблицу User
        await db.query(`
            ALTER TABLE "User" ADD COLUMN IF NOT EXISTS vet_status VARCHAR(20) DEFAULT NULL
        `);
        console.log('Колонка vet_status добавлена в таблицу User');

        // Создаём таблицу VetProfile
        await db.query(`
            CREATE TABLE IF NOT EXISTS VetProfile (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
                document_name VARCHAR(255) NOT NULL,
                document_data TEXT NOT NULL,
                uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        `);
        console.log('Таблица VetProfile создана');

        process.exit(0);
    } catch (e) {
        console.error('Ошибка миграции:', e);
        process.exit(1);
    }
}

migrate();
