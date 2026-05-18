import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Парсим роль из токена
    let userRole = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role;
        } catch {}
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <nav className="navbar-glass container" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>🐾 <span style={{ color: 'var(--primary-600)' }}>Ветдневник</span></div>
                <div className="nav-links">
                    {token && <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive? 'active':''}`}>Главная</NavLink>}
                    {token && <NavLink to="/pets" className={({isActive}) => `nav-link ${isActive? 'active':''}`}>Питомцы</NavLink>}
                    <NavLink to="/forum" className={({isActive}) => `nav-link ${isActive? 'active':''}`}>Форум</NavLink>
                    {token && <NavLink to="/care" className={({isActive}) => `nav-link ${isActive? 'active':''}`}>Уход</NavLink>}
                    {token && <NavLink to="/profile" className={({isActive}) => `nav-link ${isActive? 'active':''}`}>Профиль</NavLink>}
                    {token && userRole === 'admin' && <NavLink to="/admin" className={({isActive}) => `nav-link ${isActive? 'active':''}`}>Админ</NavLink>}
                </div>
            </div>
            <div>
                {token ? (
                    <button onClick={handleLogout} className="btn btn-outline">Выйти</button>
                ) : (
                    <button onClick={() => navigate('/')} className="btn btn-primary">Войти</button>
                )}
            </div>
        </nav>
    );
}
