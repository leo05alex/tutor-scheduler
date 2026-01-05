import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { statisticsApi, studentsApi, lessonsApi } from '../db/database';
import { pluralize, LESSON_FORMS, TIME_FORMS } from '../utils/pluralize';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function Statistics({ settings }) {
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState(null);
    const [financials, setFinancials] = useState(null);
    const [students, setStudents] = useState([]);
    const [unpaidLessons, setUnpaidLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [period]);

    async function loadStats() {
        setLoading(true);
        try {
            const { startDate, endDate } = getPeriodDates(period);
            const [periodStats, yearFinancials, allStudents, unpaid] = await Promise.all([
                statisticsApi.getForPeriod(startDate, endDate),
                statisticsApi.getFinancials(new Date().getFullYear()),
                studentsApi.getAll(),
                lessonsApi.getUnpaid()
            ]);

            setStats(periodStats);
            setFinancials(yearFinancials);
            setStudents(allStudents);
            setUnpaidLessons(unpaid);
        } catch (error) {
            console.error('Error loading statistics:', error);
        } finally {
            setLoading(false);
        }
    }

    // Получить даты периода
    function getPeriodDates(period) {
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(endDate.getMonth() - 1);
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate };
    }

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

    // Получить цвет ученика
    const getStudentColor = (studentId) => {
        const student = students.find(s => s.id === parseInt(studentId));
        return student?.color || '#6366f1';
    };

    // Расчёт неоплаченной суммы
    const totalUnpaid = unpaidLessons.reduce((sum, l) => sum + (l.price || 0), 0);

    // Получить данные о налогах для конкретного года
    const getTaxDataForYear = (year) => {
        const records = settings?.taxRecords || [];
        return records.find(r => r.year === year) || {
            year,
            patentCost: 0,
            insuranceCost: 0,
            taxRate: 6
        };
    };

    // Расчёт налоговой нагрузки в зависимости от системы
    const calculateTaxBurden = (earnings, year) => {
        const taxSystem = settings?.taxSystem || 'patent';
        const taxData = getTaxDataForYear(year);

        if (taxSystem === 'none') {
            return { taxAmount: 0, insuranceCost: 0, total: 0, description: 'Без налогов' };
        }

        if (taxSystem === 'patent') {
            const total = (taxData.patentCost || 0) + (taxData.insuranceCost || 0);
            return {
                taxAmount: taxData.patentCost || 0,
                insuranceCost: taxData.insuranceCost || 0,
                total,
                description: 'Патент + Страховые'
            };
        }

        if (taxSystem === 'usn') {
            const taxRate = taxData.taxRate || 6;
            const taxAmount = Math.round(earnings * taxRate / 100);
            const total = taxAmount + (taxData.insuranceCost || 0);
            return {
                taxAmount,
                insuranceCost: taxData.insuranceCost || 0,
                taxRate,
                total,
                description: `УСН ${taxRate}% + Страховые`
            };
        }

        if (taxSystem === 'self-employed') {
            const taxRate = taxData.taxRate || 4;
            const taxAmount = Math.round(earnings * taxRate / 100);
            return {
                taxAmount,
                insuranceCost: taxData.insuranceCost || 0, // Добровольные
                taxRate,
                total: taxAmount + (taxData.insuranceCost || 0),
                description: `НПД ${taxRate}%`
            };
        }

        return { taxAmount: 0, insuranceCost: 0, total: 0, description: 'Не указано' };
    };

    // Текущий год для финансового отчёта
    const currentYear = new Date().getFullYear();
    const yearTaxData = getTaxDataForYear(currentYear);
    const taxBurden = calculateTaxBurden(financials?.totalEarnings || 0, currentYear);

    // Данные для pie chart предметов
    const subjectChartData = stats ? {
        labels: Object.keys(stats.subjectStats).map(id => getSubjectInfo(id).name),
        datasets: [{
            data: Object.values(stats.subjectStats).map(s => s.count),
            backgroundColor: Object.keys(stats.subjectStats).map(id => getSubjectInfo(id).color),
            borderWidth: 0
        }]
    } : null;

    // Данные для bar chart учеников (с индивидуальными цветами)
    const studentChartData = stats ? {
        labels: Object.entries(stats.studentStats).map(([id, s]) => s.name).slice(0, 10),
        datasets: [{
            label: 'Часов',
            data: Object.entries(stats.studentStats).map(([id, s]) => s.hours).slice(0, 10),
            backgroundColor: Object.entries(stats.studentStats).map(([studentId]) => getStudentColor(studentId)).slice(0, 10),
            borderRadius: 8
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: { family: 'Inter' }
                }
            }
        }
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
                grid: { display: false }
            }
        }
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
                    <h1 className="page-title">📈 Статистика</h1>
                    <p className="page-subtitle">Аналитика занятий и финансов</p>
                </div>
                <div className="flex gap-2">
                    {['week', 'month', 'quarter', 'year'].map(p => (
                        <button
                            key={p}
                            className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setPeriod(p)}
                        >
                            {{ week: 'Неделя', month: 'Месяц', quarter: 'Квартал', year: 'Год' }[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Основные показатели */}
            <div className="grid grid-4 mb-6">
                <div className="card stat-card">
                    <div className="stat-card-icon primary">📚</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Занятий проведено</div>
                        <div className="stat-card-value">{stats?.totalLessons || 0}</div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon info">⏱️</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Всего часов</div>
                        <div className="stat-card-value">{stats?.totalHours?.toFixed(1) || 0}</div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon success">💰</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Заработано</div>
                        <div className="stat-card-value">{formatCurrency(stats?.totalEarnings)}</div>
                    </div>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-icon warning">💳</div>
                    <div className="stat-card-content">
                        <div className="stat-card-label">Не оплачено</div>
                        <div className="stat-card-value">{formatCurrency(totalUnpaid)}</div>
                        <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                            {unpaidLessons.length} {pluralize(unpaidLessons.length, LESSON_FORMS)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-2 mb-6">
                {/* Популярность предметов */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📊 Популярность предметов</h2>
                    </div>
                    <div className="card-body">
                        {subjectChartData && subjectChartData.labels.length > 0 ? (
                            <div style={{ maxWidth: 300, margin: '0 auto' }}>
                                <Pie data={subjectChartData} options={chartOptions} />
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-text">Нет данных за выбранный период</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Часы по ученикам */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">👨‍🎓 Часы по ученикам</h2>
                    </div>
                    <div className="card-body">
                        {studentChartData && studentChartData.labels.length > 0 ? (
                            <Bar data={studentChartData} options={barOptions} />
                        ) : (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <div className="empty-state-icon">👨‍🎓</div>
                                <div className="empty-state-text">Нет данных за выбранный период</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Финансовый отчёт за год */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">💼 Финансовый отчёт за {currentYear} год</h2>
                    <span className="badge badge-info">{taxBurden.description}</span>
                </div>
                <div className="card-body">
                    {/* Основные показатели */}
                    <div className="grid grid-4">
                        <div className="text-center">
                            <div className="text-tertiary mb-2" style={{ fontSize: 'var(--font-size-sm)' }}>
                                Валовый доход
                            </div>
                            <div className="font-bold" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--success-500)' }}>
                                {formatCurrency(financials?.totalEarnings)}
                            </div>
                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                {financials?.lessonsCount || 0} {pluralize(financials?.lessonsCount || 0, LESSON_FORMS)}
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-tertiary mb-2" style={{ fontSize: 'var(--font-size-sm)' }}>
                                Получено
                            </div>
                            <div className="font-bold" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--primary-500)' }}>
                                {formatCurrency(financials?.paidAmount)}
                            </div>
                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                фактически
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-tertiary mb-2" style={{ fontSize: 'var(--font-size-sm)' }}>
                                Расходы (налоги)
                            </div>
                            <div className="font-bold" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--warning-500)' }}>
                                {formatCurrency(taxBurden.total)}
                            </div>
                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                в год
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-tertiary mb-2" style={{ fontSize: 'var(--font-size-sm)' }}>
                                Чистый доход
                            </div>
                            <div className="font-bold" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--success-600)' }}>
                                {formatCurrency((financials?.paidAmount || 0) - taxBurden.total)}
                            </div>
                            <div className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                после налогов
                            </div>
                        </div>
                    </div>

                    {/* Детализация расходов */}
                    {settings?.taxSystem !== 'none' && (
                        <div
                            className="mt-6"
                            style={{
                                padding: 'var(--space-4)',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)'
                            }}
                        >
                            <h4 className="font-semibold mb-3">📊 Детализация расходов за {currentYear} год</h4>
                            <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
                                {/* Налог/Патент */}
                                <div style={{
                                    padding: 'var(--space-3)',
                                    background: 'var(--bg-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        {settings?.taxSystem === 'patent' ? '📜 Патент' :
                                            settings?.taxSystem === 'usn' ? '📊 УСН' :
                                                settings?.taxSystem === 'self-employed' ? '👤 НПД' : 'Налог'}
                                    </div>
                                    <div className="font-semibold" style={{ fontSize: 'var(--font-size-lg)' }}>
                                        {formatCurrency(taxBurden.taxAmount)}
                                    </div>
                                    {taxBurden.taxRate && (
                                        <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                            {taxBurden.taxRate}% от дохода
                                        </div>
                                    )}
                                </div>

                                {/* Страховые взносы */}
                                <div style={{
                                    padding: 'var(--space-3)',
                                    background: 'var(--bg-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        🏥 Страховые взносы
                                    </div>
                                    <div className="font-semibold" style={{ fontSize: 'var(--font-size-lg)' }}>
                                        {formatCurrency(taxBurden.insuranceCost)}
                                    </div>
                                    <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        ПФР + ОМС
                                    </div>
                                </div>

                                {/* Итого */}
                                <div style={{
                                    padding: 'var(--space-3)',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--warning-500)'
                                }}>
                                    <div className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        💰 Итого расходы
                                    </div>
                                    <div className="font-semibold" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--warning-600)' }}>
                                        {formatCurrency(taxBurden.total)}
                                    </div>
                                    <div className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        за год
                                    </div>
                                </div>
                            </div>

                            {/* Предупреждение если нет данных за год */}
                            {yearTaxData.patentCost === 0 && yearTaxData.insuranceCost === 0 && (
                                <div
                                    className="mt-4"
                                    style={{
                                        padding: 'var(--space-3)',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: 'var(--font-size-sm)'
                                    }}
                                >
                                    ⚠️ Нет данных о расходах за {currentYear} год.
                                    <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ color: 'var(--primary-500)', marginLeft: 4 }}>
                                        Добавьте в Настройках → Финансы
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Популярные темы */}
            {stats && Object.keys(stats.topicStats).length > 0 && (
                <div className="card mt-6">
                    <div className="card-header">
                        <h2 className="card-title">📝 Популярные темы</h2>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <ul className="list">
                            {Object.entries(stats.topicStats)
                                .sort((a, b) => b[1].count - a[1].count)
                                .slice(0, 10)
                                .map(([topic, data]) => {
                                    const subject = getSubjectInfo(data.subject);
                                    return (
                                        <li key={topic} className="list-item">
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${subject.color}20`,
                                                    color: subject.color
                                                }}
                                            >
                                                {subject.name}
                                            </span>
                                            <div className="list-item-content">
                                                <div className="list-item-title">{topic}</div>
                                            </div>
                                            <span className="font-semibold">{data.count} раз</span>
                                        </li>
                                    );
                                })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Statistics;
