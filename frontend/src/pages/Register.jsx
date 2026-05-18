import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'owner'
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await axios.post('http://localhost:5000/api/auth/register', formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при регистрации');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '460px', margin: '60px auto', padding: '30px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Регистрация</h2>

            {error && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Имя пользователя</label>
                    <input
                        type="text"
                        required
                        className="form-control"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                    <input
                        type="email"
                        required
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Пароль</label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Роль</label>
                    <select
                        className="form-control"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="owner">Владелец</option>
                        <option value="vet">Ветеринар</option>
                        <option value="admin">Администратор</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                    {isSubmitting ? 'Создание...' : 'Создать аккаунт'}
                </button>
            </form>

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Уже есть аккаунт? <Link to="/" style={{ color: 'var(--primary-color)' }}>Войти</Link>
            </p>
        </div>
    );
}
