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
    const [vetDocument, setVetDocument] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            // Регистрация пользователя
            const regResponse = await axios.post('http://localhost:5000/api/auth/register', formData);
            const userId = regResponse.data.user?.id;

            // Если ветеринар и есть документ — загружаем
            if (formData.role === 'vet' && vetDocument && userId) {
                const docForm = new FormData();
                docForm.append('document', vetDocument);
                docForm.append('userId', userId);

                await axios.post('http://localhost:5000/api/auth/vet-document', docForm, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (formData.role === 'vet') {
                setSuccess('Аккаунт ветеринара создан. Ожидайте подтверждения администратором.');
            } else {
                navigate('/');
            }
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

            {success && (
                <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                    {success}
                    <div style={{ marginTop: '8px' }}>
                        <Link to="/" style={{ color: '#065F46', fontWeight: '600' }}>Перейти на страницу входа</Link>
                    </div>
                </div>
            )}

            {!success && (
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
                            <option value="owner">Владелец животного</option>
                            <option value="vet">Ветеринар</option>
                        </select>
                    </div>

                    {formData.role === 'vet' && (
                        <div style={{ background: '#DBEAFE', padding: '14px', borderRadius: '8px', marginTop: '4px' }}>
                            <p style={{ fontSize: '13px', color: '#1E40AF', marginBottom: '10px' }}>
                                Для подтверждения статуса ветеринара загрузите документ (диплом, сертификат или лицензию). Администратор проверит его перед активацией аккаунта.
                            </p>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#1E40AF' }}>
                                Подтверждающий документ
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setVetDocument(e.target.files[0] || null)}
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                        {isSubmitting ? 'Создание...' : 'Создать аккаунт'}
                    </button>
                </form>
            )}

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Уже есть аккаунт? <Link to="/" style={{ color: 'var(--primary-color)' }}>Войти</Link>
            </p>
        </div>
    );
}
