import { useState, useRef } from 'react';
import { exportData, importData, clearAllData } from '../utils/exportImport';
import ConfirmModal from '../components/UI/ConfirmModal';

function Settings({ settings, onUpdateSettings }) {
    const [activeTab, setActiveTab] = useState('general');
    const [showConfirmClear, setShowConfirmClear] = useState(false);
    const [message, setMessage] = useState(null);
    const fileInputRef = useRef(null);

    // Модальное окно подтверждения
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Форматирование валюты
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Показать сообщение
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    // Экспорт данных
    const handleExport = async () => {
        const result = await exportData();
        showMessage(result.message, result.success ? 'success' : 'error');
    };

    // Импорт данных
    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const result = await importData(file);
            showMessage(result.message, result.success ? 'success' : 'error');
            if (result.success) {
                window.location.reload();
            }
        }
    };

    // Очистка всех данных
    const handleClearData = async () => {
        const result = await clearAllData();
        showMessage(result.message, result.success ? 'success' : 'error');
        setShowConfirmClear(false);
        if (result.success) {
            window.location.reload();
        }
    };

    // Переключение темы
    const handleThemeChange = (theme) => {
        onUpdateSettings({ theme });
    };

    // Обновление стоимости патента
    const handlePatentCostChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        onUpdateSettings({ patentCost: value });
    };

    // Обновление настроек занятий
    const handleDefaultPriceChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        onUpdateSettings({ defaultPrice: value });
    };

    const handleDefaultDurationChange = (e) => {
        const value = parseInt(e.target.value) || 60;
        onUpdateSettings({ defaultLessonDuration: value });
    };

    const tabs = [
        { id: 'general', label: '⚙️ Общие', icon: '⚙️' },
        { id: 'lessons', label: '📚 Занятия', icon: '📚' },
        { id: 'subjects', label: '📖 Предметы', icon: '📖' },
        { id: 'finance', label: '💰 Финансы', icon: '💰' },
        { id: 'data', label: '💾 Данные', icon: '💾' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">⚙️ Настройки</h1>
                <p className="page-subtitle">Управление приложением</p>
            </div>

            {/* Сообщение */}
            {message && (
                <div
                    className={`card mb-4`}
                    style={{
                        background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        borderColor: message.type === 'success' ? 'var(--success-500)' : 'var(--danger-500)'
                    }}
                >
                    <div className="card-body" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {message.type === 'success' ? '✅' : '❌'} {message.text}
                    </div>
                </div>
            )}

            <div className="card">
                {/* Табы */}
                <div className="card-header" style={{ padding: 0, borderBottom: 'none' }}>
                    <div className="flex" style={{ borderBottom: '1px solid var(--border-color)', width: '100%', overflowX: 'auto' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`btn ${activeTab === tab.id ? '' : 'btn-secondary'}`}
                                style={{
                                    borderRadius: 0,
                                    borderBottom: activeTab === tab.id ? '2px solid var(--primary-500)' : 'none',
                                    background: activeTab === tab.id ? 'transparent' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--primary-500)' : 'var(--text-secondary)',
                                    fontWeight: activeTab === tab.id ? 600 : 400
                                }}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card-body">
                    {/* Общие настройки */}
                    {activeTab === 'general' && (
                        <div>
                            <h3 className="font-semibold mb-4">👤 Профиль пользователя</h3>

                            <div className="form-group">
                                <label className="form-label">Ваше имя</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Как к вам обращаться?"
                                    value={settings?.userName || ''}
                                    onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                                />
                                <p className="text-tertiary mt-1" style={{ fontSize: 'var(--font-size-xs)' }}>
                                    Будет использоваться для персонализированного приветствия
                                </p>
                            </div>

                            <hr style={{ borderColor: 'var(--border-color)', margin: 'var(--space-6) 0' }} />

                            <h3 className="font-semibold mb-4">Внешний вид</h3>

                            <div className="form-group">
                                <label className="form-label">Тема оформления</label>
                                <div className="flex gap-3">
                                    <button
                                        className={`btn ${settings?.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleThemeChange('light')}
                                    >
                                        ☀️ Светлая
                                    </button>
                                    <button
                                        className={`btn ${settings?.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleThemeChange('dark')}
                                    >
                                        🌙 Тёмная
                                    </button>
                                </div>
                            </div>

                            <div className="form-group mt-6">
                                <label className="form-label">Рабочие часы</label>
                                <div className="form-row">
                                    <div>
                                        <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Начало</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={settings?.workingHours?.start || '09:00'}
                                            onChange={(e) => onUpdateSettings({
                                                workingHours: { ...settings.workingHours, start: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>Окончание</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={settings?.workingHours?.end || '21:00'}
                                            onChange={(e) => onUpdateSettings({
                                                workingHours: { ...settings.workingHours, end: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Настройки занятий */}
                    {activeTab === 'lessons' && (
                        <div>
                            <h3 className="font-semibold mb-4">Параметры по умолчанию</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Длительность занятия (мин)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={settings?.defaultLessonDuration || 60}
                                        onChange={handleDefaultDurationChange}
                                        min="15"
                                        max="180"
                                        step="15"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Стоимость занятия (₽)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={settings?.defaultPrice || 1500}
                                        onChange={handleDefaultPriceChange}
                                        min="0"
                                        step="100"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Предметы */}
                    {activeTab === 'subjects' && (
                        <div>
                            <h3 className="font-semibold mb-4">Преподаваемые предметы</h3>

                            {/* Список предметов */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                {settings?.subjects?.map((subject, index) => (
                                    <div
                                        key={subject.id}
                                        className="flex items-center gap-3"
                                        style={{
                                            padding: 'var(--space-3)',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--space-2)'
                                        }}
                                    >
                                        <input
                                            type="color"
                                            value={subject.color}
                                            onChange={(e) => {
                                                const newSubjects = [...settings.subjects];
                                                newSubjects[index] = { ...subject, color: e.target.value };
                                                onUpdateSettings({ subjects: newSubjects });
                                            }}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={subject.name}
                                            onChange={(e) => {
                                                const newSubjects = [...settings.subjects];
                                                newSubjects[index] = { ...subject, name: e.target.value };
                                                onUpdateSettings({ subjects: newSubjects });
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => {
                                                setConfirmModal({
                                                    isOpen: true,
                                                    title: `Удалить предмет "${subject.name}"?`,
                                                    message: 'Предмет будет удалён из списка. Занятия с этим предметом останутся, но предмет больше не будет доступен для выбора.',
                                                    onConfirm: () => {
                                                        const newSubjects = settings.subjects.filter((_, i) => i !== index);
                                                        onUpdateSettings({ subjects: newSubjects });
                                                        setConfirmModal({ ...confirmModal, isOpen: false });
                                                    }
                                                });
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Добавить предмет */}
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
                                    const usedColors = settings?.subjects?.map(s => s.color) || [];
                                    const availableColor = colors.find(c => !usedColors.includes(c)) || '#6366f1';
                                    const newSubject = {
                                        id: `subject_${Date.now()}`,
                                        name: 'Новый предмет',
                                        color: availableColor
                                    };
                                    onUpdateSettings({
                                        subjects: [...(settings?.subjects || []), newSubject]
                                    });
                                }}
                            >
                                + Добавить предмет
                            </button>

                            <p className="text-tertiary mt-4 mb-6" style={{ fontSize: 'var(--font-size-sm)' }}>
                                💡 Нажмите на цветной квадрат, чтобы изменить цвет предмета
                            </p>

                            {/* Словарь тем */}
                            <h3 className="font-semibold mb-4" style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-6)' }}>
                                📚 Словарь тем занятий
                            </h3>
                            <p className="text-secondary mb-4" style={{ fontSize: 'var(--font-size-sm)' }}>
                                Темы, которые вы сохранили, появятся как подсказки при создании занятия.
                            </p>

                            {settings?.subjects?.map(subject => {
                                const topics = settings?.topics?.[subject.id] || [];
                                if (topics.length === 0) return null;

                                return (
                                    <div key={subject.id} className="mb-4">
                                        <div
                                            className="flex items-center gap-2 mb-2"
                                            style={{
                                                padding: 'var(--space-2) var(--space-3)',
                                                background: `${subject.color}20`,
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: `3px solid ${subject.color}`
                                            }}
                                        >
                                            <span className="font-medium">{subject.name}</span>
                                            <span className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                                                ({topics.length} тем)
                                            </span>
                                        </div>
                                        <div className="flex gap-2" style={{ flexWrap: 'wrap', paddingLeft: 'var(--space-3)' }}>
                                            {topics.map(topic => (
                                                <span
                                                    key={topic}
                                                    className="badge"
                                                    style={{
                                                        background: 'var(--bg-tertiary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--space-2)'
                                                    }}
                                                >
                                                    {topic}
                                                    <button
                                                        type="button"
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--danger-500)',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            fontSize: 'var(--font-size-xs)',
                                                            lineHeight: 1
                                                        }}
                                                        onClick={() => {
                                                            const newTopics = {
                                                                ...settings?.topics,
                                                                [subject.id]: topics.filter(t => t !== topic)
                                                            };
                                                            onUpdateSettings({ topics: newTopics });
                                                        }}
                                                        title="Удалить тему"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {!settings?.subjects?.some(s => (settings?.topics?.[s.id] || []).length > 0) && (
                                <p className="text-tertiary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                    Пока нет сохранённых тем. Добавьте тему при создании занятия, нажав +📚
                                </p>
                            )}
                        </div>
                    )}

                    {/* Финансы / Налоги */}
                    {activeTab === 'finance' && (
                        <div>
                            {/* Выбор системы налогообложения */}
                            <h3 className="font-semibold mb-4">💼 Система налогообложения</h3>

                            <div className="form-group mb-6">
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {[
                                        { id: 'patent', label: '📜 ПСН (Патент)', desc: 'Фиксированная сумма в год' },
                                        { id: 'usn', label: '📊 УСН', desc: '6% от дохода' },
                                        { id: 'self-employed', label: '👤 Самозанятый', desc: '4-6% от дохода' },
                                        { id: 'none', label: '❌ Не учитывать', desc: 'Без налогов' }
                                    ].map(tax => (
                                        <button
                                            key={tax.id}
                                            className={`btn ${settings?.taxSystem === tax.id ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => onUpdateSettings({ taxSystem: tax.id })}
                                            style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 'var(--space-3) var(--space-4)', minWidth: 140 }}
                                        >
                                            <span>{tax.label}</span>
                                            <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8, fontWeight: 400 }}>{tax.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Информационный блок о выбранной системе */}
                            {settings?.taxSystem && settings.taxSystem !== 'none' && (
                                <div
                                    className="mb-6"
                                    style={{
                                        padding: 'var(--space-4)',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderRadius: 'var(--radius-lg)',
                                        borderLeft: '4px solid var(--primary-500)'
                                    }}
                                >
                                    {settings.taxSystem === 'patent' && (
                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                            <strong>Патентная система (ПСН)</strong> — вы платите фиксированную сумму за патент раз в год, независимо от дохода.
                                            Дополнительно оплачиваются страховые взносы (ПФР + ОМС).
                                        </p>
                                    )}
                                    {settings.taxSystem === 'usn' && (
                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                            <strong>Упрощённая система (УСН)</strong> — налог составляет 6% от дохода (или 15% от "доходы минус расходы").
                                            Дополнительно оплачиваются страховые взносы.
                                        </p>
                                    )}
                                    {settings.taxSystem === 'self-employed' && (
                                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                                            <strong>Самозанятый (НПД)</strong> — налог 4% при работе с физлицами, 6% с юрлицами.
                                            Страховые взносы не обязательны, но можно платить добровольно.
                                        </p>
                                    )}
                                </div>
                            )}

                            <hr style={{ borderColor: 'var(--border-color)', margin: 'var(--space-6) 0' }} />

                            {/* Записи по годам */}
                            <h3 className="font-semibold mb-4">📅 Расходы по годам</h3>
                            <p className="text-secondary mb-4" style={{ fontSize: 'var(--font-size-sm)' }}>
                                Добавьте информацию о расходах на налоги и страховые взносы для каждого года.
                                Эти данные будут использоваться при расчёте статистики.
                            </p>

                            {/* Список годовых записей */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                {(settings?.taxRecords || []).sort((a, b) => b.year - a.year).map((record, index) => (
                                    <div
                                        key={record.year}
                                        style={{
                                            padding: 'var(--space-4)',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            marginBottom: 'var(--space-3)',
                                            border: '1px solid var(--border-color)'
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold" style={{ fontSize: 'var(--font-size-lg)' }}>
                                                📆 {record.year} год
                                            </h4>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => {
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        title: `Удалить данные за ${record.year} год?`,
                                                        message: `Все данные о налогах и страховых взносах за ${record.year} год будут удалены.`,
                                                        onConfirm: () => {
                                                            const newRecords = settings.taxRecords.filter(r => r.year !== record.year);
                                                            onUpdateSettings({ taxRecords: newRecords });
                                                            setConfirmModal({ ...confirmModal, isOpen: false });
                                                        }
                                                    });
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        <div className="form-row">
                                            {(settings?.taxSystem === 'patent' || !settings?.taxSystem) && (
                                                <div className="form-group">
                                                    <label className="form-label">Стоимость патента (₽)</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={record.patentCost || 0}
                                                        onChange={(e) => {
                                                            const newRecords = settings.taxRecords.map(r =>
                                                                r.year === record.year ? { ...r, patentCost: parseInt(e.target.value) || 0 } : r
                                                            );
                                                            onUpdateSettings({ taxRecords: newRecords });
                                                        }}
                                                        min="0"
                                                        step="1000"
                                                    />
                                                </div>
                                            )}

                                            {(settings?.taxSystem === 'usn' || settings?.taxSystem === 'self-employed') && (
                                                <div className="form-group">
                                                    <label className="form-label">Налоговая ставка (%)</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={record.taxRate || 6}
                                                        onChange={(e) => {
                                                            const newRecords = settings.taxRecords.map(r =>
                                                                r.year === record.year ? { ...r, taxRate: parseFloat(e.target.value) || 0 } : r
                                                            );
                                                            onUpdateSettings({ taxRecords: newRecords });
                                                        }}
                                                        min="0"
                                                        max="100"
                                                        step="0.5"
                                                    />
                                                </div>
                                            )}

                                            <div className="form-group">
                                                <label className="form-label">Страховые взносы (₽)</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={record.insuranceCost || 0}
                                                    onChange={(e) => {
                                                        const newRecords = settings.taxRecords.map(r =>
                                                            r.year === record.year ? { ...r, insuranceCost: parseInt(e.target.value) || 0 } : r
                                                        );
                                                        onUpdateSettings({ taxRecords: newRecords });
                                                    }}
                                                    min="0"
                                                    step="1000"
                                                />
                                                <p className="text-tertiary mt-1" style={{ fontSize: 'var(--font-size-xs)' }}>
                                                    ПФР + ОМС (в 2024: ~49 500 ₽)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Итого за год */}
                                        <div style={{
                                            marginTop: 'var(--space-3)',
                                            padding: 'var(--space-2) var(--space-3)',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-sm)'
                                        }}>
                                            <strong>Итого расходы:</strong> {formatCurrency((record.patentCost || 0) + (record.insuranceCost || 0))}
                                        </div>
                                    </div>
                                ))}

                                {(!settings?.taxRecords || settings.taxRecords.length === 0) && (
                                    <div className="text-center text-tertiary" style={{ padding: 'var(--space-6)' }}>
                                        Нет записей. Добавьте данные о расходах.
                                    </div>
                                )}
                            </div>

                            {/* Кнопка добавления года */}
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    const currentYear = new Date().getFullYear();
                                    const existingYears = (settings?.taxRecords || []).map(r => r.year);

                                    // Находим ближайший год, которого ещё нет
                                    let newYear = currentYear;
                                    while (existingYears.includes(newYear)) {
                                        newYear--;
                                    }

                                    const newRecord = {
                                        year: newYear,
                                        patentCost: 30000,
                                        insuranceCost: 49500,
                                        taxRate: 6
                                    };

                                    onUpdateSettings({
                                        taxRecords: [...(settings?.taxRecords || []), newRecord]
                                    });
                                }}
                            >
                                + Добавить год
                            </button>
                        </div>
                    )}

                    {/* Управление данными */}
                    {activeTab === 'data' && (
                        <div>
                            <h3 className="font-semibold mb-4">Резервное копирование</h3>

                            <div className="flex gap-3 mb-6">
                                <button className="btn btn-primary" onClick={handleExport}>
                                    📥 Экспорт данных
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    📤 Импорт данных
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    style={{ display: 'none' }}
                                    onChange={handleImport}
                                />
                            </div>

                            <p className="text-secondary mb-6" style={{ fontSize: 'var(--font-size-sm)' }}>
                                💡 Рекомендуем регулярно делать резервные копии. Все данные хранятся
                                локально в вашем браузере и могут быть потеряны при очистке данных браузера.
                            </p>

                            <hr style={{ borderColor: 'var(--border-color)', margin: 'var(--space-6) 0' }} />

                            <h3 className="font-semibold mb-4 text-danger">Опасная зона</h3>

                            {!showConfirmClear ? (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => setShowConfirmClear(true)}
                                >
                                    🗑️ Удалить все данные
                                </button>
                            ) : (
                                <div
                                    style={{
                                        padding: 'var(--space-4)',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--danger-500)'
                                    }}
                                >
                                    <p className="font-semibold text-danger mb-3">
                                        ⚠️ Вы уверены? Это действие нельзя отменить!
                                    </p>
                                    <p className="text-secondary mb-4" style={{ fontSize: 'var(--font-size-sm)' }}>
                                        Все ученики, занятия и настройки будут удалены безвозвратно.
                                    </p>
                                    <div className="flex gap-3">
                                        <button className="btn btn-danger" onClick={handleClearData}>
                                            Да, удалить всё
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setShowConfirmClear(false)}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Информация о приложении */}
            <div className="card mt-6">
                <div className="card-body text-center">
                    <div className="sidebar-logo-icon" style={{ margin: '0 auto var(--space-3)', width: 56, height: 56, fontSize: 'var(--font-size-2xl)' }}>
                        T
                    </div>
                    <h3 className="font-semibold">Система управления занятиями</h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                        Версия 1.0.0
                    </p>
                    <p className="text-tertiary mt-2" style={{ fontSize: 'var(--font-size-xs)' }}>
                        Приложение для управления расписанием репетитора
                    </p>
                </div>
            </div>

            {/* Модальное окно подтверждения */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type="danger"
                confirmText="Удалить"
                cancelText="Отмена"
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div>
    );
}

export default Settings;
