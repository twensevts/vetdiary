import React, { useState } from 'react';
import axios from 'axios';

export default function AddPetModal({ isOpen, onClose, onPetAdded }) {
    const [formData, setFormData] = useState({ name: '', species: 'Собака', breed: '', weight: '', birth_date: '', health_notes: '' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/pets', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            onPetAdded(); // Обновляем список на главном экране
            onClose(); // Закрываем окно
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
                        <label>Имя</label>
                        <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Вид</label>
                            <select className="form-control" value={formData.species} onChange={e => setFormData({ ...formData, species: e.target.value })}>
                                <option>Собака</option><option>Кошка</option><option>Другое</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Вес (кг)</label>
                            <input type="number" step="0.1" className="form-control" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Особенности здоровья</label>
                        <textarea className="form-control" value={formData.health_notes} onChange={e => setFormData({ ...formData, health_notes: e.target.value })} />
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