import { useState, useEffect } from 'react';
import { pluralize } from '../../utils/pluralize';

function LessonModal({
    isOpen,
    onClose,
    lesson,
    selectedDate,
    students,
    settings,
    onSave,
    onDelete,
    onUpdateSettings
}) {
    const [formData, setFormData] = useState({
        studentId: '',
        subject: '',
        topic: '',
        date: '',
        startTime: '',
        duration: 60,
        price: 1500,
        isOnline: false,
        meetingLink: '',
        notes: '',
        status: 'scheduled',
        isPaid: false,
        repeat: false,
        repeatCount: 4,
        repeatUnit: 'weeks'
    });

    const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
    const [topicInputValue, setTopicInputValue] = useState('');

    // Инициализация формы
    useEffect(() => {
        if (lesson) {
            // Редактирование существующего занятия
            setFormData({
                studentId: lesson.studentId || '',
                subject: lesson.subject || '',
                topic: lesson.topic || '',
                date: lesson.date ? new Date(lesson.date).toISOString().split('T')[0] : '',
                startTime: lesson.startTime || '',
                duration: lesson.duration || settings?.defaultLessonDuration || 60,
                price: lesson.price || settings?.defaultPrice || 1500,
                isOnline: lesson.isOnline || false,
                meetingLink: lesson.meetingLink || '',
                notes: lesson.notes || '',
                status: lesson.status || 'scheduled',
                isPaid: lesson.isPaid || false
            });
            setTopicInputValue(lesson.topic || '');
        } else if (selectedDate) {
            // Новое занятие — извлекаем время из клика в календаре
            const hours = String(selectedDate.getHours()).padStart(2, '0');
            const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
            const clickedTime = selectedDate.getHours() > 0 || selectedDate.getMinutes() > 0
                ? `${hours}:${minutes}`
                : '';

            setFormData({
                studentId: '',
                subject: '',
                topic: '',
                date: selectedDate.toISOString().split('T')[0],
                startTime: clickedTime,
                duration: settings?.defaultLessonDuration || 60,
                price: settings?.defaultPrice || 1500,
                isOnline: false,
                meetingLink: '',
                notes: '',
                status: 'scheduled',
                isPaid: false,
                repeat: false,
                repeatCount: 4,
                repeatUnit: 'weeks'
            });
            setTopicInputValue('');
        }
    }, [lesson, selectedDate, isOpen]); // Убрали settings — чтобы не сбрасывать форму при сохранении темы

    // Обновление поля
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Автоматически обновляем цену при смене ученика (если у него есть индивидуальная цена)
        // И сбрасываем предмет/тему т.к. у нового ученика могут быть другие предметы
        if (field === 'studentId' && value) {
            const student = students.find(s => s.id === parseInt(value));
            if (student?.defaultPrice) {
                setFormData(prev => ({ ...prev, price: student.defaultPrice, subject: '', topic: '' }));
            } else {
                setFormData(prev => ({ ...prev, subject: '', topic: '' }));
            }
            setTopicInputValue('');
        }

        // При смене предмета сбрасываем тему
        if (field === 'subject') {
            setTopicInputValue('');
            setFormData(prev => ({ ...prev, topic: '' }));
        }
    };

    // Получить темы для выбранного предмета
    const getTopicsForSubject = (subjectId) => {
        return settings?.topics?.[subjectId] || [];
    };

    // Фильтрованные темы для автодополнения
    const filteredTopics = getTopicsForSubject(formData.subject)
        .filter(topic => topic.toLowerCase().includes(topicInputValue.toLowerCase()));

    // Выбрать тему
    const selectTopic = (topic) => {
        setTopicInputValue(topic);
        setFormData(prev => ({ ...prev, topic }));
        setShowTopicSuggestions(false);
    };

    // Добавить тему в словарь
    const addTopicToDictionary = () => {
        if (!topicInputValue.trim() || !formData.subject) return;

        const currentTopics = settings?.topics?.[formData.subject] || [];
        if (currentTopics.includes(topicInputValue.trim())) return; // уже есть

        const newTopics = {
            ...settings?.topics,
            [formData.subject]: [...currentTopics, topicInputValue.trim()]
        };

        onUpdateSettings?.({ topics: newTopics });
    };

    // Удалить тему из словаря
    const removeTopicFromDictionary = (topicToRemove) => {
        if (!formData.subject) return;

        const currentTopics = settings?.topics?.[formData.subject] || [];
        const newTopics = {
            ...settings?.topics,
            [formData.subject]: currentTopics.filter(t => t !== topicToRemove)
        };

        onUpdateSettings?.({ topics: newTopics });
    };

    // Сохранение
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.studentId || !formData.subject || !formData.date || !formData.startTime) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        const lessonData = {
            ...formData,
            topic: topicInputValue.trim(),
            studentId: parseInt(formData.studentId),
            duration: parseInt(formData.duration),
            price: parseInt(formData.price),
            date: new Date(formData.date).toISOString()
        };

        // Если это не новое занятие, удаляем флаги повторения (чтобы не зациклиться если вдруг)
        if (lesson) {
            delete lessonData.repeat;
            delete lessonData.repeatCount;
            delete lessonData.repeatUnit;
        }

        onSave(lessonData);
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {lesson ? '✏️ Редактировать занятие' : '➕ Новое занятие'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Ученик */}
                        <div className="form-group">
                            <label className="form-label">Ученик *</label>
                            <select
                                className="form-select"
                                value={formData.studentId}
                                onChange={(e) => handleChange('studentId', e.target.value)}
                                required
                            >
                                <option value="">Выберите ученика...</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Предмет и тема */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Предмет *</label>
                                <select
                                    className="form-select"
                                    value={formData.subject}
                                    onChange={(e) => handleChange('subject', e.target.value)}
                                    required
                                    disabled={!formData.studentId}
                                >
                                    <option value="">Выберите предмет...</option>
                                    {(() => {
                                        // Получаем предметы выбранного ученика
                                        const selectedStudent = students.find(s => s.id === parseInt(formData.studentId));
                                        const studentSubjectIds = selectedStudent?.subjects || [];

                                        // Фильтруем предметы по тем, что есть у ученика
                                        const availableSubjects = studentSubjectIds.length > 0
                                            ? settings?.subjects?.filter(s => studentSubjectIds.includes(s.id))
                                            : settings?.subjects;

                                        return availableSubjects?.map(subject => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ));
                                    })()}
                                </select>
                                {!formData.studentId && (
                                    <p className="text-tertiary mt-1" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        Сначала выберите ученика
                                    </p>
                                )}
                            </div>

                            <div className="form-group" style={{ position: 'relative' }}>
                                <label className="form-label">Тема</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Введите или выберите тему..."
                                        value={topicInputValue}
                                        onChange={(e) => {
                                            setTopicInputValue(e.target.value);
                                            setFormData(prev => ({ ...prev, topic: e.target.value }));
                                        }}
                                        onFocus={() => setShowTopicSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowTopicSuggestions(false), 200)}
                                        disabled={!formData.subject}
                                        style={{ flex: 1 }}
                                    />
                                    {topicInputValue.trim() &&
                                        !getTopicsForSubject(formData.subject).includes(topicInputValue.trim()) && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={addTopicToDictionary}
                                                title="Добавить в словарь"
                                            >
                                                +📚
                                            </button>
                                        )}
                                </div>
                                {/* Подсказки */}
                                {showTopicSuggestions && filteredTopics.length > 0 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                            zIndex: 100,
                                            boxShadow: 'var(--shadow-lg)'
                                        }}
                                    >
                                        {filteredTopics.map(topic => (
                                            <div
                                                key={topic}
                                                style={{
                                                    padding: 'var(--space-2) var(--space-3)',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    fontSize: 'var(--font-size-sm)',
                                                    transition: 'background var(--transition-fast)'
                                                }}
                                                onMouseDown={() => selectTopic(topic)}
                                                onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                            >
                                                {topic}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!formData.subject && (
                                    <p className="text-tertiary mt-1" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        Сначала выберите предмет
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Дата и время */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Дата *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={(e) => handleChange('date', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Время начала *</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formData.startTime}
                                    onChange={(e) => handleChange('startTime', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Длительность и цена */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Длительность (мин)</label>
                                <select
                                    className="form-select"
                                    value={formData.duration}
                                    onChange={(e) => handleChange('duration', e.target.value)}
                                >
                                    <option value="30">30 минут</option>
                                    <option value="45">45 минут</option>
                                    <option value="60">60 минут</option>
                                    <option value="90">90 минут</option>
                                    <option value="120">120 минут</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Стоимость (₽)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={(e) => handleChange('price', e.target.value)}
                                    min="0"
                                    step="100"
                                />
                            </div>
                        </div>

                        {/* Онлайн */}
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input
                                    type="checkbox"
                                    checked={formData.isOnline}
                                    onChange={(e) => handleChange('isOnline', e.target.checked)}
                                />
                                <span>Онлайн занятие</span>
                            </label>
                        </div>

                        {formData.isOnline && (
                            <div className="form-group">
                                <label className="form-label">Ссылка на встречу</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://zoom.us/..."
                                    value={formData.meetingLink}
                                    onChange={(e) => handleChange('meetingLink', e.target.value)}
                                />
                            </div>
                        )}

                        {/* Статус и оплата */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Статус</label>
                                <select
                                    className="form-select"
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    <option value="scheduled">📅 Запланировано</option>
                                    <option value="completed">✅ Проведено</option>
                                    <option value="cancelled">❌ Отменено</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPaid}
                                        onChange={(e) => handleChange('isPaid', e.target.checked)}
                                    />
                                    <span>💳 Оплачено</span>
                                </label>
                            </div>
                        </div>

                        {/* Заметки */}
                        <div className="form-group">
                            <label className="form-label">Заметки</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Заметки о занятии..."
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Повторение (только для новых занятий) */}
                        {!lesson && (
                            <div className="form-group" style={{
                                padding: 'var(--space-4)',
                                background: 'rgba(99, 102, 241, 0.05)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px dashed var(--primary-200)'
                            }}>
                                <label className="form-checkbox" style={{ marginBottom: formData.repeat ? 'var(--space-3)' : 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.repeat}
                                        onChange={(e) => handleChange('repeat', e.target.checked)}
                                    />
                                    <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>🔄 Повторять каждую неделю</span>
                                </label>

                                {formData.repeat && (
                                    <div className="flex items-center gap-3" style={{ marginLeft: 'var(--space-6)', marginTop: 'var(--space-3)' }}>
                                        <span>Повторять:</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            style={{ width: '80px', padding: 'var(--space-1) var(--space-2)' }}
                                            min="1"
                                            max="52"
                                            value={formData.repeatCount}
                                            onChange={(e) => handleChange('repeatCount', parseInt(e.target.value) || 1)}
                                        />
                                        <select
                                            className="form-select"
                                            style={{ width: '130px', padding: 'var(--space-1) var(--space-4) var(--space-1) var(--space-2)' }}
                                            value={formData.repeatUnit}
                                            onChange={(e) => handleChange('repeatUnit', e.target.value)}
                                        >
                                            <option value="weeks">
                                                {pluralize(formData.repeatCount, ['неделю', 'недели', 'недель'])}
                                            </option>
                                            <option value="months">
                                                {pluralize(formData.repeatCount, ['месяц', 'месяца', 'месяцев'])}
                                            </option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        {lesson && (
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
                            {lesson ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LessonModal;
