const Router = require('express');
const router = new Router();
const petController = require('../controllers/petController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', authMiddleware, petController.createPet);
router.get('/', authMiddleware, petController.getPets);
router.put('/:id', authMiddleware, petController.updatePet);
router.delete('/:id', authMiddleware, petController.deletePet);
router.post('/:id/photo', authMiddleware, upload.single('photo'), petController.uploadPhoto);
router.get('/:id/photo', petController.getPhoto);
router.get('/:id', petController.getPet);

module.exports = router;