const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        next();
    }
    try {
        const token = req.headers.authorization.split(' ')[1]; // Ожидаем заголовок "Bearer TOKEN"
        if (!token) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Добавляем данные пользователя (id, role) в объект запроса
        next();
    } catch (e) {
        res.status(401).json({ message: "Пользователь не авторизован" });
    }
};