const db = require('../config/db');

async function run() {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS CareEvent (
      id SERIAL PRIMARY KEY,
      pet_id INTEGER NOT NULL REFERENCES Pet(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL,
      event_date DATE NOT NULL,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    await db.query(`CREATE TABLE IF NOT EXISTS PetDocument (
      id SERIAL PRIMARY KEY,
      pet_id INTEGER NOT NULL REFERENCES Pet(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      document_type VARCHAR(100),
      file_name VARCHAR(255) NOT NULL,
      file_data TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    console.log('Missing tables created (if any).');
    process.exit(0);
  } catch (e) {
    console.error('Error creating tables:', e);
    process.exit(1);
  }
}

run();
