const db = require('../config/db');

class PetController {
    async createPet(req, res) {
        try {
            const { name, species, breed, weight, birth_date, health_notes, photo_url } = req.body;
            const owner_id = req.user.id; // Берем id из токена

            if (!name || !species) {
                return res.status(400).json({ message: 'Имя и вид питомца обязательны' });
            }

            let normalizedWeight = null;
            if (weight !== '' && weight !== null && weight !== undefined) {
                normalizedWeight = Number(weight);
                if (!Number.isFinite(normalizedWeight)) {
                    return res.status(400).json({ message: 'Вес должен быть числом' });
                }
                if (normalizedWeight < 0) {
                    return res.status(400).json({ message: 'Вес не может быть отрицательным' });
                }
            }

            const newPet = await db.query(
                `INSERT INTO Pet (owner_id, name, species, breed, weight, birth_date, health_notes, photo_url) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [owner_id, name, species, breed, normalizedWeight, birth_date || null, health_notes || null, photo_url || null]
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

    async updatePet(req, res) {
        try {
            const petId = req.params.id;
            const userId = req.user.id;
            const { name, species, breed, weight, birth_date, health_notes, photo_url } = req.body;

            const existing = await db.query('SELECT * FROM Pet WHERE id = $1', [petId]);
            if (existing.rowCount === 0) return res.status(404).json({ message: 'Питомец не найден' });
            const pet = existing.rows[0];

            if (pet.owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Доступ запрещен' });
            }

            let normalizedWeight = null;
            if (weight !== '' && weight !== null && weight !== undefined) {
                normalizedWeight = Number(weight);
                if (!Number.isFinite(normalizedWeight)) {
                    return res.status(400).json({ message: 'Вес должен быть числом' });
                }
            }

            const result = await db.query(
                `UPDATE Pet SET name=$1, species=$2, breed=$3, weight=$4, birth_date=$5, health_notes=$6, photo_url=$7 WHERE id=$8 RETURNING *`,
                [name || pet.name, species || pet.species, breed || pet.breed, normalizedWeight, birth_date || pet.birth_date, health_notes || pet.health_notes, photo_url || pet.photo_url, petId]
            );

            res.json(result.rows[0]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при обновлении питомца' });
        }
    }

    async deletePet(req, res) {
        try {
            const petId = req.params.id;
            const userId = req.user.id;

            const existing = await db.query('SELECT * FROM Pet WHERE id = $1', [petId]);
            if (existing.rowCount === 0) return res.status(404).json({ message: 'Питомец не найден' });
            const pet = existing.rows[0];

            if (pet.owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Доступ запрещен' });
            }

            await db.query('DELETE FROM Pet WHERE id = $1', [petId]);
            res.json({ message: 'Питомец удален' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при удалении питомца' });
        }
    }

    async uploadPhoto(req, res) {
        try {
            const petId = req.params.id;
            const userId = req.user.id;

            const existing = await db.query('SELECT * FROM Pet WHERE id = $1', [petId]);
            if (existing.rowCount === 0) return res.status(404).json({ message: 'Питомец не найден' });
            const pet = existing.rows[0];

            if (pet.owner_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Доступ запрещен' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'Файл фото обязателен' });
            }

            const mimeType = req.file.mimetype;
            const base64 = req.file.buffer.toString('base64');
            const photoUrl = `data:${mimeType};base64,${base64}`;

            await db.query('UPDATE Pet SET photo_url = $1 WHERE id = $2', [photoUrl, petId]);

            res.json({ message: 'Фото загружено', photo_url: photoUrl });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при загрузке фото' });
        }
    }

    async getPhoto(req, res) {
        try {
            const petId = req.params.id;
            const result = await db.query('SELECT photo_url FROM Pet WHERE id = $1', [petId]);
            if (result.rowCount === 0) return res.status(404).json({ message: 'Питомец не найден' });

            const photoUrl = result.rows[0].photo_url;
            if (!photoUrl) return res.status(404).json({ message: 'Фото не загружено' });

            res.json({ photo_url: photoUrl });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении фото' });
        }
    }

    async getPet(req, res) {
        try {
            const petId = req.params.id;
            const result = await db.query('SELECT * FROM Pet WHERE id = $1', [petId]);
            if (result.rowCount === 0) return res.status(404).json({ message: 'Питомец не найден' });
            res.json(result.rows[0]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении питомца' });
        }
    }
}

module.exports = new PetController();