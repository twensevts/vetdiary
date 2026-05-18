import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Forum() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/posts');
                setPosts(response.data);
            } catch (error) {
                console.error("Ошибка загрузки форума", error);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="page-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h2>Лента форума</h2>
                <button className="btn btn-primary">Задать вопрос</button>
            </div>

            {posts.map(post => (
                <div key={post.id} className="post-card">
                    <div className="post-header">
                        <div className="author-avatar">{post.username.charAt(0)}</div>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{post.username} <span style={{ fontSize: '12px', color: 'gray' }}>({post.role})</span></div>
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
                </div>
            ))}
            {posts.length === 0 && <p>Форум пока пуст.</p>}
        </div>
    );
}