const db = require('../config/db');

class PostController {
    async createPost(req, res) {
        try {
            const { title, content, pet_id } = req.body;
            const author_id = req.user.id;

            if (!title || !content) {
                return res.status(400).json({ message: "Заголовок и текст обязательны" });
            }

            const newPost = await db.query(
                `INSERT INTO Post (author_id, pet_id, title, content) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [author_id, pet_id || null, title, content]
            );

            res.status(201).json(newPost.rows[0]);
        } catch (e) {
            res.status(500).json({ message: 'Ошибка при создании поста' });
        }
    }

    async getPosts(req, res) {
        try {
            const posts = await db.query(`
                SELECT p.*, u.username, u.role, 
                       pet.name as pet_name, pet.species as pet_species, pet.breed as pet_breed
                FROM Post p
                JOIN "User" u ON p.author_id = u.id
                LEFT JOIN Pet pet ON p.pet_id = pet.id
                ORDER BY p.created_at DESC
            `);
            res.json(posts.rows);
        } catch (e) {
            res.status(500).json({ message: 'Ошибка при получении постов' });
        }
    }
}

module.exports = new PostController();