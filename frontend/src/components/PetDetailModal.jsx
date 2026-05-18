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
    border: '1px solid rgba(15, 23, 42, 0.06)',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    background: '#f9fafb',
};

const editInputFocusHandler = (e) => {
    e.target.style.borderColor = '#06876f';
    e.target.style.boxShadow = '0 0 0 3px rgba(6, 135, 111, 0.1)';
    e.target.style.background = '#fff';
};

const editInputBlurHandler = (e) => {
    e.target.style.borderColor = 'rgba(15, 23, 42, 0.06)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = '#f9fafb';
};

const editLabelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '6px',
};

export default function PetDetailModal({ pet, onClose, onPetDeleted, onPetUpdated }) {
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
            console.log('Uploading photo for pet:', idToUse, selectedFile.name);
            const resp = await axios.post(`http://localhost:5000/api/pets/${idToUse}/photo`, form, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            console.log('Photo upload response:', resp.data);
            const updatedPet = { ...currentPet, photo_url: resp.data.photo_url };
            setLocalPet(updatedPet);
            if (onPetUpdated) onPetUpdated(updatedPet);
        } catch (e) {
            console.error('Ошибка загрузки фото', e.response?.data || e.message);
            alert('Не удалось загрузить фото: ' + (e.response?.data?.message || e.message));
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

    const handleDeletePet = async () => {
        if (!confirm('Точно удалить питомца? Это действие нельзя отменить.')) return;
        try {
            await axios.delete(`http://localhost:5000/api/pets/${pet.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (onPetDeleted) onPetDeleted();
            onClose();
        } catch (e) {
            console.error('Ошибка удаления питомца', e);
            alert('Не удалось удалить питомца');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="pet-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pet-detail-header" style={{ 
                    position: 'relative', 
                    overflow: 'hidden',
                    height: '200px',
                    background: 'linear-gradient(90deg, #07A08A, #06876f)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {currentPet.photo_url ? (
                        <img
                            src={currentPet.photo_url}
                            alt={currentPet.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                        />
                    ) : (
                        <div style={{ fontSize: '64px' }}>{getPetEmoji(currentPet.species)}</div>
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
                                color: '#0f1724',
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
                <div className="pet-detail-body" style={{ padding: '24px' }}>
                    <div className="pet-detail-title-row" style={{ marginBottom: '16px' }}>
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
                            <p className="pet-detail-subtitle" style={{ margin: '6px 0 12px 0', color: '#6B7280' }}>
                                {currentPet.species || 'Вид не указан'}{currentPet.breed ? `, ${currentPet.breed}` : ''}
                            </p>

                            <div style={{ 
                                display: 'flex', 
                                gap: '14px', 
                                flexWrap: 'wrap',
                                padding: '16px',
                                background: 'rgba(248, 250, 252, 0.5)',
                                borderRadius: '10px'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                                    <span style={{ color: '#6B7280', fontSize: '13px' }}>Возраст:</span>
                                    <strong style={{ fontSize: '16px' }}>{calculateAge(currentPet.birth_date)}</strong>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                                    <span style={{ color: '#6B7280', fontSize: '13px' }}>Вес:</span>
                                    <strong style={{ fontSize: '16px' }}>{currentPet.weight ? `${currentPet.weight} кг` : 'Не указан'}</strong>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                                    <span style={{ color: '#6B7280', fontSize: '13px' }}>Дата рождения:</span>
                                    <strong style={{ fontSize: '16px' }}>{formatDate(currentPet.birth_date)}</strong>
                                </div>
                            </div>

                            <div style={{ marginTop: '16px', fontSize: '14px' }}>
                                <span style={{ fontWeight: '600', color: '#475569' }}>Заметки:</span>
                                <p style={{ margin: '8px 0 0 0', color: '#334155' }}>{currentPet.health_notes || 'Нет заметок о здоровье.'}</p>
                            </div>
                        </>
                    )}

                    {isOwner && (
                        <div style={{ marginTop: '16px' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Документы</h4>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                                <input type="file" onChange={handleFileChange} style={{ fontSize: '14px' }} />
                                <button className="btn btn-primary" onClick={handleUpload} style={{ whiteSpace: 'nowrap' }}>Загрузить</button>
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                {documents.length === 0 && <p className="muted" style={{ margin: '0', fontSize: '14px' }}>Документы отсутствуют</p>}
                                {documents.map((d) => (
                                    <div key={d.id} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '10px 0',
                                        borderBottom: '1px solid rgba(15, 23, 42, 0.04)'
                                    }}>
                                        <div>
                                            <strong style={{ fontSize: '14px' }}>{d.title || 'Без названия'}</strong>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <a 
                                                href={`data:application/octet-stream;base64,${d.file_data}`} 
                                                download={encodeURIComponent(d.file_name || 'document')} 
                                                className="btn btn-link"
                                                style={{ fontSize: '13px' }}
                                            >Скачать</a>
                                            <button className="btn btn-outline" onClick={() => handleDeleteDocument(d.id)} style={{ fontSize: '13px', padding: '4px 8px' }}>Удалить</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(15, 23, 42, 0.04)' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose} style={{ fontSize: '14px' }}>Закрыть</button>
                        {isOwner && (
                            <button 
                                type="button" 
                                className="btn" 
                                style={{ 
                                    background: '#FEE2E2', 
                                    color: '#991B1B',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }} 
                                onClick={handleDeletePet}
                            >
                                Удалить питомца
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
