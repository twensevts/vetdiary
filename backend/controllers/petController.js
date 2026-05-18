const db = require('../config/db');

class PetController {
    async createPet(req, res) {
        try {
            const { name, species, breed, weight, birth_date, health_notes, photo_url } = req.body;
            const owner_id = req.user.id; // Берем id из токена

            if (weight < 0) {
                return res.status(400).json({ message: "Вес не может быть отрицательным" });
            }

            const newPet = await db.query(
                `INSERT INTO Pet (owner_id, name, species, breed, weight, birth_date, health_notes, photo_url) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [owner_id, name, species, breed, weight, birth_date, health_notes, photo_url]
            );

            res.status(201).json(newPet.rows[0]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при добавлении питомца' });
        }
    }

    async getPets(req, res) {
        try {
            const owner_id = req.user.id;
            const pets = await db.query('SELECT * FROM Pet WHERE owner_id = $1', [owner_id]);
            res.json(pets.rows);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении списка питомцев' });
        }
    }
}

module.exports = new PetController();