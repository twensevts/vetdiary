const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async function (req, res, next) {
    if (req.method === "OPTIONS") {
        return next();
    }
    try {
        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
        }
        const token = authHeader.split(' ')[1]; // Ожидаем заголовок "Bearer TOKEN"
        if (!token) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Проверим, активен ли пользователь в БД
        const userRes = await db.query('SELECT is_active FROM "User" WHERE id = $1', [decoded.id]);
        if (userRes.rowCount === 0) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }
        if (!userRes.rows[0].is_active) {
            return res.status(403).json({ message: 'Аккаунт заблокирован' });
        }
        req.user = decoded; // Добавляем данные пользователя (id, role) в объект запроса
        next();
    } catch (e) {
        console.error('authMiddleware error', e.message);
        res.status(401).json({ message: "Пользователь не авторизован" });
    }
};