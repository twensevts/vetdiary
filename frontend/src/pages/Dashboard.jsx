import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddPetModal from '../components/AddPetModal';

export default function Dashboard() {
    const [pets, setPets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPets = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPets(response.data);
        } catch (error) {
            console.error("Ошибка загрузки питомцев", error);
        }
    };

    useEffect(() => {
        fetchPets();
    }, []);

    const getEmoji = (species) => species.toLowerCase() === 'кошка' ? '🐱' : '🐶';

    return (
        <div className="page-container">
            <div className="card">
                <div className="card-header">
                    Мои питомцы
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Добавить питомца</button>
                </div>

                <div className="pets-grid">
                    {pets.map(pet => (
                        <div key={pet.id} className="pet-card">
                            <div className="pet-image-placeholder">{getEmoji(pet.species)}</div>
                            <div className="pet-info">
                                <div className="pet-name">{pet.name}</div>
                                <div className="pet-details">{pet.species} {pet.breed ? `, ${pet.breed}` : ''}</div>
                                <div className="pet-badge">{pet.weight} кг</div>
                            </div>
                        </div>
                    ))}
                    {pets.length === 0 && <p style={{ color: 'var(--text-muted)' }}>У вас пока нет добавленных питомцев.</p>}
                </div>
            </div>

            <AddPetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPetAdded={fetchPets}
            />
        </div>
    );
}