import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import PetDetailModal from '../components/PetDetailModal';

const eventLabelMap = {
    feeding: 'Кормление',
    vaccination: 'Вакцинация'
};

const getDateKey = (dateValue) => {
    if (!dateValue) return '';

    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        return dateValue.slice(0, 10);
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseDateOnly = (dateValue) => {
    const dateKey = getDateKey(dateValue);
    if (!dateKey) return null;

    return new Date(`${dateKey}T00:00:00`);
};

export default function Dashboard() {
    const [pets, setPets] = useState([]);
    const [careEvents, setCareEvents] = useState([]);
    const [error, setError] = useState('');
    const [selectedPet, setSelectedPet] = useState(null);

    const token = localStorage.getItem('token');

    const fetchDashboardData = async () => {
        if (!token) {
            setPets([]);
            setCareEvents([]);
            setError('');
            return;
        }

        try {
            setError('');

            const petsResponse = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const ownedPets = petsResponse.data;
            setPets(ownedPets);

            const eventsByPet = await Promise.all(
                ownedPets.map(async (pet) => {
                    try {
                        const response = await axios.get(`http://localhost:5000/api/care-events/${pet.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        return response.data.map((event) => ({
                            ...event,
                            pet_name: pet.name,
                            pet_species: pet.species
                        }));
                    } catch (requestError) {
                        console.error(`Ошибка загрузки событий для питомца ${pet.id}`, requestError);
                        return [];
                    }
                })
            );

            setCareEvents(eventsByPet.flat());
        } catch (requestError) {
            console.error('Ошибка загрузки главной страницы', requestError);
            setError('Не удалось загрузить данные главной страницы.');
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [token]);

    const getEmoji = (species) => {
        const normalized = (species || '').toLowerCase();
        if (normalized.includes('кош') || normalized.includes('cat')) return '🐱';
        return '🐶';
    };

    const todayKey = getDateKey(new Date());

    const feedingToday = useMemo(() => (
        careEvents.filter((event) => event.event_type === 'feeding' && getDateKey(event.event_date) === todayKey).length
    ), [careEvents, todayKey]);

    const upcomingVaccinations = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const limitDate = new Date(startOfToday);
        limitDate.setDate(limitDate.getDate() + 30);

        return careEvents.filter((event) => {
            if (event.event_type !== 'vaccination') return false;

            const eventDate = parseDateOnly(event.event_date);
            if (!eventDate) return false;

            return eventDate >= startOfToday && eventDate <= limitDate;
        }).length;
    }, [careEvents, todayKey]);

    const recentFeedings = useMemo(() => (
        careEvents
            .filter((event) => event.event_type === 'feeding')
            .sort((left, right) => new Date(right.event_date || right.created_at) - new Date(left.event_date || left.created_at))
            .slice(0, 3)
    ), [careEvents]);

    const recentVaccinations = useMemo(() => (
        careEvents
            .filter((event) => event.event_type === 'vaccination')
            .sort((left, right) => new Date(right.event_date || right.created_at) - new Date(left.event_date || left.created_at))
            .slice(0, 3)
    ), [careEvents]);

    // Напоминания на ближайшие 7 дней
    const upcomingReminders = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);

        return careEvents
            .filter((event) => {
                const eventDate = parseDateOnly(event.event_date);
                if (!eventDate) return false;
                return eventDate >= today && eventDate <= in7Days;
            })
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }, [careEvents]);

    const recentPets = pets;

    if (!token) {
        return (
            <div className="page-container">
                <div className="card">
                    <h2 style={{ marginBottom: '12px' }}>Главная доступна после входа</h2>
                    <p className="muted">Авторизуйтесь, чтобы увидеть питомцев, кормления и вакцинации.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {error && (
                <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-info">
                        <h3>Всего питомцев</h3>
                        <div className="stat-value">{pets.length}</div>
                        <p className="stat-desc">Под вашим наблюдением</p>
                    </div>
                    <div className="stat-icon">🐾</div>
                </div>

                <div className="card stat-card">
                    <div className="stat-info">
                        <h3>Кормления сегодня</h3>
                        <div className="stat-value">{feedingToday}</div>
                        <p className="stat-desc">Записей на текущую дату</p>
                    </div>
                    <div className="stat-icon">🍽️</div>
                </div>

                <div className="card stat-card">
                    <div className="stat-info">
                        <h3>Вакцинации на месяц</h3>
                        <div className="stat-value">{upcomingVaccinations}</div>
                        <p className="stat-desc">План на ближайшие 30 дней</p>
                    </div>
                    <div className="stat-icon">💉</div>
                </div>
            </div>

            {/* Блок напоминаний */}
            {upcomingReminders.length > 0 && (
                <div className="card" style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}>
                    <div className="card-header" style={{ color: '#92400E', marginBottom: '8px' }}>
                        🔔 Напоминания на ближайшие 7 дней
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {upcomingReminders.map((event) => (
                            <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '8px' }}>
                                <div>
                                    <strong>{event.pet_name}</strong>
                                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
                                        {eventLabelMap[event.event_type] || event.event_type}
                                    </span>
                                </div>
                                <div style={{ color: '#92400E', fontWeight: '500' }}>
                                    {new Date(event.event_date).toLocaleDateString('ru-RU')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="widgets-grid">
                <div className="card">
                    <div className="card-header" style={{ marginBottom: '12px' }}>
                        Последние кормления
                    </div>

                    {recentFeedings.length === 0 && <p className="muted">Пока нет записей кормления.</p>}

                    <div className="feeding-list">
                        {recentFeedings.map((event) => (
                            <div key={event.id} className="feeding-item bg-green-light">
                                <div className="feeding-info">
                                    <div className="dot dot-green" />
                                    <div className="feeding-text">
                                        <h4>{event.pet_name}</h4>
                                        <p>{event.description || eventLabelMap[event.event_type]}</p>
                                    </div>
                                </div>
                                <div className="feeding-time">
                                    {event.event_date ? new Date(event.event_date).toLocaleDateString('ru-RU') : 'Без даты'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header" style={{ marginBottom: '12px' }}>
                        Ближайшие вакцинации
                    </div>

                    {recentVaccinations.length === 0 && <p className="muted">Пока нет запланированных вакцинаций.</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentVaccinations.map((event) => (
                            <div
                                key={event.id}
                                className="pet-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedPet(pets.find((pet) => String(pet.id) === String(event.pet_id)) || null)}
                            >
                                <div className="pet-avatar">💉</div>
                                <div>
                                    <h4>{event.pet_name}</h4>
                                    <p className="muted">{event.description || 'Вакцинация'}</p>
                                </div>
                                <div className="muted">
                                    {event.event_date ? new Date(event.event_date).toLocaleDateString('ru-RU') : 'Без даты'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header" style={{ marginBottom: '12px' }}>
                    Мои питомцы
                </div>

                {recentPets.length === 0 && (
                    <p className="muted">Добавьте питомца, чтобы увидеть краткую статистику.</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recentPets.map((pet) => (
                        <div key={pet.id} className="pet-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedPet(pet)}>
                            <div className="pet-avatar">{getEmoji(pet.species)}</div>
                            <div>
                                <h4>{pet.name}</h4>
                                <p className="muted">{pet.species}{pet.breed ? `, ${pet.breed}` : ''}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <PetDetailModal
                pet={selectedPet}
                onClose={() => setSelectedPet(null)}
            />
        </div>
    );
}
