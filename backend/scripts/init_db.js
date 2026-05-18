const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    // split statements by semicolon followed by newline to be safe
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await db.query(stmt);
        console.log('Executed statement');
      } catch (e) {
        console.error('Statement failed:', e.message);
      }
    }
    console.log('Done');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
