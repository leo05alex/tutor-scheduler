import { useState, useEffect } from 'react';
import { studentsApi, lessonsApi } from '../db/database';
import StudentModal from '../components/Forms/StudentModal';
import { pluralize, STUDENT_FORMS, LESSON_FORMS, HOUR_FORMS } from '../utils/pluralize';

function Students({ settings }) {
    const [students, setStudents] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [allStudents, allLessons] = await Promise.all([
                studentsApi.getAll(),
                lessonsApi.getAll()
            ]);
            setStudents(allStudents);
            setLessons(allLessons);
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    }

    // Фильтрация студентов
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.phone?.includes(searchQuery) ||
            student.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSubject = !filterSubject || student.subjects?.includes(filterSubject);

        return matchesSearch && matchesSubject;
    });

    // Подсчёт статистики по ученику
    const getStudentStats = (studentId) => {
        const studentLessons = lessons.filter(l => l.studentId === studentId);
        const completed = studentLessons.filter(l => l.status === 'completed');
        const totalHours = completed.reduce((sum, l) => sum + (l.duration || 60) / 60, 0);
        const totalEarned = completed.reduce((sum, l) => sum + (l.price || 0), 0);
        const unpaid = completed.filter(l => !l.isPaid).reduce((sum, l) => sum + (l.price || 0), 0);

        return {
            totalLessons: studentLessons.length,
            completedLessons: completed.length,
            totalHours: totalHours.toFixed(1),
            totalEarned,
            unpaid
        };
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

    // Сохранение студента
    const handleSaveStudent = async (studentData) => {
        if (selectedStudent) {
            await studentsApi.update(selectedStudent.id, studentData);
        } else {
            await studentsApi.add(studentData);
        }
        setShowModal(false);
        loadData();
    };

    // Удаление студента
    const handleDeleteStudent = async () => {
        if (selectedStudent) {
            await studentsApi.delete(selectedStudent.id);
            setShowModal(false);
            loadData();
        }
    };

    // Инициалы для аватара
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className="animate-fade-in">
                <div className="page-header">
                    <h1 className="page-title">Загрузка...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">👨‍🎓 Ученики</h1>
                    <p className="page-subtitle">
                        Всего: {students.length} {pluralize(students.length, STUDENT_FORMS)}
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setSelectedStudent(null);
                        setShowModal(true);
                    }}
                >
                    + Добавить ученика
                </button>
            </div>

            {/* Поиск и фильтры */}
            <div className="card mb-6">
                <div className="card-body flex gap-4" style={{ flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="🔍 Поиск по имени, телефону, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ minWidth: 200 }}>
                        <select
                            className="form-select"
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                        >
                            <option value="">Все предметы</option>
                            {settings?.subjects?.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Список учеников */}
            {filteredStudents.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">👨‍🎓</div>
                        <div className="empty-state-title">
                            {searchQuery || filterSubject ? 'Ничего не найдено' : 'Нет учеников'}
                        </div>
                        <div className="empty-state-text">
                            {searchQuery || filterSubject
                                ? 'Попробуйте изменить параметры поиска'
                                : 'Добавьте первого ученика для начала работы'
                            }
                        </div>
                        {!searchQuery && !filterSubject && (
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSelectedStudent(null);
                                    setShowModal(true);
                                }}
                            >
                                + Добавить ученика
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-2">
                    {filteredStudents.map(student => {
                        const stats = getStudentStats(student.id);
                        return (
                            <div
                                key={student.id}
                                className="card"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setSelectedStudent(student);
                                    setShowModal(true);
                                }}
                            >
                                <div className="card-body">
                                    <div className="flex gap-4 items-center mb-4">
                                        <div className="avatar avatar-lg" style={{ background: student.color || 'var(--gradient-primary)' }}>
                                            {getInitials(student.name)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 className="font-semibold" style={{ marginBottom: 4 }}>
                                                {student.name}
                                            </h3>
                                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                                {student.phone && <span>📱 {student.phone}</span>}
                                                {student.email && <span style={{ marginLeft: 12 }}>✉️ {student.email}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Предметы */}
                                    <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
                                        {student.subjects?.map(subjectId => {
                                            const subject = getSubjectInfo(subjectId);
                                            return (
                                                <span
                                                    key={subjectId}
                                                    className="badge"
                                                    style={{
                                                        background: `${subject.color}20`,
                                                        color: subject.color
                                                    }}
                                                >
                                                    {subject.name}
                                                </span>
                                            );
                                        })}
                                        {student.level && (
                                            <span className="badge badge-info">{student.level}</span>
                                        )}
                                    </div>

                                    {/* Статистика */}
                                    <div className="grid grid-3" style={{ gap: 'var(--space-3)' }}>
                                        <div className="text-center">
                                            <div className="font-semibold">{stats.completedLessons}</div>
                                            <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                                {pluralize(stats.completedLessons, LESSON_FORMS)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold">{stats.totalHours}ч</div>
                                            <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                                {pluralize(Math.round(parseFloat(stats.totalHours)), HOUR_FORMS)}
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold">{formatCurrency(stats.totalEarned)}</div>
                                            <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                                заработано
                                            </div>
                                        </div>
                                    </div>

                                    {/* Задолженность */}
                                    {stats.unpaid > 0 && (
                                        <div
                                            className="mt-4"
                                            style={{
                                                padding: 'var(--space-3)',
                                                background: 'rgba(234, 179, 8, 0.1)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: 'var(--font-size-sm)'
                                            }}
                                        >
                                            <span className="text-warning">💳 Задолженность: {formatCurrency(stats.unpaid)}</span>
                                        </div>
                                    )}

                                    {/* Заметки */}
                                    {student.notes && (
                                        <div
                                            className="mt-4 text-secondary"
                                            style={{
                                                fontSize: 'var(--font-size-sm)',
                                                fontStyle: 'italic'
                                            }}
                                        >
                                            📝 {student.notes.substring(0, 100)}{student.notes.length > 100 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <StudentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                student={selectedStudent}
                settings={settings}
                onSave={handleSaveStudent}
                onDelete={handleDeleteStudent}
                studentLessons={selectedStudent ? lessons.filter(l => l.studentId === selectedStudent.id) : []}
                allStudents={students}
            />
        </div>
    );
}

export default Students;
