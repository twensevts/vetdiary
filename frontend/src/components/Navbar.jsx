import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (!token) return null; // Не показываем меню на странице логина

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)', padding: '0 30px', height: '70px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-color)' }}>🐾 Ветдневник</div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <Link to="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-color)', fontWeight: '500' }}>Мои питомцы</Link>
                    <Link to="/forum" style={{ textDecoration: 'none', color: 'var(--text-muted)' }}>Форум</Link>
                </div>
            </div>
            <button onClick={handleLogout} className="btn btn-outline">Выйти</button>
        </nav>
    );
}