import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { hasSession, saveSession } from "../api/auth";
import { verifyMfaLogin } from "../services/mfaService";

// FE-001: token login against POST /api/auth/login/.
function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    if (hasSession()) {
        return <Navigate to="/" replace />;
    }

    // MFA-01: when the account has an authenticator, step 1 returns a
    // short-lived handle instead of a token and this holds it. Null
    // means we are on the ordinary username/password step.
    const [mfaToken, setMfaToken] = useState(null);
    const [code, setCode] = useState("");

    const finishLogin = (data) => {
        saveSession(data.token, {
            username: data.username,
            is_staff: data.is_staff,
        });

        const target = location.state?.from?.pathname || "/";
        navigate(target, { replace: true });
    };

    const submitCode = async (event) => {
        event.preventDefault();
        setError("");
        setBusy(true);

        try {
            finishLogin(await verifyMfaLogin(mfaToken, code));

        } catch (err) {
            if (!err.response) {
                setError("Cannot reach the backend. Is the server running?");
            } else {
                setError(err.response.data?.detail || "That code is not valid.");
            }
            setCode("");
        } finally {
            setBusy(false);
        }
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setBusy(true);

        try {
            const { data } = await api.post("/auth/login/", {
                username,
                password,
            });

            // MFA-01: no token yet - the account needs a second factor.
            if (data.mfa_required) {
                setMfaToken(data.mfa_token);
                setBusy(false);
                return;
            }

            finishLogin(data);

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
            {mfaToken ? (

                /* MFA-01: step 2. The password was accepted but no token
                   was issued - the account needs its authenticator. */
                <form
                    onSubmit={submitCode}
                    style={{
                        width: "100%",
                        maxWidth: 340,
                        padding: 28,
                        background: "var(--panel)",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                    }}
                >
                    <h2 style={{ margin: "0 0 4px" }}>Two-factor</h2>
                    <p style={{ margin: "0 0 20px", color: "var(--muted)", fontSize: 13 }}>
                        Enter the 6-digit code from your authenticator app.
                    </p>

                    <label style={{ fontSize: 13 }}>
                        Authentication code
                        <input
                            style={{
                                ...field,
                                letterSpacing: "0.3em",
                                fontSize: 18,
                                textAlign: "center",
                            }}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            autoFocus
                            required
                        />
                    </label>

                    <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 12 }}>
                        Lost your phone? Enter one of your backup codes instead.
                    </p>

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
                            marginTop: 18,
                            padding: "10px 12px",
                            background: "var(--accent)",
                            color: "#04121c",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: busy ? "wait" : "pointer",
                            opacity: busy ? 0.7 : 1,
                        }}
                    >
                        {busy ? "Verifying..." : "Verify"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMfaToken(null);
                            setCode("");
                            setError("");
                        }}
                        style={{
                            width: "100%",
                            marginTop: 10,
                            padding: "8px 12px",
                            background: "transparent",
                            color: "var(--muted)",
                            border: "1px solid var(--line)",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        Back
                    </button>
                </form>

            ) : (

            <form
                onSubmit={submit}
                style={{
                    width: "100%",
                    maxWidth: 340,
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

            )}
        </div>
    );
}

export default Login;