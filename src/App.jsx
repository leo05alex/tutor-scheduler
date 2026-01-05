import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import MobileNav from './components/Layout/MobileNav';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Students from './pages/Students';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import { initializeSettings, settingsApi } from './db/database';

function App() {
    const [settings, setSettings] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Инициализация приложения
    useEffect(() => {
        async function init() {
            const loadedSettings = await initializeSettings();
            setSettings(loadedSettings);

            // Применить тему
            if (loadedSettings?.theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        }
        init();
    }, []);

    // Закрыть сайдбар при навигации (мобильные)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    // Обновление настроек
    const updateSettings = async (newSettings) => {
        await settingsApi.update(newSettings);
        setSettings(prev => ({ ...prev, ...newSettings }));

        // Применить тему
        if (newSettings.theme) {
            document.documentElement.setAttribute('data-theme', newSettings.theme);
        }
    };

    if (!settings) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-secondary)'
            }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="app-layout">
            {/* Overlay для мобильного сайдбара */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Боковое меню */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Основной контент */}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard settings={settings} />} />
                    <Route path="/calendar" element={<Calendar settings={settings} onUpdateSettings={updateSettings} />} />
                    <Route path="/students" element={<Students settings={settings} />} />
                    <Route path="/statistics" element={<Statistics settings={settings} />} />
                    <Route
                        path="/settings"
                        element={
                            <Settings
                                settings={settings}
                                onUpdateSettings={updateSettings}
                            />
                        }
                    />
                </Routes>
            </main>

            {/* Мобильная навигация */}
            <MobileNav onMenuClick={() => setSidebarOpen(true)} />
        </div>
    );
}

export default App;
