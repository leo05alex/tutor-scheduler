import { NavLink } from 'react-router-dom';

function MobileNav({ onMenuClick }) {
    const navItems = [
        { path: '/', icon: '📊', label: 'Главная' },
        { path: '/calendar', icon: '📅', label: 'Календарь' },
        { path: '/students', icon: '👨‍🎓', label: 'Ученики' },
        { path: '/statistics', icon: '📈', label: 'Статистика' },
    ];

    return (
        <nav className="mobile-nav">
            {navItems.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="mobile-nav-item-icon">{item.icon}</span>
                    <span>{item.label}</span>
                </NavLink>
            ))}
            <NavLink
                to="/settings"
                className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="mobile-nav-item-icon">⚙️</span>
                <span>Ещё</span>
            </NavLink>
        </nav>
    );
}

export default MobileNav;
