/*
 * FE-008: the SMTP card, moved out of Schedule.jsx.
 *
 * Presentational only. Every piece of state and every handler still
 * lives in Schedule.jsx and is passed in, so the rendered output is
 * byte-for-byte what it was before the split.
 */
function SmtpSettings({
    smtpForm,
    handleSmtpChange,
    smtpPassword,
    setSmtpPassword,
    passwordConfigured,
    handleTestConnection,
    handleSaveConfig,
}) {

    return (
            <div className="card" style={{ marginBottom: "20px" }}>
                <div className="card-h"><h3>SMTP Configurations</h3></div>
                <div className="card-b" style={{ padding: "16px 24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>Sender Name</label>
                            <input type="text" className="search" style={{ width: "100%", padding: "4px 8px" }} name="senderName" value={smtpForm.senderName} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>Sender Email</label>
                            <input type="text" className="search" style={{ width: "100%", padding: "4px 8px" }} name="senderEmail" value={smtpForm.senderEmail} onChange={handleSmtpChange} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>Reply-To Email</label>
                            <input type="text" className="search" style={{ width: "100%", padding: "4px 8px" }} name="replyToEmail" value={smtpForm.replyToEmail} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>Security Protocol</label>
                            <select className="search" style={{ width: "100%", padding: "4px 8px" }} name="securityProtocol" value={smtpForm.securityProtocol} onChange={handleSmtpChange}>
                                <option value="TLS">TLS</option>
                                <option value="SSL">SSL</option>
                                <option value="STARTTLS">STARTTLS</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>SMTP Host</label>
                            <input type="text" className="search" style={{ width: "100%", padding: "4px 8px" }} name="smtpHost" value={smtpForm.smtpHost} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>SMTP Port</label>
                            <input type="text" className="search" style={{ width: "100%", padding: "4px 8px" }} name="smtpPort" value={smtpForm.smtpPort} onChange={handleSmtpChange} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>SMTP Username</label>
                            <input type="text" className="search" style={{ width: "100%", padding: "4px 8px" }} name="smtpUsername" value={smtpForm.smtpUsername} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px", color: "var(--dim)" }}>SMTP Password</label>
                            <input
                                type="password"
                                className="search"
                                style={{ width: "100%", padding: "4px 8px" }}
                                name="smtpPassword"
                                autoComplete="new-password"
                                placeholder={passwordConfigured ? "Saved (leave blank to keep)" : "Enter SMTP password"}
                                value={smtpPassword}
                                onChange={(e) => setSmtpPassword(e.target.value)}
                            />
                            {/* Status only: the saved password is never sent back to the browser. */}
                            <div style={{ padding: "4px 2px 0", fontSize: "11px", color: passwordConfigured ? "var(--green)" : "var(--dim)" }}>
                                {passwordConfigured
                                    ? "Password saved."
                                    : "No password saved yet."}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        <button className="btn" onClick={handleTestConnection}>Test Connection</button>
                        <button className="btn btn-primary" onClick={handleSaveConfig}>Save Configuration</button>
                    </div>
                </div>
            </div>
    );
}

export default SmtpSettings;