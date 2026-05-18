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
                       pet.name as pet_name, pet.species as pet_species, pet.breed as pet_breed,
                       pet.birth_date as pet_birth_date, pet.weight as pet_weight, 
                       pet.health_notes as pet_health_notes, pet.photo_url as pet_photo_url,
                       pet.owner_id as pet_owner_id
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

    async deletePost(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            const post = await db.query('SELECT id, author_id FROM Post WHERE id = $1', [id]);
            if (post.rows.length === 0) {
                return res.status(404).json({ message: 'Пост не найден' });
            }

            const isAuthor = Number(post.rows[0].author_id) === Number(userId);
            const isAdmin = userRole === 'admin';

            if (!isAuthor && !isAdmin) {
                return res.status(403).json({ message: 'Недостаточно прав для удаления поста' });
            }

            await db.query('DELETE FROM Post WHERE id = $1', [id]);
            return res.json({ message: 'Пост удален' });
        } catch (e) {
            return res.status(500).json({ message: 'Ошибка при удалении поста' });
        }
    }
}

module.exports = new PostController();