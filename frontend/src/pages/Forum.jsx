import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CommentBox({ onSubmit }) {
    const [text, setText] = useState('');
    return (
        <div style={{ marginTop: 8 }}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                style={{ width: '100%' }}
                placeholder="Комментировать"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button type="button" className="btn btn-primary" onClick={() => { if (text.trim()) { onSubmit(text.trim(), () => setText('')); } }}>Отправить</button>
            </div>
        </div>
    );
}

export default function Forum() {
    const [posts, setPosts] = useState([]);
    const [pets, setPets] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createError, setCreateError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        pet_id: ''
    });

    const token = localStorage.getItem('token');

    const parseUserFromToken = () => {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return { id: payload.id, role: payload.role };
        } catch {
            return null;
        }
    };

    const currentUser = parseUserFromToken();

    const roleLabelMap = {
        owner: 'Владелец',
        vet: 'Ветеринар',
        admin: 'Администратор'
    };

    const fetchPosts = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/posts');
            setPosts(response.data);
            // preload comments for visible posts
            response.data.forEach(p => fetchComments(p.id));
        } catch (error) {
            console.error('Ошибка загрузки форума', error);
        }
    };

    const [commentsMap, setCommentsMap] = useState({});

    const fetchComments = async (postId) => {
        try {
            const resp = await axios.get(`http://localhost:5000/api/posts/${postId}/comments`);
            setCommentsMap(prev => ({ ...prev, [postId]: resp.data }));
        } catch (e) {
            console.error('Ошибка загрузки комментариев', e);
        }
    };

    const handleCreateComment = async (postId, content, resetCb) => {
        if (!token) return alert('Войдите, чтобы комментировать');
        try {
            const resp = await axios.post(`http://localhost:5000/api/posts/${postId}/comments`, { content }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommentsMap(prev => ({ ...prev, [postId]: [...(prev[postId] || []), resp.data] }));
            if (resetCb) resetCb();
        } catch (e) {
            console.error('Не удалось добавить комментарий', e);
            alert('Ошибка при добавлении комментария');
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (!token) return;
        if (!confirm('Удалить комментарий?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/posts/${postId}/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommentsMap(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(c => c.id !== commentId) }));
        } catch (e) {
            console.error('Ошибка удаления комментария', e);
            alert('Не удалось удалить комментарий');
        }
    };

    const fetchPets = async () => {
        if (!token) {
            setPets([]);
            return;
        }

        try {
            const response = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPets(response.data);
        } catch (error) {
            console.error('Ошибка загрузки питомцев для привязки поста', error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchPets();
    }, []);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        setCreateError('');
        setIsSubmitting(true);

        try {
            await axios.post('http://localhost:5000/api/posts', {
                title: formData.title,
                content: formData.content,
                pet_id: formData.pet_id || null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFormData({ title: '', content: '', pet_id: '' });
            setIsCreating(false);
            await fetchPosts();
        } catch (error) {
            setCreateError(error.response?.data?.message || 'Не удалось опубликовать вопрос');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canDeletePost = (post) => {
        if (!currentUser) return false;
        return currentUser.role === 'admin' || Number(post.author_id) === Number(currentUser.id);
    };

    const canDeleteComment = (comment) => {
        if (!currentUser) return false;
        return currentUser.role === 'admin' || Number(comment.author_id) === Number(currentUser.id);
    };

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const filteredPosts = posts.filter((post) => {
        if (!normalizedSearch) return true;
        const source = [
            post.title,
            post.content,
            post.username,
            post.pet_name,
            post.pet_species,
            post.role
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return source.includes(normalizedSearch);
    });

    const handleDeletePost = async (postId) => {
        if (!token) return;
        const confirmed = window.confirm('Удалить этот пост?');
        if (!confirmed) return;

        try {
            await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchPosts();
        } catch (error) {
            alert(error.response?.data?.message || 'Не удалось удалить пост');
        }
    };

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '12px', flexWrap: 'wrap' }}>
                <h2>Лента форума</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="form-control"
                        style={{ minWidth: '280px' }}
                        placeholder="Поиск по постам, авторам и питомцам"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-outline" type="button" onClick={() => setSearchQuery(searchInput)}>
                        Поиск
                    </button>
                    {token && (
                        <button className="btn btn-primary" onClick={() => setIsCreating(prev => !prev)}>
                            {isCreating ? 'Отменить' : 'Задать вопрос'}
                        </button>
                    )}
                </div>
            </div>

            {token && isCreating && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Новый вопрос</h3>

                    {createError && (
                        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                            {createError}
                        </div>
                    )}

                    <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Заголовок</label>
                            <input
                                type="text"
                                className="form-control"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Текст вопроса</label>
                            <textarea
                                className="form-control"
                                required
                                rows={4}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Привязать питомца (необязательно)</label>
                            <select
                                className="form-control"
                                value={formData.pet_id}
                                onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                            >
                                <option value="">Без привязки</option>
                                {pets.map((pet) => (
                                    <option key={pet.id} value={pet.id}>
                                        {pet.name} ({pet.species})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Публикация...' : 'Опубликовать'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {filteredPosts.map(post => (
                <div key={post.id} className="post-card">
                    <div className="post-header">
                        <div className="author-avatar">{post.username.charAt(0)}</div>
                        <div>
                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {post.username}
                                <span className={`role-badge role-${post.role || 'owner'}`}>
                                    {roleLabelMap[post.role] || post.role}
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>

                    {post.pet_name && (
                        <div className="pet-badge" style={{ marginBottom: '15px' }}>
                            🐾 Питомец: {post.pet_name} ({post.pet_species})
                        </div>
                    )}

                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-content">{post.content}</div>

                    {canDeletePost(post) && (
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleDeletePost(post.id)}
                        >
                            Удалить пост
                        </button>
                    )}

                    <div style={{ marginTop: '12px' }}>
                        <h4 style={{ marginBottom: '8px' }}>Комментарии</h4>
                        {(commentsMap[post.id] || []).map(c => (
                            <div key={c.id} style={{ padding: '8px 0', borderTop: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div><strong>{c.username}</strong> <span className="muted">{new Date(c.created_at).toLocaleString()}</span></div>
                                    {canDeleteComment(c) && <button className="btn btn-outline" onClick={() => handleDeleteComment(post.id, c.id)}>Удалить</button>}
                                </div>
                                <div style={{ marginTop: '6px' }}>{c.content}</div>
                            </div>
                        ))}

                        {token && (
                            <CommentBox onSubmit={(text, reset) => handleCreateComment(post.id, text, reset)} />
                        )}
                    </div>
                </div>
            ))}
            {filteredPosts.length === 0 && <p>{posts.length === 0 ? 'Форум пока пуст.' : 'По вашему запросу ничего не найдено.'}</p>}
        </div>
    );
}