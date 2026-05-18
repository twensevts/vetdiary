import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PetDetailModal from '../components/PetDetailModal';

export default function Dashboard() {
    const [pets, setPets] = useState([]);
    const [selectedPet, setSelectedPet] = useState(null);

    const fetchPets = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPets(response.data);
        } catch (error) {
            console.error('Ошибка загрузки питомцев', error);
        }
    };

    useEffect(() => {
        fetchPets();
    }, []);

    const getEmoji = (species) => {
        const normalized = (species || '').toLowerCase();
        if (normalized.includes('кош') || normalized.includes('cat')) return '🐱';
        return '🐶';
    };

    const recentPets = pets.slice(0, 2);

    return (
        <div className="page-container">
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
                        <div className="stat-value">2</div>
                        <p className="stat-desc">По текущему графику</p>
                    </div>
                    <div className="stat-icon">🍽️</div>
                </div>

                <div className="card stat-card">
                    <div className="stat-info">
                        <h3>Плановые вакцинации</h3>
                        <div className="stat-value">1</div>
                        <p className="stat-desc">На ближайший месяц</p>
                    </div>
                    <div className="stat-icon">💉</div>
                </div>
            </div>

            <div className="widgets-grid">
                <div className="card">
                    <div className="card-header" style={{ marginBottom: '12px' }}>
                        График кормлений
                    </div>
                    <div className="feeding-list">
                        <div className="feeding-item bg-green-light">
                            <div className="feeding-info">
                                <div className="dot dot-green" />
                                <div className="feeding-text">
                                    <h4>Утреннее кормление</h4>
                                    <p>Сухой корм • 08:00</p>
                                </div>
                            </div>
                            <div className="feeding-time">Ежедневно</div>
                        </div>
                        <div className="feeding-item bg-orange-light">
                            <div className="feeding-info">
                                <div className="dot dot-orange" />
                                <div className="feeding-text">
                                    <h4>Вечернее кормление</h4>
                                    <p>Влажный корм • 19:00</p>
                                </div>
                            </div>
                            <div className="feeding-time">Ежедневно</div>
                        </div>
                    </div>
                </div>

                <div className="card">
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
            </div>

            <PetDetailModal
                pet={selectedPet}
                onClose={() => setSelectedPet(null)}
            />
        </div>
    );
}