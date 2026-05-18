const Router = require('express');
const router = new Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const petDocumentController = require('../controllers/petDocumentController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:id/documents', authMiddleware, petDocumentController.getDocuments);
router.post('/:id/documents', authMiddleware, upload.single('file'), petDocumentController.createDocument);
router.delete('/:id/documents/:documentId', authMiddleware, petDocumentController.deleteDocument);

module.exports = router;
