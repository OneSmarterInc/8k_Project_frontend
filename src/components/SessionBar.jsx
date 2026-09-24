import { useEffect, useState } from "react";

import api from "../api/axios";
import {
    clearSession,
    getUser,
    isConnectionLost,
    onConnectionChange,
} from "../api/auth";

// FE-010: "connection lost" banner + FE-001: who is logged in / log out.
function SessionBar() {
    const [lost, setLost] = useState(isConnectionLost());
    const user = getUser();

    useEffect(() => onConnectionChange(setLost), []);

    const logout = async () => {
        try {
            await api.post("/auth/logout/");
        } catch {
            // Even if the server is unreachable, drop the local session.
        }
        clearSession();
        window.location.assign("/login");
    };

    return (
        <>
            {lost && (
                <div
                    role="alert"
                    style={{
                        background: "var(--red)",
                        color: "#fff",
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    Connection lost: the backend is not responding.
                    Data on screen may be out of date.
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 12,
                    padding: "6px 16px",
                    fontSize: 12,
                    color: "var(--muted)",
                    borderBottom: "1px solid var(--line)",
                }}
            >
                {user && (
                    <span>
                        {user.username}
                        {user.is_staff ? " (admin)" : ""}
                    </span>
                )}
                <button
                    type="button"
                    onClick={logout}
                    style={{
                        background: "transparent",
                        border: "1px solid var(--line)",
                        color: "var(--text)",
                        borderRadius: 4,
                        padding: "3px 10px",
                        cursor: "pointer",
                    }}
                >
                    Log out
                </button>
            </div>
        </>
    );
}

export default SessionBar;