import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
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
        <div className="card" style={{ maxWidth: '400px', margin: '80px auto', padding: '30px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Вход в систему</h2>

            {error && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
                    Войти
                </button>
            </form>

            <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                Нет аккаунта? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Зарегистрироваться</Link>
            </p>
        </div>
    );
}