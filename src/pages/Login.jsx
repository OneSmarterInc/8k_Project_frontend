import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { getToken, saveSession } from "../api/auth";

// FE-001: token login against POST /api/auth/login/.
function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    if (getToken()) {
        return <Navigate to="/" replace />;
    }

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setBusy(true);

        try {
            const { data } = await api.post("/auth/login/", {
                username,
                password,
            });

            saveSession(data.token, {
                username: data.username,
                is_staff: data.is_staff,
            });

            const target = location.state?.from?.pathname || "/";
            navigate(target, { replace: true });

        } catch (err) {
            if (!err.response) {
                setError("Cannot reach the backend. Is the server running?");
            } else {
                setError(
                    err.response.data?.detail || "Login failed."
                );
            }
        } finally {
            setBusy(false);
        }
    };

    const field = {
        width: "100%",
        padding: "10px 12px",
        marginTop: 6,
        background: "var(--bg2)",
        border: "1px solid var(--line)",
        borderRadius: 6,
        color: "var(--text)",
        boxSizing: "border-box",
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg)",
                color: "var(--text)",
            }}
        >
            <form
                onSubmit={submit}
                style={{
                    width: 340,
                    padding: 28,
                    background: "var(--panel)",
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                }}
            >
                <h2 style={{ margin: "0 0 4px" }}>SEC Watcher</h2>
                <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 13 }}>
                    Sign in to continue
                </p>

                <label style={{ fontSize: 13 }}>
                    Username
                    <input
                        style={field}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        required
                    />
                </label>

                <div style={{ height: 14 }} />

                <label style={{ fontSize: 13 }}>
                    Password
                    <input
                        style={field}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </label>

                {error && (
                    <div
                        role="alert"
                        style={{ color: "var(--red)", fontSize: 13, marginTop: 14 }}
                    >
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={busy}
                    style={{
                        width: "100%",
                        marginTop: 20,
                        padding: "10px 12px",
                        background: "var(--cyan)",
                        border: "none",
                        borderRadius: 6,
                        color: "#06232d",
                        fontWeight: 700,
                        cursor: busy ? "wait" : "pointer",
                    }}
                >
                    {busy ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </div>
    );
}

export default Login;