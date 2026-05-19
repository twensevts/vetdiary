const db = require('../config/db');

// Список email'ов, которые НЕ УДАЛЯТЬ
const keepEmails = [
    'darya@mail.ru',
    'darya@gmail.com',
    'admin@vetdiary.ru',
    'sergey@mail.ru',
    'katya@mail.ru'
].map(s => s.trim()).filter(Boolean);

async function detectCommentTable() {
    const postCommentTable = await db.query(`SELECT to_regclass('public.postcomment') AS table_name`);
    if (postCommentTable.rows[0].table_name) return 'postcomment';
    const commentTable = await db.query(`SELECT to_regclass('public.comment') AS table_name`);
    if (commentTable.rows[0].table_name) return 'comment';
    return null;
}

async function run() {
    try {
        console.log('Keep emails:', keepEmails);

        const usersFound = await db.query('SELECT id, email FROM "User" WHERE email = ANY($1)', [keepEmails]);
        console.log('Found users to keep:', usersFound.rowCount);
        usersFound.rows.forEach(r => console.log(` - ${r.email} (id=${r.id})`));

        const commentTable = await detectCommentTable();
        if (commentTable) {
            const delComments = await db.query(
                `DELETE FROM ${commentTable} WHERE author_id NOT IN (SELECT id FROM "User" WHERE email = ANY($1))`,
                [keepEmails]
            );
            console.log(`Deleted ${delComments.rowCount} rows from ${commentTable}`);
        } else {
            console.log('Comment table not found, skipping comments cleanup');
        }

        const delPosts = await db.query(
            `DELETE FROM Post WHERE author_id NOT IN (SELECT id FROM "User" WHERE email = ANY($1))`,
            [keepEmails]
        );
        console.log(`Deleted ${delPosts.rowCount} rows from Post`);

        const delPets = await db.query(
            `DELETE FROM Pet WHERE owner_id NOT IN (SELECT id FROM "User" WHERE email = ANY($1))`,
            [keepEmails]
        );
        console.log(`Deleted ${delPets.rowCount} rows from Pet`);

        const delVetProfiles = await db.query(
            `DELETE FROM VetProfile WHERE user_id NOT IN (SELECT id FROM "User" WHERE email = ANY($1))`,
            [keepEmails]
        );
        console.log(`Deleted ${delVetProfiles.rowCount} rows from VetProfile`);

        const delUsers = await db.query(
            `DELETE FROM "User" WHERE NOT (email = ANY($1)) RETURNING id, email`,
            [keepEmails]
        );
        console.log(`Deleted ${delUsers.rowCount} users:`);
        delUsers.rows.forEach(r => console.log(` - ${r.email} (id=${r.id})`));

        console.log('Done.');
        process.exit(0);
    } catch (e) {
        console.error('Error running delete script:', e);
        process.exit(2);
    }
}

run();
