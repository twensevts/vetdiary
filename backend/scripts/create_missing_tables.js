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

    await db.query(`CREATE TABLE IF NOT EXISTS PostComment (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES Post(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    // Ensure parent_id column exists to support threaded replies
    try {
      await db.query(`ALTER TABLE postcomment ADD COLUMN IF NOT EXISTS parent_id INTEGER`);
    } catch (e) {
      // ignore if alter fails for any reason
    }

    try {
      await db.query(`ALTER TABLE comment ADD COLUMN IF NOT EXISTS parent_id INTEGER`);
    } catch (e) {
      // ignore if table 'comment' doesn't exist or alter fails
    }

    console.log('Missing tables created (if any).');
    process.exit(0);
  } catch (e) {
    console.error('Error creating tables:', e);
    process.exit(1);
  }
}

run();
