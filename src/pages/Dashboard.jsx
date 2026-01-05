import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lessonsApi, studentsApi, statisticsApi } from '../db/database';
import ConfirmModal from '../components/UI/ConfirmModal';
import { pluralize, LESSON_FORMS, HOUR_FORMS } from '../utils/pluralize';

function Dashboard({ settings }) {
    const [todayLessons, setTodayLessons] = useState([]);
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [unpaidLessons, setUnpaidLessons] = useState([]);
    const [students, setStudents] = useState([]);
    const [weekStats, setWeekStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // State для модального окна подтверждения оплаты
    const [confirmPayment, setConfirmPayment] = useState({ isOpen: false, lesson: null });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            // Загрузка данных
            const [today, upcoming, unpaid, allStudents] = await Promise.all([
                lessonsApi.getToday(),
                lessonsApi.getUpcoming(5),
                lessonsApi.getUnpaid(),
                studentsApi.getAll()
            ]);

            // Статистика за неделю
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date();

            const stats = await statisticsApi.getForPeriod(weekStart, weekEnd);

            setTodayLessons(today);
            setUpcomingLessons(upcoming);
            setUnpaidLessons(unpaid);
            setStudents(allStudents);
            setWeekStats(stats);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    // Открыть модальное окно подтверждения оплаты
    function handleMarkAsPaid(lesson) {
        setConfirmPayment({ isOpen: true, lesson });
    }

    // Подтвердить оплату
    async function confirmMarkAsPaid() {
        const lesson = confirmPayment.lesson;
        if (!lesson) return;

        try {
            await lessonsApi.markAsPaid(lesson.id);
            setConfirmPayment({ isOpen: false, lesson: null });
            // Перезагружаем данные для обновления дашборда
            loadData();
        } catch (error) {
            console.error('Error marking lesson as paid:', error);
            alert('Ошибка при сохранении оплаты');
        }
    }

    // Отменить подтверждение
    function cancelMarkAsPaid() {
        setConfirmPayment({ isOpen: false, lesson: null });
    }

    // Получить имя ученика по ID
    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student?.name || 'Неизвестный';
    };

    // Получить информацию о предмете
    const getSubjectInfo = (subjectId) => {
        const subject = settings?.subjects?.find(s => s.id === subjectId);
        return subject || { name: subjectId, color: '#6366f1' };
    };

    // Форматирование времени начала-конца
    const formatTimeRange = (startTime, duration) => {
        if (!startTime) return '—';
        const [hours, minutes] = startTime.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + (duration || 60);
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        return `${startTime}–${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    };

    // Форматирование даты
    const formatDate = (date) => {
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Форматирование валюты
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Статистика недели
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Начало недели (пн)
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Фильтруем занятия этой недели
    const thisWeekLessons = [...todayLessons, ...upcomingLessons].filter(lesson => {
        const lessonDate = new Date(lesson.date);
        return lessonDate >= weekStart && lessonDate <= weekEnd && lesson.status !== 'cancelled';
    });

    // Расчёт статистики недели
    const weekPlannedCount = thisWeekLessons.length;
    const weekPlannedHours = thisWeekLessons.reduce((sum, l) => sum + (l.duration || 60) / 60, 0);
    const weekCompletedLessons = thisWeekLessons.filter(l => l.status === 'completed');
    const weekCompletedCount = weekCompletedLessons.length;
    const weekCompletedHours = weekCompletedLessons.reduce((sum, l) => sum + (l.duration || 60) / 60, 0);

    // Сумма неоплаченных занятий
    const unpaidTotal = unpaidLessons.reduce((sum, l) => sum + (l.price || 0), 0);

    if (loading) {
        return (
            <div className="animate-fade-in">
                <div className="page-header">
                    <h1 className="page-title">Загрузка...</h1>
                </div>
            </div>
        );
    }

    const today = new Date();
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };

    // Определяем приветствие в зависимости от времени суток
    const getGreeting = () => {
        const hour = today.getHours();
        if (hour < 6) return 'Доброй ночи';
        if (hour < 12) return 'Доброе утро';
        if (hour < 18) return 'Добрый день';
        return 'Добрый вечер';
    };

    // Формируем персонализированное приветствие
    const greeting = settings?.userName
        ? `${getGreeting()}, ${settings.userName}! 👋`
        : `${getGreeting()}! 👋`;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">{greeting}</h1>
                <p className="page-subtitle">
                    Сегодня {today.toLocaleDateString('ru-RU', dateOptions)}
                </p>
            </div>

            {/* Статистика */}
            <div className="grid grid-4 mb-6">
                <div className="card stat-card">
                    <div className="stat-card-icon primary">📚</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Занятий сегодня</div>
                        <div className="stat-card-value">{todayLessons.length}</div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon success">👨‍🎓</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Всего учеников</div>
                        <div className="stat-card-value">{students.length}</div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon info">⏱️</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Неделя</div>
                        <div className="stat-card-value" style={{ fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}>
                            <div>📅 Запланировано: {weekPlannedCount} {pluralize(weekPlannedCount, LESSON_FORMS)} ({Math.round(weekPlannedHours)} {pluralize(Math.round(weekPlannedHours), HOUR_FORMS)})</div>
                            <div>✅ Проведено: {weekCompletedCount} {pluralize(weekCompletedCount, LESSON_FORMS)} ({Math.round(weekCompletedHours)} {pluralize(Math.round(weekCompletedHours), HOUR_FORMS)})</div>
                        </div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon warning">💰</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Ожидает оплаты</div>
                        <div className="stat-card-value" style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.4 }}>
                            {unpaidLessons.length} {pluralize(unpaidLessons.length, LESSON_FORMS)}
                            <br />
                            {formatCurrency(unpaidTotal)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-2">
                {/* Занятия сегодня */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📅 Сегодня</h2>
                        <Link to="/calendar" className="btn btn-secondary btn-sm">
                            Календарь →
                        </Link>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {todayLessons.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <div className="empty-state-icon">🎉</div>
                                <div className="empty-state-title">Сегодня выходной!</div>
                                <div className="empty-state-text">Занятий не запланировано</div>
                            </div>
                        ) : (
                            <ul className="list">
                                {todayLessons.map(lesson => {
                                    const subject = getSubjectInfo(lesson.subject);
                                    const timeRange = formatTimeRange(lesson.startTime, lesson.duration);
                                    return (
                                        <li key={lesson.id} className="list-item">
                                            <div
                                                className="avatar"
                                                style={{
                                                    background: subject.color,
                                                    fontSize: 'var(--font-size-sm)',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {timeRange.split('–')[0]}
                                            </div>
                                            <div className="list-item-content">
                                                <div className="list-item-title">
                                                    {getStudentName(lesson.studentId)}
                                                </div>
                                                <div className="list-item-subtitle">
                                                    {subject.name}{lesson.topic ? `: ${lesson.topic}` : ''} • {timeRange}
                                                </div>
                                            </div>
                                            <span className={`badge ${lesson.status === 'completed' ? 'badge-success' : lesson.status === 'cancelled' ? 'badge-danger' : 'badge-primary'}`}>
                                                {lesson.status === 'completed' ? '✅ Проведено' : lesson.status === 'cancelled' ? '❌ Отменено' : '📅'}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Ближайшие занятия */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">⏰ Ближайшие занятия</h2>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {upcomingLessons.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <div className="empty-state-icon">📚</div>
                                <div className="empty-state-title">Нет предстоящих занятий</div>
                                <div className="empty-state-text">
                                    <Link to="/calendar" className="btn btn-primary btn-sm">
                                        + Добавить занятие
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <ul className="list">
                                {upcomingLessons.map(lesson => {
                                    const subject = getSubjectInfo(lesson.subject);
                                    const lessonDate = new Date(lesson.date);
                                    const timeRange = formatTimeRange(lesson.startTime, lesson.duration);
                                    return (
                                        <li key={lesson.id} className="list-item">
                                            <div
                                                className="avatar"
                                                style={{
                                                    background: subject.color,
                                                    fontSize: 'var(--font-size-xs)',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {lessonDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                            <div className="list-item-content">
                                                <div className="list-item-title">
                                                    {getStudentName(lesson.studentId)}
                                                </div>
                                                <div className="list-item-subtitle">
                                                    {subject.name}{lesson.topic ? `: ${lesson.topic}` : ''} • {formatDate(lessonDate)} • {timeRange}
                                                </div>
                                            </div>
                                            <span className="badge badge-primary">
                                                {timeRange}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Ожидают оплаты */}
            {
                unpaidLessons.length > 0 && (
                    <div className="card mt-6">
                        <div className="card-header">
                            <h2 className="card-title">💳 Ожидают оплаты</h2>
                            <span className="badge badge-warning">{unpaidLessons.length}</span>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <ul className="list">
                                {unpaidLessons.slice(0, 5).map(lesson => {
                                    const subject = getSubjectInfo(lesson.subject);
                                    const lessonDate = new Date(lesson.date);
                                    return (
                                        <li key={lesson.id} className="list-item">
                                            <input
                                                type="checkbox"
                                                className="checkbox"
                                                checked={false}
                                                onChange={() => handleMarkAsPaid(lesson)}
                                                title="Отметить как оплаченное"
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    marginRight: 'var(--space-3)',
                                                    accentColor: 'var(--color-success)'
                                                }}
                                            />
                                            <div
                                                className="avatar"
                                                style={{ background: subject.color }}
                                            >
                                                ₽
                                            </div>
                                            <div className="list-item-content">
                                                <div className="list-item-title">
                                                    {getStudentName(lesson.studentId)}
                                                </div>
                                                <div className="list-item-subtitle">
                                                    {subject.name} • {lessonDate.toLocaleDateString('ru-RU')}
                                                </div>
                                            </div>
                                            <span className="font-semibold text-primary">
                                                {formatCurrency(lesson.price)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        {unpaidLessons.length > 5 && (
                            <div className="card-footer text-center">
                                <Link to="/statistics" className="text-secondary">
                                    Показать все ({unpaidLessons.length})
                                </Link>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Модальное окно подтверждения оплаты */}
            <ConfirmModal
                isOpen={confirmPayment.isOpen}
                title="Подтверждение оплаты"
                message={confirmPayment.lesson ? (
                    <div>
                        <p style={{ marginBottom: 'var(--space-2)' }}>
                            <strong>Ученик:</strong> {getStudentName(confirmPayment.lesson.studentId)}
                        </p>
                        <p style={{ marginBottom: 'var(--space-2)' }}>
                            <strong>Дата:</strong> {new Date(confirmPayment.lesson.date).toLocaleDateString('ru-RU')}
                        </p>
                        <p style={{ marginBottom: 'var(--space-2)' }}>
                            <strong>Предмет:</strong> {getSubjectInfo(confirmPayment.lesson.subject).name}
                        </p>
                        <p>
                            <strong>Сумма:</strong> {formatCurrency(confirmPayment.lesson.price)}
                        </p>
                    </div>
                ) : ''}
                confirmText="Оплачено ✓"
                cancelText="Отмена"
                type="success"
                onConfirm={confirmMarkAsPaid}
                onCancel={cancelMarkAsPaid}
            />
        </div >
    );
}

export default Dashboard;
