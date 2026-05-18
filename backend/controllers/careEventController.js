const db = require('../config/db');

class CareEventController {
    async createEvent(req, res) {
        try {
            const { pet_id, event_type, event_date, description } = req.body;

            const newEvent = await db.query(
                `INSERT INTO CareEvent (pet_id, event_type, event_date, description) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [pet_id, event_type, event_date, description]
            );

            res.status(201).json(newEvent.rows[0]);
        } catch (e) {
            res.status(500).json({ message: 'Ошибка при добавлении события' });
        }
    }

    async getEventsByPet(req, res) {
        try {
            const { petId } = req.params;
            const events = await db.query('SELECT * FROM CareEvent WHERE pet_id = $1 ORDER BY event_date ASC', [petId]);
            res.json(events.rows);
        } catch (e) {
            res.status(500).json({ message: 'Ошибка при получении событий' });
        }
    }
}

module.exports = new CareEventController();