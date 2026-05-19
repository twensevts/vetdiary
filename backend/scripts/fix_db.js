const pool = require('../config/db');

async function fix() {
    try {
        await pool.query('ALTER TABLE "User" ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;');
        console.log('Column is_active added');
    } catch(e) {
        console.log(e.message);
    } finally {
        process.exit();
    }
}
fix();