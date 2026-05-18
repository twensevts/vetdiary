import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const eventLabelMap = {
    feeding: 'Кормление',
    vaccination: 'Вакцинация'
};

const eventColors = {
    feeding: 'bg-green-light',
    vaccination: 'bg-orange-light'
};

const formatDate = (dateValue) => {
    if (!dateValue) return 'Без даты';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Без даты';
    return date.toLocaleDateString('ru-RU');
};

export default function Care() {
    const [pets, setPets] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        event_type: 'feeding',
        event_date: '',
        description: ''
    });

    const token = localStorage.getItem('token');

    const selectedPet = useMemo(
        () => pets.find((pet) => String(pet.id) === String(selectedPetId)),
        [pets, selectedPetId]
    );

    const feedingEvents = useMemo(
        () => events.filter((event) => event.event_type === 'feeding'),
        [events]
    );

    const vaccinationEvents = useMemo(
        () => events.filter((event) => event.event_type === 'vaccination'),
        [events]
    );

    const fetchPets = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPets(response.data);
            if (response.data.length > 0) {
                setSelectedPetId(String(response.data[0].id));
            }
        } catch (fetchError) {
            setError('Не удалось загрузить питомцев.');
        }
    };

    const fetchEvents = async (petId) => {
        if (!petId) {
            setEvents([]);
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/care-events/${petId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(response.data);
        } catch {
            setError('Не удалось загрузить события ухода.');
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchPets();
    }, []);

    useEffect(() => {
        if (!selectedPetId) return;
        fetchEvents(selectedPetId);
    }, [selectedPetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedPetId) {
            setError('Сначала выберите питомца.');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/care-events', {
                pet_id: Number(selectedPetId),
                event_type: formData.event_type,
                event_date: formData.event_date,
                description: formData.description || null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFormData({ event_type: 'feeding', event_date: '', description: '' });
            await fetchEvents(selectedPetId);
        } catch (submitError) {
            setError(submitError.response?.data?.message || 'Не удалось добавить событие ухода.');
        }
    };

    return (
        <div className="page-container">
            <div className="card">
                <div className="card-header" style={{ marginBottom: '12px' }}>
                    <h2 className="page-title" style={{ marginBottom: 0 }}>Уход за питомцами</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Питомец</label>
                        <select
                            className="form-control"
                            value={selectedPetId}
                            onChange={(e) => setSelectedPetId(e.target.value)}
                        >
                            {pets.length === 0 && <option value="">Нет питомцев</option>}
                            {pets.map((pet) => (
                                <option key={pet.id} value={pet.id}>
                                    {pet.name} ({pet.species})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 className="section-title" style={{ marginBottom: '16px' }}>Добавить событие ухода</h3>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="care-form-grid">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Тип события</label>
                        <select
                            className="form-control"
                            value={formData.event_type}
                            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                        >
                            <option value="feeding">Кормление</option>
                            <option value="vaccination">Вакцинация</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Дата</label>
                        <input
                            type="date"
                            className="form-control"
                            required
                            value={formData.event_date}
                            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Описание</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Например: корм: гипоаллергенный"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary">Добавить</button>
                </form>
            </div>

            <div className="care-grid">
                <div className="card">
                    <h2 className="card-title" style={{ marginBottom: '12px' }}>График кормлений</h2>
                    {feedingEvents.length === 0 && <p className="muted">Пока нет событий кормления.</p>}
                    {feedingEvents.map((event) => (
                        <div key={event.id} className={`care-row ${eventColors[event.event_type] || ''}`}>
                            <div>
                                <div className="item-title">{selectedPet?.name || 'Питомец'} — {eventLabelMap[event.event_type] || event.event_type}</div>
                                <div className="muted">{event.description}</div>
                            </div>
                            <div className="muted">{formatDate(event.event_date)}</div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <h2 className="card-title" style={{ marginBottom: '12px' }}>Вакцинации</h2>
                    {vaccinationEvents.length === 0 && <p className="muted">Пока нет событий вакцинации.</p>}
                    {vaccinationEvents.map((event) => (
                        <div key={event.id} className={`care-row ${eventColors[event.event_type] || ''}`}>
                            <div>
                                <div className="item-title">{selectedPet?.name || 'Питомец'} — {eventLabelMap[event.event_type] || event.event_type}</div>
                                <div className="muted">{event.description}</div>
                            </div>
                            <div className="muted">{formatDate(event.event_date)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Простой календарь на 14 дней */}
            <div className="card" style={{ marginTop: '20px' }}>
                <h3 className="section-title" style={{ marginBottom: '16px' }}>Календарь на 14 дней</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                    {Array.from({ length: 14 }).map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        const dateKey = date.toISOString().slice(0, 10);
                        const dayEvents = events.filter(e => getDateKey(e.event_date) === dateKey);
                        
                        return (
                            <div key={i} style={{ 
                                padding: '8px', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px',
                                background: dayEvents.length > 0 ? '#E0F2F1' : '#f9fafb',
                                textAlign: 'center',
                                fontSize: '13px'
                            }}>
                                <div style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                                    {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                </div>
                                {dayEvents.length > 0 ? (
                                    <div style={{ marginTop: '4px', fontSize: '11px' }}>
                                        {dayEvents.length} {dayEvents.length === 1 ? 'событие' : 'событий'}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '4px', color: '#9CA3AF', fontSize: '11px' }}>—</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function getDateKey(dateValue) {
    if (!dateValue) return '';
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        return dateValue.slice(0, 10);
    }
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}
