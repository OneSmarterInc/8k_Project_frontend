/*
 * FE-008: the system notification popup, moved out of Schedule.jsx.
 *
 * Renders nothing when there is no message, which is exactly what the
 * `popupMessage && (...)` guard did inline.
 */
function NotificationModal({ message, onClose }) {

    if (!message) {
        return null;
    }

    return (
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(5, 8, 12, 0.4)', backdropFilter: 'blur(2px)',
                    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        backgroundColor: 'var(--card-bg, #161b22)', padding: '24px', borderRadius: '8px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border, rgba(255,255,255,0.1))',
                        minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 style={{ margin: 0, color: 'var(--text, #a3b1c6)' }}>System Notification</h3>
                    <p style={{ margin: 0, color: 'var(--dim, #6e7a8a)' }}>{message}</p>
                    <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={onClose}>
                        OK
                    </button>
                </div>
            </div>
    );
}

export default NotificationModal;