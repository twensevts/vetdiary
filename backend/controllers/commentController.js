const db = require('../config/db');

let commentTableCache = null;

const detectCommentTable = async () => {
    if (commentTableCache) return commentTableCache;

    const postCommentTable = await db.query(`SELECT to_regclass('public.postcomment') AS table_name`);
    if (postCommentTable.rows[0].table_name) {
        commentTableCache = 'postcomment';
        return commentTableCache;
    }

    const commentTable = await db.query(`SELECT to_regclass('public.comment') AS table_name`);
    if (commentTable.rows[0].table_name) {
        commentTableCache = 'comment';
        return commentTableCache;
    }

    commentTableCache = 'postcomment';
    return commentTableCache;
};

class CommentController {
    async createComment(req, res) {
        try {
            const { postId } = req.params;
            const { content } = req.body;
            const author_id = req.user.id;
            const commentTable = await detectCommentTable();

            if (!content) return res.status(400).json({ message: 'Текст комментария обязателен' });

            // ensure post exists
            const post = await db.query('SELECT id FROM Post WHERE id = $1', [postId]);
            if (post.rowCount === 0) return res.status(404).json({ message: 'Пост не найден' });

            const newComment = await db.query(
                `WITH inserted AS (
                    INSERT INTO ${commentTable} (post_id, author_id, content)
                    VALUES ($1, $2, $3)
                    RETURNING id, post_id, author_id, content, created_at
                )
                SELECT inserted.*, u.username
                FROM inserted
                JOIN "User" u ON inserted.author_id = u.id`,
                [postId, author_id, content]
            );

            res.status(201).json(newComment.rows[0]);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при добавлении комментария' });
        }
    }

    async getComments(req, res) {
        try {
            const { postId } = req.params;
            const commentTable = await detectCommentTable();
            const comments = await db.query(
                `SELECT c.*, u.username FROM ${commentTable} c JOIN "User" u ON c.author_id = u.id WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
                [postId]
            );
            res.json(comments.rows);
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при получении комментариев' });
        }
    }

    async deleteComment(req, res) {
        try {
            const { postId, commentId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;
            const commentTable = await detectCommentTable();

            const comment = await db.query(`SELECT id, author_id FROM ${commentTable} WHERE id = $1 AND post_id = $2`, [commentId, postId]);
            if (comment.rowCount === 0) return res.status(404).json({ message: 'Комментарий не найден' });

            const isAuthor = Number(comment.rows[0].author_id) === Number(userId);
            const isAdmin = userRole === 'admin';

            if (!isAuthor && !isAdmin) return res.status(403).json({ message: 'Недостаточно прав' });

            await db.query(`DELETE FROM ${commentTable} WHERE id = $1`, [commentId]);
            res.json({ message: 'Комментарий удален' });
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Ошибка при удалении комментария' });
        }
    }
}

module.exports = new CommentController();
