import React, { useEffect, useState } from 'react';
import axios from 'axios';

const roleLabelMap = { owner: 'Владелец', vet: 'Ветеринар', admin: 'Администратор' };
const vetStatusMap = { pending: 'Ожидает', approved: 'Одобрен', rejected: 'Отклонён' };

export default function Admin() {
    const [tab, setTab] = useState('vet-requests');
    const [vetRequests, setVetRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const fetchVetRequests = async () => {
        try {
            const resp = await axios.get('http://localhost:5000/api/admin/vet-requests', { headers });
            setVetRequests(resp.data);
        } catch (e) {
            setError('Не удалось загрузить заявки ветеринаров');
        }
    };

    const fetchUsers = async () => {
        try {
            const resp = await axios.get('http://localhost:5000/api/admin/users', { headers });
            setUsers(resp.data);
        } catch (e) {
            setError('Не удалось загрузить пользователей');
        }
    };

    useEffect(() => {
        if (tab === 'vet-requests') fetchVetRequests();
        if (tab === 'users') fetchUsers();
    }, [tab]);

    const handleApprove = async (userId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/vet-approve/${userId}`, {}, { headers });
            setSuccess('Ветеринар одобрен');
            fetchVetRequests();
        } catch (e) {
            setError('Ошибка при одобрении');
        }
    };

    const handleReject = async (userId) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/vet-reject/${userId}`, {}, { headers });
            setSuccess('Ветеринар отклонён');
            fetchVetRequests();
        } catch (e) {
            setError('Ошибка при отклонении');
        }
    };

    const handleToggleActive = async (userId) => {
        try {
            const resp = await axios.put(`http://localhost:5000/api/admin/user-toggle/${userId}`, {}, { headers });
            setSuccess(resp.data.message);
            fetchUsers();
        } catch (e) {
            setError('Ошибка при изменении статуса');
        }
    };

    const handleDownloadDoc = async (userId, username) => {
        try {
            const resp = await axios.get(`http://localhost:5000/api/admin/vet-document/${userId}`, { headers });
            const { document_name, document_data } = resp.data;
            const link = document.createElement('a');
            link.href = `data:application/octet-stream;base64,${document_data}`;
            link.download = document_name;
            link.click();
        } catch (e) {
            alert('Документ не найден');
        }
    };

    const tabStyle = (active) => ({
        padding: '10px 20px',
        border: 'none',
        borderBottom: active ? '3px solid var(--primary-color)' : '3px solid transparent',
        background: 'transparent',
        cursor: 'pointer',
        fontWeight: active ? '600' : '400',
        color: active ? 'var(--primary-color)' : 'var(--text-muted)',
        fontSize: '14px'
    });

    return (
        <div className="page-container">
            <h2 style={{ marginBottom: '16px' }}>Панель администратора</h2>

            {error && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>x</button>
                </div>
            )}
            {success && (
                <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                    {success}
                    <button onClick={() => setSuccess('')} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>x</button>
                </div>
            )}

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                <button style={tabStyle(tab === 'vet-requests')} onClick={() => setTab('vet-requests')}>
                    Заявки ветеринаров
                </button>
                <button style={tabStyle(tab === 'users')} onClick={() => setTab('users')}>
                    Пользователи
                </button>
            </div>

            {tab === 'vet-requests' && (
                <div className="card">
                    <div className="card-header">Заявки на подтверждение ветеринаров</div>
                    {vetRequests.length === 0 && <p className="muted">Нет ожидающих заявок.</p>}
                    {vetRequests.map((req) => (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '10px' }}>
                            <div>
                                <strong>{req.username}</strong>
                                <div className="muted" style={{ fontSize: '13px' }}>{req.email}</div>
                                {req.document_name && (
                                    <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '4px' }}>
                                        Документ: {req.document_name}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {req.document_name && (
                                    <button className="btn btn-outline" onClick={() => handleDownloadDoc(req.id, req.username)}>
                                        Скачать документ
                                    </button>
                                )}
                                <button className="btn btn-primary" onClick={() => handleApprove(req.id)}>
                                    Одобрить
                                </button>
                                <button className="btn btn-outline" style={{ color: '#DC2626', borderColor: '#DC2626' }} onClick={() => handleReject(req.id)}>
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'users' && (
                <div className="card">
                    <div className="card-header">Все пользователи</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Имя</th>
                                    <th style={{ padding: '8px' }}>Email</th>
                                    <th style={{ padding: '8px' }}>Роль</th>
                                    <th style={{ padding: '8px' }}>Статус</th>
                                    <th style={{ padding: '8px' }}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '8px' }}>{u.username}</td>
                                        <td style={{ padding: '8px' }}>{u.email}</td>
                                        <td style={{ padding: '8px' }}>
                                            <span className={`role-badge role-${u.role}`}>{roleLabelMap[u.role] || u.role}</span>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            {u.role === 'vet' && u.vet_status && (
                                                <span style={{ fontSize: '12px', color: u.vet_status === 'approved' ? '#059669' : u.vet_status === 'rejected' ? '#DC2626' : '#D97706' }}>
                                                    {vetStatusMap[u.vet_status]}
                                                </span>
                                            )}
                                            {!u.is_active && <span style={{ fontSize: '12px', color: '#DC2626', marginLeft: '6px' }}>Заблокирован</span>}
                                            {u.is_active && u.role !== 'vet' && <span style={{ fontSize: '12px', color: '#059669' }}>Активен</span>}
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <button
                                                className="btn btn-outline"
                                                style={{ fontSize: '12px', padding: '4px 10px' }}
                                                onClick={() => handleToggleActive(u.id)}
                                            >
                                                {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
