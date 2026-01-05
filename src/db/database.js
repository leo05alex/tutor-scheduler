import Dexie from 'dexie';

// Создаём базу данных
export const db = new Dexie('TutorSchedulerDB');

// Определяем схему
db.version(1).stores({
    students: '++id, name, phone, email, createdAt',
    lessons: '++id, studentId, subject, date, startTime, status, isPaid',
    settings: 'id'
});

// Инициализация настроек по умолчанию
export async function initializeSettings() {
    const existingSettings = await db.settings.get(1);
    if (!existingSettings) {
        await db.settings.add({
            id: 1,
            // Патентная система налогообложения (ПСН)
            patentCost: 30000,          // Стоимость патента в год (руб.)
            patentValidFrom: null,      // Дата начала действия патента
            patentValidTo: null,        // Дата окончания действия патента

            // Настройки занятий
            defaultLessonDuration: 60,  // минуты
            defaultPrice: 1500,         // рубли
            workingHours: { start: '09:00', end: '21:00' },

            // Предметы
            subjects: [
                { id: 'russian', name: 'Русский язык', color: '#ef4444' },
                { id: 'literature', name: 'Литература', color: '#8b5cf6' },
                { id: 'english', name: 'Английский язык', color: '#3b82f6' },
                { id: 'spanish', name: 'Испанский язык', color: '#f59e0b' }
            ],

            // Темы для каждого предмета
            topics: {
                russian: ['Грамматика', 'Орфография', 'Пунктуация', 'Сочинение', 'ЕГЭ подготовка', 'ОГЭ подготовка'],
                literature: ['Русская классика', 'Зарубежная литература', 'Анализ текста', 'Сочинение'],
                english: ['Грамматика', 'Разговорный', 'Бизнес-английский', 'IELTS', 'TOEFL', 'Школьная программа'],
                spanish: ['Грамматика', 'Разговорный', 'DELE подготовка', 'Бизнес']
            },

            // Тема оформления
            theme: 'light'
        });
    }
    return db.settings.get(1);
}

// Хелперы для работы с данными

// Студенты
export const studentsApi = {
    getAll: () => db.students.toArray(),
    getById: (id) => db.students.get(id),
    add: (student) => db.students.add({
        ...student,
        createdAt: new Date()
    }),
    update: (id, changes) => db.students.update(id, changes),
    delete: (id) => db.students.delete(id),
    search: (query) => db.students
        .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
        .toArray()
};

// Занятия
export const lessonsApi = {
    getAll: () => db.lessons.toArray(),
    getById: (id) => db.lessons.get(id),

    getByDateRange: (startDate, endDate) => {
        return db.lessons
            .where('date')
            .between(startDate.toISOString(), endDate.toISOString(), true, true)
            .toArray();
    },

    getByStudent: (studentId) => db.lessons
        .where('studentId')
        .equals(studentId)
        .toArray(),

    getToday: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return db.lessons
            .filter(l => {
                const lessonDate = new Date(l.date);
                return lessonDate >= today && lessonDate < tomorrow;
            })
            .toArray();
    },

    getUpcoming: (limit = 5) => {
        const now = new Date();
        return db.lessons
            .filter(l => new Date(l.date) >= now && l.status === 'scheduled')
            .limit(limit)
            .toArray();
    },

    getUnpaid: () => db.lessons
        .filter(l => l.status !== 'cancelled' && !l.isPaid)
        .toArray(),

    add: (lesson) => db.lessons.add({
        ...lesson,
        createdAt: new Date()
    }),

    bulkAdd: (lessons) => {
        const lessonsWithTimestamp = lessons.map(l => ({
            ...l,
            createdAt: new Date()
        }));
        return db.lessons.bulkAdd(lessonsWithTimestamp);
    },

    update: (id, changes) => db.lessons.update(id, changes),
    delete: (id) => db.lessons.delete(id),

    markAsCompleted: (id) => db.lessons.update(id, { status: 'completed' }),
    markAsPaid: (id) => db.lessons.update(id, { isPaid: true }),
    markAsCancelled: (id) => db.lessons.update(id, { status: 'cancelled' })
};

// Настройки
export const settingsApi = {
    get: () => db.settings.get(1),
    update: (changes) => db.settings.update(1, changes)
};

// Статистика
export const statisticsApi = {
    // Получить статистику за период
    getForPeriod: async (startDate, endDate) => {
        const lessons = await db.lessons
            .filter(l => {
                const date = new Date(l.date);
                return date >= startDate && date <= endDate && l.status === 'completed';
            })
            .toArray();

        const students = await db.students.toArray();
        const studentMap = new Map(students.map(s => [s.id, s]));

        // Подсчёт по предметам
        const subjectStats = {};
        const studentStats = {};
        const topicStats = {};
        let totalHours = 0;
        let totalEarnings = 0;
        let paidAmount = 0;

        for (const lesson of lessons) {
            // По предметам
            if (!subjectStats[lesson.subject]) {
                subjectStats[lesson.subject] = { count: 0, hours: 0, earnings: 0 };
            }
            subjectStats[lesson.subject].count++;
            subjectStats[lesson.subject].hours += lesson.duration / 60;
            subjectStats[lesson.subject].earnings += lesson.price || 0;

            // По ученикам
            const studentId = lesson.studentId;
            if (!studentStats[studentId]) {
                const student = studentMap.get(studentId);
                studentStats[studentId] = {
                    name: student?.name || 'Неизвестный',
                    count: 0,
                    hours: 0,
                    earnings: 0
                };
            }
            studentStats[studentId].count++;
            studentStats[studentId].hours += lesson.duration / 60;
            studentStats[studentId].earnings += lesson.price || 0;

            // По темам
            if (lesson.topic) {
                if (!topicStats[lesson.topic]) {
                    topicStats[lesson.topic] = { count: 0, subject: lesson.subject };
                }
                topicStats[lesson.topic].count++;
            }

            // Общие показатели
            totalHours += lesson.duration / 60;
            totalEarnings += lesson.price || 0;
            if (lesson.isPaid) {
                paidAmount += lesson.price || 0;
            }
        }

        return {
            totalLessons: lessons.length,
            totalHours,
            totalEarnings,
            paidAmount,
            unpaidAmount: totalEarnings - paidAmount,
            subjectStats,
            studentStats,
            topicStats
        };
    },

    // Финансовая статистика с учётом патента
    getFinancials: async (year) => {
        const settings = await db.settings.get(1);
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const lessons = await db.lessons
            .filter(l => {
                const date = new Date(l.date);
                return date >= startOfYear && date <= endOfYear && l.status === 'completed';
            })
            .toArray();

        const totalEarnings = lessons.reduce((sum, l) => sum + (l.price || 0), 0);
        const paidAmount = lessons.filter(l => l.isPaid).reduce((sum, l) => sum + (l.price || 0), 0);
        const patentCost = settings?.patentCost || 0;

        return {
            year,
            totalEarnings,
            paidAmount,
            unpaidAmount: totalEarnings - paidAmount,
            patentCost,
            netIncome: totalEarnings - patentCost,
            lessonsCount: lessons.length
        };
    }
};

export default db;
