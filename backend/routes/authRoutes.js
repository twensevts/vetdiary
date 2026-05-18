const Router = require('express');
const router = new Router();
const controller = require('../controllers/authController');

router.post('/register', controller.registration);
router.post('/login', controller.login);

module.exports = router;