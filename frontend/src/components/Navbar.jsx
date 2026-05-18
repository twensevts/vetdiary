import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (!token) return null;

    const navStyle = ({ isActive }) => ({
        textDecoration: 'none',
        color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
        fontWeight: isActive ? 600 : 500,
        background: isActive ? '#E6F7F6' : 'transparent',
        padding: '8px 14px',
        borderRadius: '6px'
    });

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)', padding: '0 30px', height: '70px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-color)' }}>🐾 Ветдневник</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <NavLink to="/dashboard" style={navStyle}>Главная</NavLink>
                    <NavLink to="/pets" style={navStyle}>Питомцы</NavLink>
                    <NavLink to="/forum" style={navStyle}>Форум</NavLink>
                    <NavLink to="/care" style={navStyle}>Уход</NavLink>
                </div>
            </div>
            <button onClick={handleLogout} className="btn btn-outline">Выйти</button>
        </nav>
    );
}