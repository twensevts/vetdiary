import React, { useState } from 'react';
import axios from 'axios';

const DOG_BREEDS = [
    'Лабрадор', 'Немецкая овчарка', 'Бульдог', 'Пудель', 'Бигль',
    'Хаски', 'Корги', 'Такса', 'Чихуахуа', 'Шпиц', 'Йоркширский терьер',
    'Ротвейлер', 'Доберман', 'Боксёр', 'Далматин'
];

const CAT_COLORS = [
    'Чёрный', 'Белый', 'Рыжий', 'Серый', 'Полосатый',
    'Трёхцветный', 'Дымчатый', 'Кремовый', 'Шоколадный'
];

export default function AddPetModal({ isOpen, onClose, onPetAdded }) {
    const [formData, setFormData] = useState({
        name: '',
        species: 'Собака',
        breed: '',
        customBreed: '',
        weight: '',
        birth_date: '',
        health_notes: ''
    });

    if (!isOpen) return null;

    const getBreedLabel = () => {
        if (formData.species === 'Собака') return 'Порода';
        if (formData.species === 'Кошка') return 'Цвет';
        return 'Цвет/Порода';
    };

    const getBreedOptions = () => {
        if (formData.species === 'Собака') return DOG_BREEDS;
        if (formData.species === 'Кошка') return CAT_COLORS;
        return [];
    };

    const isOther = formData.species === 'Другое';
    const breedOptions = getBreedOptions();

    const handleSpeciesChange = (e) => {
        setFormData({ ...formData, species: e.target.value, breed: '', customBreed: '' });
    };

    const handleBreedChange = (e) => {
        setFormData({ ...formData, breed: e.target.value, customBreed: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Валидация веса
        if (formData.weight !== '') {
            const w = Number(formData.weight);
            if (w < 0) {
                alert('Вес не может быть отрицательным');
                return;
            }
        }

        // Валидация даты рождения (не в будущем)
        if (formData.birth_date) {
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            if (birthDate > today) {
                alert('Дата рождения не может быть в будущем');
                return;
            }
        }

        try {
            let breedValue = '';
            if (isOther) {
                breedValue = formData.customBreed;
            } else if (formData.breed === '__custom__') {
                breedValue = formData.customBreed;
            } else {
                breedValue = formData.breed;
            }

            const payload = {
                name: formData.name,
                species: formData.species,
                breed: breedValue || null,
                weight: formData.weight === '' ? null : Number(formData.weight),
                birth_date: formData.birth_date || null,
                health_notes: formData.health_notes || null
            };

            await axios.post('http://localhost:5000/api/pets', payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setFormData({ name: '', species: 'Собака', breed: '', customBreed: '', weight: '', birth_date: '', health_notes: '' });
            onPetAdded();
            onClose();
        } catch (error) {
            alert('Ошибка при добавлении питомца');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 style={{ marginBottom: '20px' }}>Добавить питомца</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Кличка *</label>
                        <input
                            type="text"
                            className="form-control"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Вид животного *</label>
                        <select className="form-control" value={formData.species} onChange={handleSpeciesChange}>
                            <option>Собака</option>
                            <option>Кошка</option>
                            <option>Другое</option>
                        </select>
                    </div>

                    {/* Порода/Цвет */}
                    <div className="form-group">
                        <label>{getBreedLabel()}</label>
                        {isOther ? (
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Введите цвет/породу"
                                value={formData.customBreed}
                                onChange={e => setFormData({ ...formData, customBreed: e.target.value })}
                            />
                        ) : (
                            <>
                                <select className="form-control" value={formData.breed} onChange={handleBreedChange}>
                                    <option value="">Не выбрано</option>
                                    {breedOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                    <option value="__custom__">Другое (ввести вручную)</option>
                                </select>
                                {formData.breed === '__custom__' && (
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ marginTop: '8px' }}
                                        placeholder={formData.species === 'Собака' ? 'Введите породу' : 'Введите цвет'}
                                        value={formData.customBreed}
                                        onChange={e => setFormData({ ...formData, customBreed: e.target.value })}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Дата рождения</label>
                            <input
                                type="date"
                                className="form-control"
                                value={formData.birth_date}
                                onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Вес (кг)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="form-control"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Особенности здоровья</label>
                        <textarea
                            className="form-control"
                            value={formData.health_notes}
                            onChange={e => setFormData({ ...formData, health_notes: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn-primary">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
