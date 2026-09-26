import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import api from "../api/axios";
import { hasSession, saveSession } from "../api/auth";
import {
    confirmLoginEnrolment,
    startLoginEnrolment,
    verifyMfaLogin,
} from "../services/mfaService";

// FE-001: token login against POST /api/auth/login/.
function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    // MFA-01: when the account has an authenticator, step 1 returns a
    // short-lived handle instead of a token and this holds it. Null
    // means we are on the ordinary username/password step.
    const [mfaToken, setMfaToken] = useState(null);
    const [code, setCode] = useState("");

    // MFA-02: set when the deployment requires an authenticator and
    // this account has none yet. Holds the QR to scan.
    const [enrolment, setEnrolment] = useState(null);
    const [backupCodes, setBackupCodes] = useState(null);

    // Every hook above runs on EVERY render. React matches hooks by
    // call order, so an early return placed above them changes the
    // hook count between renders and crashes the component with
    // "Rendered fewer hooks than expected".
    //
    // This bites exactly at login: finishLogin writes the session to
    // localStorage and then navigates. A re-render between those two
    // steps makes hasSession() true, the component would return after
    // four hooks instead of eight, and the page goes white.
    if (hasSession()) {
        return <Navigate to="/" replace />;
    }

    const finishLogin = (data) => {
        saveSession(data.token, {
            username: data.username,
            is_staff: data.is_staff,
        });

        const target = location.state?.from?.pathname || "/";
        navigate(target, { replace: true });
    };

    /*
        MFA-02: confirm the scan AND finish signing in.

        The backup codes come back here and are shown once, so the
        session is held until the user has acknowledged them.
    */
    const submitEnrolment = async (event) => {
        event.preventDefault();
        setError("");
        setBusy(true);

        try {
            const data = await confirmLoginEnrolment(mfaToken, code);
            setBackupCodes(data.backup_codes);
            setEnrolment({ ...enrolment, pendingSession: data });

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

            // MFA-02: no authenticator yet and the deployment requires
            // one. Fetch the QR and show it right here.
            if (data.enrolment_required) {
                setMfaToken(data.mfa_token);

                try {
                    setEnrolment(await startLoginEnrolment(data.mfa_token));
                } catch (err) {
                    setError(
                        err?.response?.data?.detail ||
                        "Could not start two-factor setup."
                    );
                    setMfaToken(null);
                }

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
            {backupCodes ? (

                /* MFA-02: shown ONCE, before the session is handed over.
                   The user must acknowledge them or they are lost. */
                <div
                    style={{
                        width: "100%",
                        maxWidth: 380,
                        padding: 28,
                        background: "var(--panel)",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                    }}
                >
                    <h2 style={{ margin: "0 0 4px" }}>Save your backup codes</h2>
                    <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 13 }}>
                        Each works once, if you lose your phone. They are shown
                        now and cannot be retrieved later.
                    </p>

                    <pre
                        style={{
                            background: "var(--bg2)",
                            padding: 14,
                            borderRadius: 6,
                            fontSize: 14,
                            lineHeight: 1.9,
                            letterSpacing: "0.08em",
                            margin: 0,
                        }}
                    >
                        {backupCodes.join("\n")}
                    </pre>

                    <button
                        type="button"
                        onClick={() => finishLogin(enrolment.pendingSession)}
                        style={{
                            width: "100%",
                            marginTop: 18,
                            padding: "10px 12px",
                            background: "var(--cyan)",
                            color: "#06232d",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        I have saved them - continue
                    </button>
                </div>

            ) : enrolment ? (

                /* MFA-02: first sign-in. Scan before going any further. */
                <form
                    onSubmit={submitEnrolment}
                    style={{
                        width: "100%",
                        maxWidth: 380,
                        padding: 28,
                        background: "var(--panel)",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        textAlign: "center",
                    }}
                >
                    <h2 style={{ margin: "0 0 4px" }}>Set up two-factor</h2>
                    <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: 13 }}>
                        Scan this with Google Authenticator, Microsoft
                        Authenticator, or 1Password.
                    </p>

                    <div
                        style={{
                            background: "#fff",
                            display: "inline-block",
                            padding: 8,
                            borderRadius: 6,
                        }}
                        /* SVG generated by our own backend from the
                           provisioning URI, not by any third party. */
                        dangerouslySetInnerHTML={{ __html: enrolment.qr_svg }}
                    />

                    <p style={{ color: "var(--muted)", fontSize: 12, margin: "14px 0 4px" }}>
                        No camera? Enter this key manually:
                    </p>
                    <code
                        style={{
                            display: "block",
                            background: "var(--bg2)",
                            padding: "8px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            letterSpacing: "0.06em",
                            marginBottom: 16,
                            wordBreak: "break-all",
                        }}
                    >
                        {enrolment.manual_key}
                    </code>

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
                            background: "var(--cyan)",
                            color: "#06232d",
                            border: "none",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: busy ? "wait" : "pointer",
                            opacity: busy ? 0.7 : 1,
                        }}
                    >
                        {busy ? "Confirming..." : "Confirm and continue"}
                    </button>
                </form>

            ) : mfaToken ? (

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
                            background: "var(--cyan)",
                            color: "#06232d",
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