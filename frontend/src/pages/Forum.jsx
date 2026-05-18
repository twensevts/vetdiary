import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PetDetailModal from '../components/PetDetailModal';

function CommentBox({ onSubmit }) {
    const [text, setText] = useState('');
    return (
        <div className="comment-box">
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="form-control"
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
    const [selectedPetFromPost, setSelectedPetFromPost] = useState(null);
    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState('');
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
            setCommentsMap({});
            await Promise.allSettled(response.data.map((post) => fetchComments(post.id)));
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

    const handleCreateComment = async (postId, content, resetCb, parentId = null) => {
        if (!token) return alert('Войдите, чтобы комментировать');
        try {
            const payload = parentId ? { content, parent_id: parentId } : { content };
            await axios.post(`http://localhost:5000/api/posts/${postId}/comments`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchComments(postId);
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
        // Фильтр по типу животного
        if (speciesFilter) {
            const petSpecies = (post.pet_species || '').toLowerCase();
            if (!petSpecies.includes(speciesFilter.toLowerCase())) return false;
        }

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
            <div className="page-header">
                <h2>Лента форума</h2>
                <div className="search-controls">
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Поиск по постам, авторам и питомцам"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <select
                        className="form-control search-select"
                        value={speciesFilter}
                        onChange={(e) => setSpeciesFilter(e.target.value)}
                    >
                        <option value="">Все животные</option>
                        <option value="собак">Собаки</option>
                        <option value="кош">Кошки</option>
                        <option value="друг">Другое</option>
                    </select>
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
                        <div 
                            className="pet-badge" 
                            style={{ marginBottom: '15px', cursor: 'pointer' }}
                            onClick={() => {
                                const petData = {
                                    id: post.pet_id,
                                    name: post.pet_name,
                                    pet_name: post.pet_name,
                                    species: post.pet_species,
                                    pet_species: post.pet_species,
                                    breed: post.pet_breed,
                                    pet_breed: post.pet_breed,
                                    birth_date: post.pet_birth_date,
                                    pet_birth_date: post.pet_birth_date,
                                    weight: post.pet_weight,
                                    pet_weight: post.pet_weight,
                                    health_notes: post.pet_health_notes,
                                    pet_health_notes: post.pet_health_notes,
                                    photo_url: post.pet_photo_url,
                                    pet_photo_url: post.pet_photo_url,
                                    owner_id: post.pet_owner_id,
                                    pet_owner_id: post.pet_owner_id
                                };
                                setSelectedPetFromPost(petData);
                            }}
                        >
                            🐾 Питомец: {post.pet_name} ({post.pet_species})
                        </div>
                    )}

                    <div
                        onClick={() => setOpenCommentsPostId(prev => prev === post.id ? null : post.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <h3 className="post-title">{post.title}</h3>
                        <div className="post-content">{post.content}</div>
                    </div>

                    {canDeletePost(post) && (
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleDeletePost(post.id)}
                        >
                            Удалить пост
                        </button>
                    )}

                    {openCommentsPostId === post.id && (
                    <div style={{ marginTop: '12px' }}>
                        <h4 style={{ marginBottom: '8px' }}>Комментарии</h4>
                        {(() => {
                            const flat = commentsMap[post.id] || [];
                            const MAX_DEPTH = 3;
                            const buildTree = (list) => {
                                const map = {};
                                list.forEach(item => { map[item.id] = { ...item, children: [] }; });
                                const roots = [];
                                list.forEach(item => {
                                    if (item.parent_id) {
                                        if (map[item.parent_id]) map[item.parent_id].children.push(map[item.id]);
                                        else roots.push(map[item.id]);
                                    } else {
                                        roots.push(map[item.id]);
                                    }
                                });
                                return roots;
                            };

                            const CommentItem = ({ c, depth = 0, onReplyClick = null }) => {
                                const [showReply, setShowReply] = useState(false);
                                const [expanded, setExpanded] = useState(true);
                                const replyCount = c.children ? c.children.length : 0;
                                const isNested = depth > 0;
                                const canNestDeeper = depth < MAX_DEPTH;

                                return (
                                    <div key={c.id} className={`comment-thread-item ${isNested ? 'comment-thread-item--nested' : ''}`}>
                                        <div className="comment-author-row">
                                            <div>
                                                <span className="comment-author-info">{c.username}</span>
                                                <span className="comment-timestamp"> {new Date(c.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="comment-actions">
                                                {token && canNestDeeper && <button className="comment-replies-toggle" onClick={() => setShowReply(s => !s)}>{showReply ? '✕' : '↳'} Ответить</button>}
                                                {canDeleteComment(c) && <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => handleDeleteComment(post.id, c.id)}>Удалить</button>}
                                            </div>
                                        </div>
                                        <div className="comment-content">{c.content}</div>
                                        {showReply && token && canNestDeeper && (
                                            <div style={{ marginTop: 8, marginBottom: 8 }}>
                                                <CommentBox onSubmit={(text, reset) => {
                                                    handleCreateComment(post.id, text, () => { reset(); setShowReply(false); }, c.id);
                                                }} />
                                            </div>
                                        )}
                                        {replyCount > 0 && (
                                            <button className="comment-replies-toggle" onClick={() => setExpanded(s => !s)} style={{ marginTop: 6 }}>
                                                {expanded ? '▼' : '▶'} {replyCount} {replyCount === 1 ? 'ответ' : 'ответов'}
                                            </button>
                                        )}
                                        {expanded && c.children && (
                                            <div className="comment-thread">
                                                {c.children.map(child => (
                                                    <CommentItem key={child.id} c={child} depth={depth + 1} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            };

                            const roots = buildTree(flat);
                            return (
                                <div className="comment-thread">
                                    {roots.map(r => <CommentItem key={r.id} c={r} depth={0} />)}
                                    {token && (
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
                                            <CommentBox onSubmit={(text, reset) => handleCreateComment(post.id, text, reset)} />
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    )}
                </div>
            ))}
            {filteredPosts.length === 0 && <p>{posts.length === 0 ? 'Форум пока пуст.' : 'По вашему запросу ничего не найдено.'}</p>}

            <PetDetailModal 
                pet={selectedPetFromPost} 
                onClose={() => setSelectedPetFromPost(null)} 
            />
        </div>
    );
}