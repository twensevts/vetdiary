const Router = require('express');
const router = new Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, postController.createPost);
router.get('/', postController.getPosts);
router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:postId/comments', authMiddleware, commentController.createComment);
router.get('/:postId/comments', commentController.getComments);
router.delete('/:postId/comments/:commentId', authMiddleware, commentController.deleteComment);

module.exports = router;