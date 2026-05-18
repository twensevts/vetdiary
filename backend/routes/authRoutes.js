const Router = require('express');
const router = new Router();
const controller = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/register', controller.registration);
router.post('/login', controller.login);
router.get('/profile', authMiddleware, controller.getProfile);
router.put('/profile', authMiddleware, controller.updateProfile);
router.post('/vet-document', upload.single('document'), controller.uploadVetDocument);

module.exports = router;