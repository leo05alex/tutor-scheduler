import { useEffect, useRef } from 'react';

/**
 * Универсальное модальное окно подтверждения
 * Заменяет стандартный window.confirm() на стилизованное окно
 * 
 * @param {boolean} isOpen - открыто ли окно
 * @param {string} title - заголовок окна
 * @param {string|React.ReactNode} message - сообщение или контент
 * @param {string} confirmText - текст кнопки подтверждения (по умолчанию "Подтвердить")
 * @param {string} cancelText - текст кнопки отмены (по умолчанию "Отмена")
 * @param {string} type - тип окна: 'danger', 'warning', 'success', 'info' (влияет на цвет кнопки)
 * @param {function} onConfirm - callback при подтверждении
 * @param {function} onCancel - callback при отмене
 */
function ConfirmModal({
    isOpen,
    title = 'Подтверждение',
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    type = 'primary',
    onConfirm,
    onCancel
}) {
    const confirmBtnRef = useRef(null);

    // Фокус на кнопке подтверждения при открытии
    useEffect(() => {
        if (isOpen && confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, [isOpen]);

    // Закрытие по Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onCancel?.();
            } else if (e.key === 'Enter') {
                onConfirm?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, onCancel]);

    // Блокировка скролла при открытом модале
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Определяем класс кнопки по типу
    const buttonClass = {
        danger: 'btn-danger',
        warning: 'btn-warning',
        success: 'btn-success',
        info: 'btn-info',
        primary: 'btn-primary'
    }[type] || 'btn-primary';

    // Определяем иконку по типу
    const icon = {
        danger: '⚠️',
        warning: '⚠️',
        success: '✅',
        info: 'ℹ️',
        primary: '❓'
    }[type] || '❓';

    return (
        <div
            className="confirm-modal-overlay"
            onClick={onCancel}
        >
            <div
                className="confirm-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-4)'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                    <h3 style={{
                        margin: 0,
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        {title}
                    </h3>
                </div>

                {/* Сообщение */}
                <div style={{
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-6)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line'
                }}>
                    {message}
                </div>

                {/* Кнопки */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        className={`btn ${buttonClass}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
