const db = require('../config/db');

class CareEventController {
    async createEvent(req, res) {
        try {
            const { pet_id, event_type, event_date, description } = req.body;

            if (!pet_id || !event_type || !event_date) {
                return res.status(400).json({ message: 'pet_id, event_type и event_date обязательны' });
            }

            // ownership check
            const petRes = await db.query('SELECT owner_id FROM Pet WHERE id = $1', [pet_id]);
            if (petRes.rowCount === 0) return res.status(404).json({ message: 'Питомец не найден' });
            const pet = petRes.rows[0];
            if (pet.owner_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Доступ запрещен' });
            }

            const newEvent = await db.query(
                `INSERT INTO CareEvent (pet_id, event_type, event_date, description) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [pet_id, event_type, event_date, description || null]
            );

            res.status(201).json(newEvent.rows[0]);
        } catch (e) {
            res.status(500).json({ message: 'Ошибка при добавлении события' });
        }
    }

    async getEventsByPet(req, res) {
        try {
            const { petId } = req.params;
            const petRes = await db.query('SELECT owner_id FROM Pet WHERE id = $1', [petId]);
            if (petRes.rowCount === 0) return res.status(404).json({ message: 'Питомец не найден' });
            const pet = petRes.rows[0];
            if (pet.owner_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Доступ запрещен' });
            }
            const events = await db.query('SELECT * FROM CareEvent WHERE pet_id = $1 ORDER BY event_date ASC', [petId]);
            res.json(events.rows);
        } catch (e) {
            res.status(500).json({ message: 'Ошибка при получении событий' });
        }
    }
}

module.exports = new CareEventController();