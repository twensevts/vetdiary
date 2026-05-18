const db = require('../config/db');

async function run() {
  try {
    const res = await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public';");
    console.log(res.rows.map(r => r.tablename).join('\n'));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
