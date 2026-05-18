import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');

    const fetchProfile = async () => {
        try {
            const resp = await axios.get('http://localhost:5000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(resp.data);
            setFormData(prev => ({ ...prev, username: resp.data.username, email: resp.data.email }));
        } catch (e) {
            setError('Не удалось загрузить профиль');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError('Новый пароль и подтверждение не совпадают');
            return;
        }

        try {
            const payload = {
                username: formData.username,
                email: formData.email,
            };
            if (formData.newPassword) {
                payload.currentPassword = formData.currentPassword;
                payload.newPassword = formData.newPassword;
            }

            const resp = await axios.put('http://localhost:5000/api/auth/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Профиль успешно обновлён');
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            setProfile(prev => ({ ...prev, username: resp.data.username, email: resp.data.email }));
        } catch (e) {
            setError(e.response?.data?.message || 'Ошибка при обновлении профиля');
        }
    };

    if (loading) return <div className="page-container"><p>Загрузка...</p></div>;

    return (
        <div className="page-container">
            <div className="card" style={{ maxWidth: '980px', width: '100%', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '28px', fontWeight: 700 }}>Мой профиль</h2>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Имя пользователя</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
                    <p style={{ fontSize: '28px', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1.1, margin: '4px 0 0' }}>Смена пароля</p>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Текущий пароль</label>
                        <input
                            type="password"
                            className="form-control"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Новый пароль</label>
                        <input
                            type="password"
                            className="form-control"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Подтвердите новый пароль</label>
                        <input
                            type="password"
                            className="form-control"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                        Сохранить изменения
                    </button>
                </form>
            </div>
        </div>
    );
}
