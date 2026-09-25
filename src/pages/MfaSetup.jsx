import { useEffect, useState } from "react";

import {
    confirmMfaSetup,
    getMfaStatus,
    startMfaSetup,
} from "../services/mfaService";

/*
    MFA-01: enrol an authenticator app.

    Three states:
      idle      - not enrolled, offering to start
      scanning  - QR shown, waiting for the first code
      done      - enabled, backup codes shown ONCE

    The device is not active until confirm succeeds, so leaving this
    page half way through cannot lock the account out.
*/
function MfaSetup() {

    const [status, setStatus] = useState(null);
    const [setup, setSetup] = useState(null);
    const [code, setCode] = useState("");
    const [backupCodes, setBackupCodes] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getMfaStatus().then(setStatus).catch(() => setStatus(null));
    }, []);

    const begin = async () => {
        setBusy(true);
        setError("");

        try {
            setSetup(await startMfaSetup());
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not start setup.");
        } finally {
            setBusy(false);
        }
    };

    const confirm = async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");

        try {
            const result = await confirmMfaSetup(code);
            setBackupCodes(result.backup_codes);
            setSetup(null);
            setStatus({ enabled: true, backup_codes_remaining: 10 });
        } catch (err) {
            setError(err?.response?.data?.detail || "That code is not valid.");
            setCode("");
        } finally {
            setBusy(false);
        }
    };

    const card = {
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: 24,
        maxWidth: 520,
    };

    return (
        <section className="content page">
            <h2 style={{ marginTop: 0 }}>Two-factor authentication</h2>

            {error && (
                <div role="alert" style={{ color: "var(--red)", marginBottom: 14, fontSize: 13 }}>
                    {error}
                </div>
            )}

            {/* Backup codes: shown once, never recoverable. */}
            {backupCodes && (
                <div style={card}>
                    <h3 style={{ marginTop: 0 }}>Save your backup codes</h3>
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>
                        Each one works once, and only if you lose your phone.
                        They are shown now and cannot be retrieved later.
                    </p>
                    <pre
                        style={{
                            background: "var(--bg2)",
                            padding: 14,
                            borderRadius: 6,
                            fontSize: 14,
                            lineHeight: 1.9,
                            letterSpacing: "0.08em",
                        }}
                    >
                        {backupCodes.join("\n")}
                    </pre>
                </div>
            )}

            {!backupCodes && status?.enabled && (
                <div style={card}>
                    <p style={{ margin: 0 }}>
                        Two-factor authentication is <strong>on</strong> for this account.
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 0 }}>
                        {status.backup_codes_remaining} backup code
                        {status.backup_codes_remaining === 1 ? "" : "s"} remaining.
                    </p>
                </div>
            )}

            {!backupCodes && status && !status.enabled && !setup && (
                <div style={card}>
                    <p style={{ marginTop: 0, color: "var(--muted)", fontSize: 13 }}>
                        Add a second step to sign-in using an authenticator app
                        such as Google Authenticator, Microsoft Authenticator,
                        or 1Password.
                    </p>
                    <button
                        className="btn"
                        onClick={begin}
                        disabled={busy}
                        style={{
                            border: "1px solid var(--cyan)",
                            color: "var(--cyan)",
                            cursor: busy ? "wait" : "pointer",
                        }}
                    >
                        {busy ? "Starting..." : "Set up authenticator"}
                    </button>
                </div>
            )}

            {setup && (
                <div style={card}>
                    <h3 style={{ marginTop: 0 }}>Scan this with your app</h3>

                    <div
                        style={{
                            background: "#fff",
                            display: "inline-block",
                            padding: 8,
                            borderRadius: 6,
                        }}
                        // The SVG is generated by our own backend from the
                        // provisioning URI, not by any third party.
                        dangerouslySetInnerHTML={{ __html: setup.qr_svg }}
                    />

                    <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>
                        No camera? Enter this key manually:
                    </p>
                    <code
                        style={{
                            display: "block",
                            background: "var(--bg2)",
                            padding: "8px 10px",
                            borderRadius: 6,
                            fontSize: 13,
                            letterSpacing: "0.08em",
                            marginBottom: 16,
                        }}
                    >
                        {setup.manual_key}
                    </code>

                    <form onSubmit={confirm}>
                        <label style={{ fontSize: 13 }}>
                            Enter the 6-digit code to finish
                            <input
                                className="search"
                                style={{
                                    display: "block",
                                    width: 160,
                                    marginTop: 6,
                                    padding: "8px 10px",
                                    fontSize: 18,
                                    letterSpacing: "0.3em",
                                    textAlign: "center",
                                }}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                inputMode="numeric"
                                placeholder="000000"
                                autoFocus
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            className="btn"
                            disabled={busy}
                            style={{
                                marginTop: 16,
                                border: "1px solid var(--cyan)",
                                color: "var(--cyan)",
                                cursor: busy ? "wait" : "pointer",
                            }}
                        >
                            {busy ? "Confirming..." : "Confirm and enable"}
                        </button>
                    </form>
                </div>
            )}
        </section>
    );
}

export default MfaSetup;