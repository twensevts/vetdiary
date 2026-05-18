import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PetDetailModal from '../components/PetDetailModal';
import axios from 'axios';
import AddPetModal from '../components/AddPetModal';

const getEmoji = (species) => {
    const normalized = (species || '').toLowerCase();
    if (normalized.includes('кош') || normalized.includes('cat')) return '🐱';
    if (normalized.includes('bird') || normalized.includes('пти')) return '🐦';
    return '🐶';
};

export default function Pets() {
    const [pets, setPets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const params = useParams();
    const navigate = useNavigate();
    const [selectedPet, setSelectedPet] = useState(null);

    const fetchPets = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/pets', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setPets(response.data);
        } catch (fetchError) {
            setError('Не удалось загрузить питомцев.');
        }
    };

    useEffect(() => {
        fetchPets();
    }, []);

    useEffect(() => {
        if (params.id) {
            const found = pets.find(p => String(p.id) === String(params.id));
            if (found) setSelectedPet(found);
        }
    }, [params, pets]);

    return (
        <div className="page-container">
            <div className="card">
                <div className="card-header">
                    <span>Питомцы</span>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Добавить питомца</button>
                </div>

                {error && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <div className="pets-grid">
                    {pets.map((pet) => (
                        <div key={pet.id} className="pet-card" onClick={() => { setSelectedPet(pet); }}>
                            <div className="pet-image-placeholder">
                                {pet.photo_url ? (
                                    <img src={pet.photo_url} alt={pet.name} className="pet-photo" />
                                ) : (
                                    <div className="pet-emoji">{getEmoji(pet.species)}</div>
                                )}
                            </div>
                            <div className="pet-info">
                                <div className="pet-name">{pet.name}</div>
                                <div className="pet-details">{pet.species}{pet.breed ? `, ${pet.breed}` : ''}</div>
                                <div className="pet-badge">{pet.weight ? `${pet.weight} кг` : 'Вес не указан'}</div>
                            </div>
                        </div>
                    ))}
                    {pets.length === 0 && <p className="muted">Пока нет добавленных питомцев.</p>}
                </div>
            </div>

            <AddPetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPetAdded={fetchPets}
            />

            <PetDetailModal pet={selectedPet} onClose={() => { setSelectedPet(null); navigate('/pets'); }} onPetDeleted={fetchPets} />
        </div>
    );
}
