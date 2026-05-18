const Router = require('express');
const router = new Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.get('/vet-requests', authMiddleware, adminMiddleware, adminController.getVetRequests);
router.get('/vet-document/:userId', authMiddleware, adminMiddleware, adminController.getVetDocument);
router.put('/vet-approve/:userId', authMiddleware, adminMiddleware, adminController.approveVet);
router.put('/vet-reject/:userId', authMiddleware, adminMiddleware, adminController.rejectVet);
router.put('/user-toggle/:userId', authMiddleware, adminMiddleware, adminController.toggleUserActive);
router.delete('/posts/:postId', authMiddleware, adminMiddleware, adminController.deletePost);

module.exports = router;
