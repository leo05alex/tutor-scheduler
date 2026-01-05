import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { lessonsApi, studentsApi } from '../db/database';
import LessonModal from '../components/Forms/LessonModal';

function Calendar({ settings, onUpdateSettings }) {
    const [lessons, setLessons] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const calendarRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [allLessons, allStudents] = await Promise.all([
            lessonsApi.getAll(),
            studentsApi.getAll()
        ]);
        setLessons(allLessons);
        setStudents(allStudents);
    }

    // Получить имя ученика
    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student?.name || 'Неизвестный';
    };

    // Получить информацию об ученике
    const getStudentInfo = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student || { name: 'Неизвестный', color: '#6366f1' };
    };

    // Получить информацию о предмете
    const getSubjectInfo = (subjectId) => {
        const subject = settings?.subjects?.find(s => s.id === subjectId);
        return subject || { name: subjectId, color: '#6366f1' };
    };

    // Преобразование занятий в события календаря
    const calendarEvents = lessons.map(lesson => {
        const student = getStudentInfo(lesson.studentId);
        const subject = getSubjectInfo(lesson.subject);
        const startDateTime = new Date(lesson.date);
        if (lesson.startTime) {
            const [hours, minutes] = lesson.startTime.split(':');
            startDateTime.setHours(parseInt(hours), parseInt(minutes));
        }

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + (lesson.duration || 60));

        // Используем цвет ученика если он есть, иначе цвет предмета
        const eventColor = student.color || subject.color;

        // Иконка статуса
        let statusIcon = '';
        if (lesson.status === 'cancelled') {
            statusIcon = '❌ ';
        } else if (lesson.status === 'completed') {
            statusIcon = '✓ ';
        }
        // Для scheduled (запланированных) — без иконки статуса

        // Иконка оплаты (показываем для всех занятий, кроме отменённых)
        let paymentIcon = '';
        if (lesson.status !== 'cancelled') {
            paymentIcon = lesson.isPaid ? ' 💰' : ' 💳';
        }

        const topicText = lesson.topic ? `: ${lesson.topic}` : '';

        // Определяем CSS классы для разных статусов
        const classNames = [];
        if (lesson.status === 'cancelled') {
            classNames.push('event-cancelled');
        } else if (lesson.status === 'completed') {
            classNames.push('event-completed');
        } else {
            classNames.push('event-scheduled');
        }

        // Формат: ✓ Имя • Предмет: Тема 💳
        return {
            id: lesson.id,
            title: `${statusIcon}${student.name} • ${subject.name}${topicText}${paymentIcon}`,
            start: startDateTime,
            end: endDateTime,
            backgroundColor: eventColor,
            borderColor: eventColor,
            textColor: '#ffffff',
            classNames,
            extendedProps: {
                lesson,
                subject,
                student,
                studentName: student.name
            }
        };
    });

    // Клик по дате — создать новое занятие
    const handleDateClick = (info) => {
        setSelectedDate(info.date);
        setSelectedLesson(null);
        setShowModal(true);
    };

    // Клик по событию — редактировать занятие
    const handleEventClick = (info) => {
        setSelectedLesson(info.event.extendedProps.lesson);
        setSelectedDate(null);
        setShowModal(true);
    };

    // Перетаскивание события
    const handleEventDrop = async (info) => {
        const lesson = info.event.extendedProps.lesson;
        const newDate = info.event.start;
        const newTime = `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`;

        await lessonsApi.update(lesson.id, {
            date: newDate.toISOString(),
            startTime: newTime
        });

        loadData();
    };

    // Изменение размера события (растягивание для изменения длительности)
    const handleEventResize = async (info) => {
        const lesson = info.event.extendedProps.lesson;
        const start = info.event.start;
        const end = info.event.end;

        // Вычисляем новую длительность в минутах
        const durationMs = end.getTime() - start.getTime();
        const durationMinutes = Math.round(durationMs / (1000 * 60));

        await lessonsApi.update(lesson.id, {
            duration: durationMinutes
        });

        loadData();
    };

    // Сохранение занятия
    const handleSaveLesson = async (lessonData) => {
        try {
            if (selectedLesson) {
                await lessonsApi.update(selectedLesson.id, lessonData);
            } else {
                // Создаем основное занятие
                const mainLessonId = await lessonsApi.add(lessonData);

                // Если выбрано повторение, создаем будущие копии
                if (lessonData.repeat) {
                    const futureLessons = [];
                    const weeksCount = lessonData.repeatPeriod === 'year' ? 51 : 3; // +3 недели для месяца, +51 для года

                    const startDate = new Date(lessonData.date);

                    for (let i = 1; i <= weeksCount; i++) {
                        const futureDate = new Date(startDate);
                        futureDate.setDate(startDate.getDate() + (i * 7));

                        futureLessons.push({
                            ...lessonData,
                            date: futureDate.toISOString(),
                            repeat: false, // Копии не должны быть "повторяющимися" сами по себе
                            isPaid: false, // Будущие занятия по умолчанию не оплачены
                            status: 'scheduled', // Будущие занятия всегда имеют статус "Запланировано"
                            notes: '' // Заметки не копируются в будущие занятия
                        });
                    }

                    if (futureLessons.length > 0) {
                        await lessonsApi.bulkAdd(futureLessons);
                    }
                }
            }
            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('Ошибка при сохранении занятия');
        }
    };

    // Удаление занятия
    const handleDeleteLesson = async () => {
        if (selectedLesson) {
            await lessonsApi.delete(selectedLesson.id);
            setShowModal(false);
            loadData();
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">📅 Календарь</h1>
                    <p className="page-subtitle">Управление расписанием занятий</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setSelectedDate(new Date());
                        setSelectedLesson(null);
                        setShowModal(true);
                    }}
                >
                    + Новое занятие
                </button>
            </div>

            {/* Легенда предметов */}
            <div className="card mb-6">
                <div className="card-body flex gap-4" style={{ padding: 'var(--space-3) var(--space-4)', flexWrap: 'wrap' }}>
                    {settings?.subjects?.map(subject => (
                        <div key={subject.id} className="flex items-center gap-2">
                            <div
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 3,
                                    background: subject.color
                                }}
                            />
                            <span style={{ fontSize: 'var(--font-size-sm)' }}>{subject.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Календарь */}
            <div className="card">
                <div className="card-body">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        locale="ru"
                        firstDay={1}
                        slotMinTime="08:00:00"
                        slotMaxTime="22:00:00"
                        allDaySlot={false}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        events={calendarEvents}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        height="auto"
                        buttonText={{
                            today: 'Сегодня',
                            month: 'Месяц',
                            week: 'Неделя',
                            day: 'День'
                        }}
                    />
                </div>
            </div>

            <LessonModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                lesson={selectedLesson}
                selectedDate={selectedDate}
                students={students}
                settings={settings}
                onSave={handleSaveLesson}
                onDelete={handleDeleteLesson}
                onUpdateSettings={onUpdateSettings}
            />
        </div>
    );
}

export default Calendar;
