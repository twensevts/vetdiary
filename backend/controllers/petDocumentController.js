const db = require('../config/db');

const ensureOwnedPet = async (petId, ownerId) => {
    const pet = await db.query('SELECT id FROM Pet WHERE id = $1 AND owner_id = $2', [petId, ownerId]);
    return pet.rows[0] || null;
};

class PetDocumentController {
    async getDocuments(req, res) {
        try {
            const { id: petId } = req.params;
            const ownerId = req.user.id;

            const pet = await ensureOwnedPet(petId, ownerId);
            if (!pet) {
                return res.status(404).json({ message: 'Питомец не найден' });
            }

            const documents = await db.query(
                `SELECT id, pet_id, title, document_type, file_name, file_data, created_at
                 FROM PetDocument
                 WHERE pet_id = $1
                 ORDER BY created_at DESC`,
                [petId]
            );

            return res.json(documents.rows);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: 'Ошибка при получении документов' });
        }
    }

    async createDocument(req, res) {
        try {
            const { id: petId } = req.params;
            const ownerId = req.user.id;
            // Support multipart upload via multer (req.file) or JSON body with base64
            const { title, document_type } = req.body;
            let file_name = null;
            let file_data = null;

            if (req.file) {
                file_name = req.file.originalname;
                file_data = req.file.buffer.toString('base64');
            } else {
                file_name = req.body.file_name;
                file_data = req.body.file_data;
            }

            if (!title || !file_name || !file_data) {
                return res.status(400).json({ message: 'Название, имя файла и содержимое обязательны' });
            }

            const pet = await ensureOwnedPet(petId, ownerId);
            if (!pet) {
                return res.status(404).json({ message: 'Питомец не найден' });
            }

            const newDocument = await db.query(
                `INSERT INTO PetDocument (pet_id, title, document_type, file_name, file_data)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, pet_id, title, document_type, file_name, file_data, created_at`,
                [petId, title, document_type || null, file_name, file_data]
            );

            return res.status(201).json(newDocument.rows[0]);
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: 'Ошибка при добавлении документа' });
        }
    }

    async deleteDocument(req, res) {
        try {
            const { id: petId, documentId } = req.params;
            const ownerId = req.user.id;

            const pet = await ensureOwnedPet(petId, ownerId);
            if (!pet) {
                return res.status(404).json({ message: 'Питомец не найден' });
            }

            const document = await db.query('SELECT id FROM PetDocument WHERE id = $1 AND pet_id = $2', [documentId, petId]);
            if (document.rows.length === 0) {
                return res.status(404).json({ message: 'Документ не найден' });
            }

            await db.query('DELETE FROM PetDocument WHERE id = $1', [documentId]);
            return res.json({ message: 'Документ удален' });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ message: 'Ошибка при удалении документа' });
        }
    }
}

module.exports = new PetDocumentController();
