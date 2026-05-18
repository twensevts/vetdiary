const Router = require('express');
const router = new Router();
const careEventController = require('../controllers/careEventController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, careEventController.createEvent);
router.get('/:petId', authMiddleware, careEventController.getEventsByPet);

module.exports = router;