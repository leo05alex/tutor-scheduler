import { useState, useEffect } from 'react';

function StudentModal({
    isOpen,
    onClose,
    student,
    settings,
    onSave,
    onDelete,
    studentLessons = [],
    allStudents = []
}) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        subjects: [],
        level: '',
        goals: '',
        notes: '',
        color: ''
    });

    // Предустановленные цвета для учеников
    const studentColors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308',
        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];

    // Получить занятые цвета (исключая текущего ученика при редактировании)
    const getUsedColors = () => {
        return allStudents
            .filter(s => s.id !== student?.id)
            .map(s => s.color)
            .filter(Boolean);
    };

    const [activeTab, setActiveTab] = useState('info');

    // Инициализация формы
    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || '',
                phone: student.phone || '',
                email: student.email || '',
                subjects: student.subjects || [],
                level: student.level || '',
                goals: student.goals || '',
                notes: student.notes || '',
                color: student.color || ''
            });
            setActiveTab('info');
        } else {
            // Для нового ученика выбираем первый свободный цвет
            const usedColors = allStudents.map(s => s.color).filter(Boolean);
            const availableColor = studentColors.find(c => !usedColors.includes(c)) || studentColors[0];
            setFormData({
                name: '',
                phone: '',
                email: '',
                subjects: [],
                level: '',
                goals: '',
                notes: '',
                color: availableColor
            });
            setActiveTab('info');
        }
    }, [student, isOpen, allStudents]);

    // Обновление поля
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Переключение предмета
    const toggleSubject = (subjectId) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.includes(subjectId)
                ? prev.subjects.filter(s => s !== subjectId)
                : [...prev.subjects, subjectId]
        }));
    };

    // Сохранение
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Пожалуйста, введите имя ученика');
            return;
        }

        onSave(formData);
    };

    // Получить информацию о предмете
    const getSubjectInfo = (subjectId) => {
        const subject = settings?.subjects?.find(s => s.id === subjectId);
        return subject || { name: subjectId, color: '#6366f1' };
    };

    // Форматирование валюты
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (!isOpen) return null;

    // Статистика ученика
    const completedLessons = studentLessons.filter(l => l.status === 'completed');
    const totalHours = completedLessons.reduce((sum, l) => sum + (l.duration || 60) / 60, 0);
    const totalEarned = completedLessons.reduce((sum, l) => sum + (l.price || 0), 0);

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {student ? '👨‍🎓 ' + student.name : '➕ Новый ученик'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Табы для существующего ученика */}
                {student && (
                    <div style={{ borderBottom: '1px solid var(--border-color)', display: 'flex' }}>
                        <button
                            className="btn"
                            style={{
                                borderRadius: 0,
                                borderBottom: activeTab === 'info' ? '2px solid var(--primary-500)' : 'none',
                                background: 'transparent',
                                color: activeTab === 'info' ? 'var(--primary-500)' : 'var(--text-secondary)'
                            }}
                            onClick={() => setActiveTab('info')}
                        >
                            📝 Информация
                        </button>
                        <button
                            className="btn"
                            style={{
                                borderRadius: 0,
                                borderBottom: activeTab === 'history' ? '2px solid var(--primary-500)' : 'none',
                                background: 'transparent',
                                color: activeTab === 'history' ? 'var(--primary-500)' : 'var(--text-secondary)'
                            }}
                            onClick={() => setActiveTab('history')}
                        >
                            📚 История ({studentLessons.length})
                        </button>
                    </div>
                )}

                {activeTab === 'info' ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(80vh - 120px)' }}>
                        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                            {/* Статистика для существующего ученика */}
                            {student && (
                                <div
                                    className="grid grid-3 mb-6"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        padding: 'var(--space-4)',
                                        borderRadius: 'var(--radius-lg)'
                                    }}
                                >
                                    <div className="text-center">
                                        <div className="font-semibold">{completedLessons.length}</div>
                                        <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>занятий</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold">{totalHours.toFixed(1)}ч</div>
                                        <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>часов</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold">{formatCurrency(totalEarned)}</div>
                                        <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>заработано</div>
                                    </div>
                                </div>
                            )}

                            {/* Имя */}
                            <div className="form-group">
                                <label className="form-label">Имя *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Введите имя ученика..."
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    required
                                />
                            </div>

                            {/* Цвет ученика */}
                            <div className="form-group">
                                <label className="form-label">🎨 Цвет в календаре</label>
                                <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
                                    {studentColors.map(color => {
                                        const isUsed = getUsedColors().includes(color);
                                        const isSelected = formData.color === color;
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => !isUsed && handleChange('color', color)}
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: color,
                                                    border: isSelected ? '3px solid var(--text-primary)' : '2px solid transparent',
                                                    cursor: isUsed ? 'not-allowed' : 'pointer',
                                                    opacity: isUsed ? 0.3 : 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                disabled={isUsed}
                                                title={isUsed ? 'Занят' : ''}
                                            >
                                                {isSelected && <span style={{ color: 'white', fontSize: 14 }}>✓</span>}
                                            </button>
                                        );
                                    })}
                                    {/* Кастомный цвет */}
                                    <div
                                        style={{
                                            marginLeft: 'var(--space-2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-2)'
                                        }}
                                    >
                                        <input
                                            type="color"
                                            value={formData.color || '#6366f1'}
                                            onChange={(e) => handleChange('color', e.target.value)}
                                            style={{
                                                width: 28,
                                                height: 28,
                                                border: 'none',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'pointer'
                                            }}
                                            title="Выбрать свой цвет"
                                        />
                                        <span className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                            или свой
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Контакты */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">📱 Телефон</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="+7 (999) 123-45-67"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">✉️ Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Предметы */}
                            <div className="form-group">
                                <label className="form-label">Предметы</label>
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {settings?.subjects?.map(subject => (
                                        <button
                                            key={subject.id}
                                            type="button"
                                            className="badge"
                                            style={{
                                                background: formData.subjects.includes(subject.id)
                                                    ? subject.color
                                                    : `${subject.color}20`,
                                                color: formData.subjects.includes(subject.id)
                                                    ? 'white'
                                                    : subject.color,
                                                cursor: 'pointer',
                                                padding: 'var(--space-2) var(--space-3)',
                                                transition: 'all var(--transition-fast)'
                                            }}
                                            onClick={() => toggleSubject(subject.id)}
                                        >
                                            {formData.subjects.includes(subject.id) ? '✓ ' : ''}{subject.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Уровень */}
                            <div className="form-group">
                                <label className="form-label">Уровень подготовки</label>
                                <select
                                    className="form-select"
                                    value={formData.level}
                                    onChange={(e) => handleChange('level', e.target.value)}
                                >
                                    <option value="">Не указан</option>
                                    <option value="Начальный">Начальный</option>
                                    <option value="Средний">Средний</option>
                                    <option value="Продвинутый">Продвинутый</option>
                                    <option value="Подготовка к ОГЭ">Подготовка к ОГЭ</option>
                                    <option value="Подготовка к ЕГЭ">Подготовка к ЕГЭ</option>
                                </select>
                            </div>

                            {/* Цели */}
                            <div className="form-group">
                                <label className="form-label">Цели обучения</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Опишите цели ученика..."
                                    value={formData.goals}
                                    onChange={(e) => handleChange('goals', e.target.value)}
                                    rows={2}
                                />
                            </div>

                            {/* Заметки */}
                            <div className="form-group">
                                <label className="form-label">📝 Заметки о прогрессе</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Заметки о ученике, особенности, прогресс..."
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            {student && (
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={onDelete}
                                    style={{ marginRight: 'auto' }}
                                >
                                    🗑️ Удалить
                                </button>
                            )}
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Отмена
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {student ? 'Сохранить' : 'Добавить'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* История занятий */
                    <div className="modal-body" style={{
                        padding: 0,
                        maxHeight: 'calc(80vh - 120px)',
                        overflowY: 'auto'
                    }}>
                        {studentLessons.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <div className="empty-state-icon">📚</div>
                                <div className="empty-state-title">Нет занятий</div>
                                <div className="empty-state-text">
                                    История занятий с этим учеником пуста
                                </div>
                            </div>
                        ) : (
                            <ul className="list">
                                {studentLessons
                                    .sort((a, b) => {
                                        const timeA = new Date(`${a.date}T${a.startTime || '00:00'}`).getTime();
                                        const timeB = new Date(`${b.date}T${b.startTime || '00:00'}`).getTime();
                                        return timeA - timeB; // От старых к новым
                                    })
                                    .map(lesson => {
                                        const subject = getSubjectInfo(lesson.subject);
                                        const lessonDate = new Date(lesson.date);
                                        return (
                                            <li key={lesson.id} className="list-item">
                                                <div
                                                    className="avatar avatar-sm"
                                                    style={{ background: subject.color }}
                                                >
                                                    {subject.name.charAt(0)}
                                                </div>
                                                <div className="list-item-content">
                                                    <div className="list-item-title">
                                                        {subject.name}
                                                        {lesson.topic && ` — ${lesson.topic}`}
                                                    </div>
                                                    <div className="list-item-subtitle">
                                                        {lessonDate.toLocaleDateString('ru-RU')} • {lesson.startTime} • {lesson.duration} мин
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold">{formatCurrency(lesson.price)}</div>
                                                    <span className={`badge badge-${lesson.status === 'completed'
                                                        ? (lesson.isPaid ? 'success' : 'warning')
                                                        : lesson.status === 'cancelled' ? 'danger' : 'primary'
                                                        }`}>
                                                        {lesson.status === 'completed'
                                                            ? (lesson.isPaid ? '✓ Оплачено' : '💳 Не оплачено')
                                                            : lesson.status === 'cancelled' ? 'Отменено' : 'Запланировано'
                                                        }
                                                    </span>
                                                </div>
                                            </li>
                                        );
                                    })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentModal;
