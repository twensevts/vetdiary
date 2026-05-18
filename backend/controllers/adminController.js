const db = require('../config/db');

class AdminController {
    // Получить всех пользователей
    async getUsers(req, res) {
        try {
            const result = await db.query(
                'SELECT id, username, email, role, vet_status, is_active, created_at FROM "User" ORDER BY created_at DESC'
            );
            res.json(result.rows);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении пользователей' });
        }
    }

    // Получить заявки ветеринаров (pending)
    async getVetRequests(req, res) {
        try {
            const result = await db.query(
                `SELECT u.id, u.username, u.email, u.vet_status, u.created_at,
                        vp.document_name, vp.uploaded_at
                 FROM "User" u
                 LEFT JOIN VetProfile vp ON vp.user_id = u.id
                 WHERE u.role = 'vet' AND u.vet_status = 'pending'
                 ORDER BY u.created_at DESC`
            );
            res.json(result.rows);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении заявок ветеринаров' });
        }
    }

    // Одобрить ветеринара
    async approveVet(req, res) {
        try {
            const { userId } = req.params;
            const result = await db.query(
                'UPDATE "User" SET vet_status = $1 WHERE id = $2 AND role = $3 RETURNING id, username, email, vet_status',
                ['approved', userId, 'vet']
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Ветеринар не найден' });
            }
            res.json({ message: 'Ветеринар одобрен', user: result.rows[0] });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при одобрении ветеринара' });
        }
    }

    // Отклонить ветеринара
    async rejectVet(req, res) {
        try {
            const { userId } = req.params;
            const result = await db.query(
                'UPDATE "User" SET vet_status = $1 WHERE id = $2 AND role = $3 RETURNING id, username, email, vet_status',
                ['rejected', userId, 'vet']
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Ветеринар не найден' });
            }
            res.json({ message: 'Ветеринар отклонён', user: result.rows[0] });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при отклонении ветеринара' });
        }
    }

    // Заблокировать/разблокировать пользователя
    async toggleUserActive(req, res) {
        try {
            const { userId } = req.params;
            const user = await db.query('SELECT * FROM "User" WHERE id = $1', [userId]);
            if (user.rowCount === 0) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }

            const newStatus = !user.rows[0].is_active;
            await db.query('UPDATE "User" SET is_active = $1 WHERE id = $2', [newStatus, userId]);
            res.json({ message: newStatus ? 'Пользователь разблокирован' : 'Пользователь заблокирован', is_active: newStatus });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при изменении статуса пользователя' });
        }
    }

    // Удалить пост (модерация)
    async deletePost(req, res) {
        try {
            const { postId } = req.params;
            const result = await db.query('DELETE FROM Post WHERE id = $1', [postId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Пост не найден' });
            }
            res.json({ message: 'Пост удалён' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при удалении поста' });
        }
    }

    // Получить документ ветеринара
    async getVetDocument(req, res) {
        try {
            const { userId } = req.params;
            const result = await db.query(
                'SELECT document_name, document_data FROM VetProfile WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
                [userId]
            );
            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Документ не найден' });
            }
            res.json(result.rows[0]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении документа' });
        }
    }
}

module.exports = new AdminController();
