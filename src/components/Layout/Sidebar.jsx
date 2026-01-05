import { NavLink } from 'react-router-dom';

function Sidebar({ isOpen, onClose }) {
    const navItems = [
        { path: '/', icon: '📊', label: 'Дашборд' },
        { path: '/calendar', icon: '📅', label: 'Календарь' },
        { path: '/students', icon: '👨‍🎓', label: 'Ученики' },
        { path: '/statistics', icon: '📈', label: 'Статистика' },
        { path: '/settings', icon: '⚙️', label: 'Настройки' },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">T</div>
                    <span className="sidebar-logo-text">Система занятий</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    <div className="nav-section-title">Меню</div>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)',
                    textAlign: 'center'
                }}>
                    <div>СУЗ v1.0</div>
                    <div style={{ marginTop: 'var(--space-1)' }}>
                        © Котельникова В.А., 2026
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
