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

const editInputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    background: '#f9fafb',
};

const editInputFocusHandler = (e) => {
    e.target.style.borderColor = 'var(--primary-color)';
    e.target.style.boxShadow = '0 0 0 3px rgba(32, 178, 170, 0.1)';
    e.target.style.background = '#fff';
};

const editInputBlurHandler = (e) => {
    e.target.style.borderColor = 'var(--border-color)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = '#f9fafb';
};

const editLabelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '6px',
};

export default function PetDetailModal({ pet, onClose }) {
    const normalizePet = (p) => {
        if (!p) return null;
        return {
            id: p.id ?? p.pet_id ?? p.petId,
            name: p.name ?? p.pet_name ?? p.petName,
            species: p.species ?? p.pet_species ?? p.petSpecies,
            breed: p.breed ?? p.pet_breed ?? p.petBreed,
            birth_date: p.birth_date ?? p.pet_birth_date ?? p.petBirthDate,
            weight: p.weight ?? p.pet_weight ?? p.petWeight,
            health_notes: p.health_notes ?? p.pet_health_notes ?? p.petHealthNotes,
            photo_url: p.photo_url ?? p.pet_photo_url ?? p.petPhotoUrl,
            owner_id: p.owner_id ?? p.pet_owner_id ?? p.ownerId,
        };
    };

    const [localPet, setLocalPet] = useState(() => normalizePet(pet));
    const [editing, setEditing] = useState(false);
    const [file, setFile] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [saving, setSaving] = useState(false);
    const currentPet = localPet || normalizePet(pet);

    // Проверяем, является ли текущий пользователь владельцем питомца
    const token = localStorage.getItem('token');
    let currentUserId = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.id;
        } catch {}
    }
    const isOwner = currentPet && currentUserId && String(currentPet.owner_id) === String(currentUserId);

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
            setLocalPet(null);
            return;
        }

        const normalized = normalizePet(pet);
        setLocalPet(normalized);
        setPhotoFile(null);

        const ownerCheck = currentUserId && String(normalized.owner_id) === String(currentUserId);

        // If pet data from the post is partial (missing key fields), fetch full pet from API
        const needsFullFetch = normalized && normalized.id && (
            normalized.birth_date == null && normalized.weight == null && (normalized.health_notes == null || normalized.health_notes === '')
        );

        if (needsFullFetch) {
            (async () => {
                try {
                    const resp = await axios.get(`http://localhost:5000/api/pets/${normalized.id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    const full = normalizePet(resp.data);
                    setLocalPet(full);
                    if (ownerCheck) fetchDocuments(full.id);
                } catch (e) {
                    console.error('Не удалось получить полные данные питомца', e);
                    if (ownerCheck) fetchDocuments(normalized.id);
                }
            })();
        } else {
            if (ownerCheck) {
                fetchDocuments(normalized.id);
            } else {
                setDocuments([]);
            }
        }
    }, [pet, isOwner]);

    if (!pet) return null;

    const handlePhotoUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setPhotoFile(selectedFile);
        setUploadingPhoto(true);
        try {
            const form = new FormData();
            form.append('photo', selectedFile);
            const idToUse = currentPet?.id || pet?.id;
            const resp = await axios.post(`http://localhost:5000/api/pets/${idToUse}/photo`, form, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' }
            });
            setLocalPet({ ...currentPet, photo_url: resp.data.photo_url });
        } catch (e) {
            console.error('Ошибка загрузки фото', e);
            alert('Не удалось загрузить фото');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Валидация веса
            if (currentPet.weight !== null && currentPet.weight !== '' && currentPet.weight !== undefined) {
                const w = Number(currentPet.weight);
                if (w < 0) {
                    alert('Вес не может быть отрицательным');
                    setSaving(false);
                    return;
                }
            }

            // Валидация даты рождения
            if (currentPet.birth_date) {
                const birthDate = new Date(currentPet.birth_date);
                const today = new Date();
                if (birthDate > today) {
                    alert('Дата рождения не может быть в будущем');
                    setSaving(false);
                    return;
                }
            }

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
                <div className="pet-detail-header" style={{ position: 'relative', overflow: 'hidden' }}>
                    {currentPet.photo_url ? (
                        <img
                            src={currentPet.photo_url}
                            alt={currentPet.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                        />
                    ) : (
                        getPetEmoji(currentPet.species)
                    )}
                    {isOwner && (
                        <label
                            style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '10px',
                                background: 'rgba(255,255,255,0.9)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'var(--text-color)',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                        >
                            {uploadingPhoto ? 'Загрузка...' : (currentPet.photo_url ? 'Изменить фото' : 'Загрузить фото')}
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handlePhotoUpload}
                                disabled={uploadingPhoto}
                            />
                        </label>
                    )}
                </div>
                <div className="pet-detail-body">
                    <div className="pet-detail-title-row">
                        {editing ? (
                            <div style={{ flex: 1 }}>
                                <label style={editLabelStyle}>Кличка</label>
                                <input
                                    style={editInputStyle}
                                    value={currentPet.name || ''}
                                    onChange={(e) => setLocalPet({ ...currentPet, name: e.target.value })}
                                    onFocus={editInputFocusHandler}
                                    onBlur={editInputBlurHandler}
                                />
                            </div>
                        ) : (
                            <h3 style={{ margin: 0 }}>{currentPet.name}</h3>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                            {isOwner && (
                                editing ? (
                                    <>
                                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                            {saving ? 'Сохраняю...' : 'Сохранить'}
                                        </button>
                                        <button className="btn btn-outline" onClick={() => { setEditing(false); setLocalPet(pet); }}>
                                            Отмена
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn btn-outline" onClick={() => setEditing(true)}>Редактировать</button>
                                )
                            )}
                        </div>
                    </div>

                    {!editing && (
                        <p className="pet-detail-subtitle">
                            {currentPet.species || 'Вид не указан'}{currentPet.breed ? `, ${currentPet.breed}` : ''}
                        </p>
                    )}

                    {editing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={editLabelStyle}>Вид</label>
                                    <input
                                        style={editInputStyle}
                                        value={currentPet.species || ''}
                                        onChange={(e) => setLocalPet({ ...currentPet, species: e.target.value })}
                                        onFocus={editInputFocusHandler}
                                        onBlur={editInputBlurHandler}
                                    />
                                </div>
                                <div>
                                    <label style={editLabelStyle}>Порода / Цвет</label>
                                    <input
                                        style={editInputStyle}
                                        value={currentPet.breed || ''}
                                        onChange={(e) => setLocalPet({ ...currentPet, breed: e.target.value })}
                                        onFocus={editInputFocusHandler}
                                        onBlur={editInputBlurHandler}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={editLabelStyle}>Вес (кг)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        style={editInputStyle}
                                        value={currentPet.weight || ''}
                                        onChange={(e) => setLocalPet({ ...currentPet, weight: e.target.value })}
                                        onFocus={editInputFocusHandler}
                                        onBlur={editInputBlurHandler}
                                    />
                                </div>
                                <div>
                                    <label style={editLabelStyle}>Дата рождения</label>
                                    <input
                                        type="date"
                                        style={editInputStyle}
                                        value={currentPet.birth_date ? currentPet.birth_date.split('T')[0] : ''}
                                        onChange={(e) => setLocalPet({ ...currentPet, birth_date: e.target.value })}
                                        onFocus={editInputFocusHandler}
                                        onBlur={editInputBlurHandler}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={editLabelStyle}>Заметки о здоровье</label>
                                <textarea
                                    style={{ ...editInputStyle, minHeight: '80px', resize: 'vertical' }}
                                    value={currentPet.health_notes || ''}
                                    onChange={(e) => setLocalPet({ ...currentPet, health_notes: e.target.value })}
                                    onFocus={editInputFocusHandler}
                                    onBlur={editInputBlurHandler}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="pet-detail-stats">
                                <div className="pet-detail-stat">
                                    <span>Возраст:</span>
                                    <strong>{calculateAge(currentPet.birth_date)}</strong>
                                </div>
                                <div className="pet-detail-stat">
                                    <span>Вес:</span>
                                    <strong>{currentPet.weight ? `${currentPet.weight} кг` : 'Не указан'}</strong>
                                </div>
                                <div className="pet-detail-stat">
                                    <span>Дата рождения:</span>
                                    <strong>{formatDate(currentPet.birth_date)}</strong>
                                </div>
                            </div>

                            <div className="pet-detail-notes">
                                <span>Заметки:</span>
                                <p>{currentPet.health_notes || 'Нет заметок о здоровье.'}</p>
                            </div>
                        </>
                    )}

                    {isOwner && (
                        <div style={{ marginTop: '16px' }}>
                            <h4>Документы</h4>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
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
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <a href={`data:application/octet-stream;base64,${d.file_data}`} download={d.file_name} className="btn btn-link">Скачать</a>
                                            <button className="btn btn-outline" onClick={() => handleDeleteDocument(d.id)}>Удалить</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Закрыть</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
