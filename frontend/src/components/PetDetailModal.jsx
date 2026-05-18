import React, { useEffect, useState } from 'react';
import axios from 'axios';

const formatDate = (dateValue) => {
    if (!dateValue) return 'Не указано';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Не указано';
    return date.toLocaleDateString('ru-RU');
};

const calculateAge = (dateValue) => {
    if (!dateValue) return 'Не указано';
    const birthDate = new Date(dateValue);
    if (Number.isNaN(birthDate.getTime())) return 'Не указано';

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        years -= 1;
    }

    if (years < 0) return 'Не указано';
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
};

const getPetEmoji = (species) => {
    const normalized = (species || '').toLowerCase();
    if (normalized.includes('кош')) return '🐱';
    if (normalized.includes('cat')) return '🐱';
    if (normalized.includes('пти')) return '🐦';
    if (normalized.includes('bird')) return '🐦';
    return '🐶';
};

export default function PetDetailModal({ pet, onClose }) {
    const [localPet, setLocalPet] = useState(pet);
    const [editing, setEditing] = useState(false);
    const [file, setFile] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [saving, setSaving] = useState(false);
    const currentPet = localPet || pet;

    const fetchDocuments = async (petId) => {
        try {
            const resp = await axios.get(`http://localhost:5000/api/pets/${petId}/documents`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setDocuments(resp.data || []);
        } catch (e) {
            console.error('Не удалось загрузить документы', e);
        }
    };

    useEffect(() => {
        if (!pet) {
            setDocuments([]);
            return;
        }

        setLocalPet(pet);
        fetchDocuments(pet.id);
    }, [pet]);

    if (!pet) return null;

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                name: currentPet.name,
                species: currentPet.species,
                breed: currentPet.breed,
                weight: currentPet.weight,
                birth_date: currentPet.birth_date,
                health_notes: currentPet.health_notes,
            };
            const resp = await axios.put(`http://localhost:5000/api/pets/${pet.id}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setLocalPet(resp.data);
            setEditing(false);
        } catch (e) {
            console.error('Ошибка при сохранении', e);
            alert('Не удалось сохранить изменения');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e) => setFile(e.target.files[0] || null);

    const handleUpload = async () => {
        if (!file) return alert('Выберите файл');
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('title', file.name);
            const resp = await axios.post(`http://localhost:5000/api/pets/${pet.id}/documents`, form, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' }
            });
            setDocuments([resp.data, ...documents]);
            setFile(null);
        } catch (e) {
            console.error('Ошибка загрузки документа', e);
            alert('Не удалось загрузить документ');
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!confirm('Удалить документ?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/pets/${pet.id}/documents/${docId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setDocuments(documents.filter(d => d.id !== docId));
        } catch (e) {
            console.error('Ошибка удаления', e);
            alert('Не удалось удалить документ');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="pet-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pet-detail-header">{getPetEmoji(pet.species)}</div>
                <div className="pet-detail-body">
                    <div className="pet-detail-title-row">
                        {editing ? (
                            <input value={currentPet.name || ''} onChange={(e) => setLocalPet({ ...currentPet, name: e.target.value })} />
                        ) : (
                            <h3>{currentPet.name}</h3>
                        )}
                        <div style={{ marginLeft: 'auto' }}>
                            {editing ? (
                                <>
                                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Сохраняю...' : 'Сохранить'}</button>
                                    <button className="btn btn-outline" onClick={() => { setEditing(false); setLocalPet(pet); }}>Отмена</button>
                                </>
                            ) : (
                                <button className="btn" onClick={() => setEditing(true)}>Редактировать</button>
                            )}
                        </div>
                    </div>

                    <p className="pet-detail-subtitle">{currentPet.species || 'Вид не указан'}{currentPet.breed ? `, ${currentPet.breed}` : ''}</p>

                    <div className="pet-detail-stats">
                        <div className="pet-detail-stat"><span>Возраст:</span><strong>{calculateAge(currentPet.birth_date)}</strong></div>
                        <div className="pet-detail-stat"><span>Вес:</span>{editing ? (<input value={currentPet.weight || ''} onChange={(e) => setLocalPet({ ...currentPet, weight: e.target.value })} />) : (<strong>{currentPet.weight ? `${currentPet.weight} кг` : 'Не указан'}</strong>)}</div>
                        <div className="pet-detail-stat"><span>Дата рождения:</span>{editing ? (<input type="date" value={currentPet.birth_date ? currentPet.birth_date.split('T')[0] : ''} onChange={(e) => setLocalPet({ ...currentPet, birth_date: e.target.value })} />) : (<strong>{formatDate(currentPet.birth_date)}</strong>)}</div>
                    </div>

                    <div className="pet-detail-notes">
                        <span>Заметки:</span>
                        {editing ? (
                            <textarea value={currentPet.health_notes || ''} onChange={(e) => setLocalPet({ ...currentPet, health_notes: e.target.value })} />
                        ) : (
                            <p>{currentPet.health_notes || 'Нет заметок о здоровье.'}</p>
                        )}
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <h4>Документы</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="file" onChange={handleFileChange} />
                            <button className="btn btn-primary" onClick={handleUpload}>Загрузить</button>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            {documents.length === 0 && <p className="muted">Документы отсутствуют</p>}
                            {documents.map((d) => (
                                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                                    <div>
                                        <strong>{d.title}</strong>
                                        <div className="muted" style={{ fontSize: '12px' }}>{d.file_name}</div>
                                    </div>
                                    <div>
                                        <a href={`data:application/octet-stream;base64,${d.file_data}`} download={d.file_name} className="btn btn-link">Скачать</a>
                                        <button className="btn btn-outline" onClick={() => handleDeleteDocument(d.id)}>Удалить</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
