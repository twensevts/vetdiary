const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateAccessToken = (id, role) => {
    const payload = { id, role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

class AuthController {
    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const result = await db.query('SELECT id, username, email, role, created_at FROM "User" WHERE id = $1', [userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            res.json(result.rows[0]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении профиля' });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { username, email, currentPassword, newPassword } = req.body;

            const userResult = await db.query('SELECT * FROM "User" WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            const user = userResult.rows[0];

            // Если меняется пароль — проверяем текущий
            if (newPassword) {
                if (!currentPassword) {
                    return res.status(400).json({ message: 'Для смены пароля укажите текущий пароль' });
                }
                const validPassword = bcrypt.compareSync(currentPassword, user.password_hash);
                if (!validPassword) {
                    return res.status(400).json({ message: 'Текущий пароль неверный' });
                }
            }

            // Если меняется email — проверяем уникальность
            if (email && email !== user.email) {
                const existing = await db.query('SELECT id FROM "User" WHERE email = $1 AND id != $2', [email, userId]);
                if (existing.rows.length > 0) {
                    return res.status(400).json({ message: 'Этот email уже занят' });
                }
            }

            const newUsername = username || user.username;
            const newEmail = email || user.email;
            const newHash = newPassword ? bcrypt.hashSync(newPassword, 7) : user.password_hash;

            await db.query(
                'UPDATE "User" SET username = $1, email = $2, password_hash = $3 WHERE id = $4',
                [newUsername, newEmail, newHash, userId]
            );

            res.json({ message: 'Профиль обновлён', username: newUsername, email: newEmail });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при обновлении профиля' });
        }
    }

    async registration(req, res) {
        try {
            const { username, email, password, role } = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({ message: 'Имя пользователя, email и пароль обязательны' });
            }

            const allowedRoles = ['owner', 'vet', 'admin'];
            const normalizedRole = role || 'owner';
            if (!allowedRoles.includes(normalizedRole)) {
                return res.status(400).json({ message: 'Некорректная роль пользователя' });
            }

            // Проверка, существует ли пользователь
            const candidate = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
            if (candidate.rows.length > 0) {
                return res.status(400).json({ message: "Пользователь с таким email уже существует" });
            }

            // Хеширование пароля
            const hashPassword = bcrypt.hashSync(password, 7);

            // Для ветеринара ставим статус pending
            const vetStatus = normalizedRole === 'vet' ? 'pending' : null;

            // Сохранение в БД
            const newUser = await db.query(
                `INSERT INTO "User" (username, email, password_hash, role, vet_status) VALUES ($1, $2, $3, $4, $5) RETURNING id, role, vet_status`,
                [username, email, hashPassword, normalizedRole, vetStatus]
            );

            return res.status(201).json({ message: "Пользователь успешно зарегистрирован", user: newUser.rows[0] });
        } catch (e) {
            console.error(e);
            res.status(400).json({ message: 'Ошибка регистрации' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email и пароль обязательны' });
            }

            const user = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ message: `Пользователь с email ${email} не найден` });
            }

            const validPassword = bcrypt.compareSync(password, user.rows[0].password_hash);
            if (!validPassword) {
                return res.status(400).json({ message: `Введен неверный пароль` });
            }

            // Проверка статуса ветеринара
            if (user.rows[0].role === 'vet' && user.rows[0].vet_status === 'pending') {
                return res.status(403).json({ message: 'Ваш аккаунт ветеринара ожидает проверки администратором' });
            }
            if (user.rows[0].role === 'vet' && user.rows[0].vet_status === 'rejected') {
                return res.status(403).json({ message: 'Ваш аккаунт ветеринара был отклонён администратором' });
            }

            const token = generateAccessToken(user.rows[0].id, user.rows[0].role);
            return res.json({ token, user: { id: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role, vet_status: user.rows[0].vet_status } });
        } catch (e) {
            console.error(e);
            res.status(400).json({ message: 'Ошибка авторизации' });
        }
    }

    async uploadVetDocument(req, res) {
        try {
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ message: 'userId обязателен' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'Файл документа обязателен' });
            }

            // Проверяем что пользователь — ветеринар
            const userResult = await db.query('SELECT * FROM "User" WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            if (userResult.rows[0].role !== 'vet') {
                return res.status(400).json({ message: 'Загрузка документа доступна только для ветеринаров' });
            }

            const fileBase64 = req.file.buffer.toString('base64');
            const fileName = req.file.originalname;

            await db.query(
                'INSERT INTO VetProfile (user_id, document_name, document_data) VALUES ($1, $2, $3)',
                [userId, fileName, fileBase64]
            );

            // Обновляем статус на pending (если ещё не установлен)
            await db.query('UPDATE "User" SET vet_status = $1 WHERE id = $2 AND (vet_status IS NULL OR vet_status = $3)', ['pending', userId, 'rejected']);

            return res.status(201).json({ message: 'Документ загружен. Ожидайте проверки администратором.' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при загрузке документа' });
        }
    }
}

module.exports = new AuthController();