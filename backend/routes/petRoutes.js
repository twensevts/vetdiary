const Router = require('express');
const router = new Router();
const petController = require('../controllers/petController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, petController.createPet);
router.get('/', authMiddleware, petController.getPets);
router.put('/:id', authMiddleware, petController.updatePet);
router.delete('/:id', authMiddleware, petController.deletePet);

module.exports = router;