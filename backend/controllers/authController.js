const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const generateAccessToken = (id, role) => {
    const payload = { id, role };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

class AuthController {
    async registration(req, res) {
        try {
            const { username, email, password, role } = req.body;

            // Проверка, существует ли пользователь
            const candidate = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
            if (candidate.rows.length > 0) {
                return res.status(400).json({ message: "Пользователь с таким email уже существует" });
            }

            // Хеширование пароля
            const hashPassword = bcrypt.hashSync(password, 7);

            // Сохранение в БД
            const newUser = await db.query(
                `INSERT INTO "User" (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, role`,
                [username, email, hashPassword, role || 'owner']
            );

            return res.status(201).json({ message: "Пользователь успешно зарегистрирован" });
        } catch (e) {
            console.error(e);
            res.status(400).json({ message: 'Ошибка регистрации' });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const user = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ message: `Пользователь с email ${email} не найден` });
            }

            const validPassword = bcrypt.compareSync(password, user.rows[0].password_hash);
            if (!validPassword) {
                return res.status(400).json({ message: `Введен неверный пароль` });
            }

            const token = generateAccessToken(user.rows[0].id, user.rows[0].role);
            return res.json({ token, user: { id: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role } });
        } catch (e) {
            console.error(e);
            res.status(400).json({ message: 'Ошибка авторизации' });
        }
    }
}

module.exports = new AuthController();