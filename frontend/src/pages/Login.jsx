import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loginMode, setLoginMode] = useState('owner'); // 'owner' or 'vet'
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при входе');
        }
    };

    return (
        <div className="card login-card" style={{ maxWidth: '480px', margin: '60px auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '18px' }}>Вход в систему</h2>

            {/* Role switch */}
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.04)', marginBottom: 18 }}>
                <button
                    type="button"
                    onClick={() => setLoginMode('owner')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                        background: loginMode === 'owner' ? 'linear-gradient(90deg,var(--primary-500),var(--primary-600))' : 'transparent',
                        color: loginMode === 'owner' ? '#fff' : 'var(--muted-700)'
                    }}
                >
                    Владелец
                </button>
                <button
                    type="button"
                    onClick={() => setLoginMode('vet')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14,
                        background: loginMode === 'vet' ? 'linear-gradient(90deg,#60a5fa,#3b82f6)' : 'transparent',
                        color: loginMode === 'vet' ? '#fff' : 'var(--muted-700)'
                    }}
                >
                    Ветеринар
                </button>
            </div>

            {loginMode === 'vet' && (
                <div className="alert alert-info" style={{ marginBottom: 14, background: 'linear-gradient(180deg,#EFF6FF,#DBEAFE)', color: '#1E40AF', padding: '10px 12px', borderRadius: 8 }}>
                    Для входа как ветеринар ваш аккаунт должен быть подтверждён администратором. Если вы ещё не зарегистрированы — <Link to="/register" style={{ color: '#1E40AF', fontWeight: 600 }}>создайте аккаунт</Link> с ролью "Ветеринар" и загрузите документ.
                </div>
            )}

            {error && (
                <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-control"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-control"
                        placeholder="••••••••"
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 6, padding: '12px' }}>
                    Войти
                </button>
            </form>

            <p style={{ marginTop: 14, textAlign: 'center', fontSize: 14, color: 'var(--muted-500)' }}>
                Нет аккаунта? <Link to="/register" style={{ color: 'var(--primary-600)' }}>Зарегистрироваться</Link>
            </p>
            <p style={{ marginTop: 8, textAlign: 'center', fontSize: 14, color: 'var(--muted-500)' }}>
                <Link to="/forum" style={{ color: 'var(--primary-600)' }}>Перейти на форум без входа</Link>
            </p>
        </div>
    );
}
