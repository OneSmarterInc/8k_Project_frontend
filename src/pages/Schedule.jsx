import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/axios";

function Schedule() {
    const {
        enabled,
        pollInterval,
        setPollInterval,
        dailyChronicle,
        setDailyChronicle,
        secondsToPoll,
        startAutomation,
        pauseAutomation
    } = useOutletContext() || {};

    const [weekendRuns, setWeekendRuns] = useState(false);
    const [emailFlagged, setEmailFlagged] = useState(true);
    const [emailGate, setEmailGate] = useState(true);

    const [logs, setLogs] = useState("");
    const terminalRef = useRef(null);
    const [popupMessage, setPopupMessage] = useState(null);

    // SMTP Form State
    const [smtpForm, setSmtpForm] = useState({
        senderName: "OneSmarter Support",
        senderEmail: "support@onesmarter.com",
        replyToEmail: "help@onesmarter.com",
        securityProtocol: "TLS",
        smtpHost: "smtp.ionos.com",
        smtpPort: "587",
        smtpUsername: "akshay.kumar@onesmarter.com",
        smtpPassword: ""
    });

    const handleSmtpChange = (e) => {
        setSmtpForm({ ...smtpForm, [e.target.name]: e.target.value });
    };

    const validateSmtpForm = (isTest = false) => {
        const { senderName, senderEmail, replyToEmail, smtpHost, smtpPort, smtpUsername, smtpPassword } = smtpForm;
        
        if (!senderName || !senderEmail || !smtpHost || !smtpPort || !smtpUsername) {
            return "Please fill in all required fields (Name, Email, Host, Port, Username).";
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(senderEmail)) return "Invalid Sender Email format.";
        if (replyToEmail && !emailRegex.test(replyToEmail)) return "Invalid Reply-To Email format.";
        if (!emailRegex.test(smtpUsername)) return "Invalid SMTP Username (must be an email).";
        
        if (isNaN(smtpPort) || parseInt(smtpPort) <= 0 || parseInt(smtpPort) > 65535) {
            return "SMTP Port must be a valid port number (1-65535).";
        }

        if (isTest && !smtpPassword) {
            return "Please enter your SMTP Password to run a connection test.";
        }
        
        return null;
    };

    const handleTestConnection = async () => {
        const error = validateSmtpForm(true);
        if (error) {
            setPopupMessage(`Validation Error: ${error}`);
            return;
        }
        setPopupMessage("Initiating SMTP Test...");
        try {
            const response = await api.post("/settings/smtp/?action=test", smtpForm);
            if (response.data.status === "success") {
                setPopupMessage(`Success: ${response.data.message}`);
            } else {
                setPopupMessage(`Failed: ${response.data.message}`);
            }
        } catch (err) {
            setPopupMessage(`Error: ${err.message}`);
        }
    };

    const handleSaveConfig = async () => {
        const error = validateSmtpForm(false);
        if (error) {
            setPopupMessage(`Validation Error: ${error}`);
            return;
        }
        setPopupMessage("Saving Configuration...");
        try {
            const response = await api.post("/settings/smtp/?action=save", smtpForm);
            if (response.data.status === "success") {
                setPopupMessage(`Success: ${response.data.message}`);
                // Clear password field after save
                setSmtpForm(prev => ({...prev, smtpPassword: ""}));
            } else {
                setPopupMessage(`Failed: ${response.data.message}`);
            }
        } catch (err) {
            setPopupMessage(`Error: ${err.message}`);
        }
    };

    useEffect(() => {
        let interval;
        if (enabled) {
            interval = setInterval(async () => {
                try {
                    const response = await api.get("/runs/logs/");
                    if (response.data && response.data.logs !== undefined) {
                        setLogs(response.data.logs);
                    }
                } catch (e) {}
            }, 1500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [enabled]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSave = () => {
        setPopupMessage("Schedule saved.");
        if (enabled) {
            // Restart with new interval
            startAutomation();
        }
    };

    const nextPollDisplay = secondsToPoll > 0 ? (secondsToPoll >= 60 ? `${Math.floor(secondsToPoll / 60)}m ${secondsToPoll % 60}s` : `${secondsToPoll}s`) : "now";

    const [schedules, setSchedules] = useState([
        { id: 1, type: 'Daily', time: '16:30 ET', days: [] }
    ]);

    const addSchedule = () => {
        setSchedules([...schedules, { id: Date.now(), type: 'Daily', time: '12:00 ET', days: [] }]);
    };

    const removeSchedule = (id) => {
        setSchedules(schedules.filter(s => s.id !== id));
    };

    const updateSchedule = (id, field, value) => {
        setSchedules(schedules.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    return (
        <section className="content page" id="page-schedule">
            <div className="auto-banner" style={{ background: enabled ? "rgba(90,201,153,.06)" : "rgba(226,105,90,.06)", borderColor: enabled ? "rgba(90,201,153,.3)" : "rgba(226,105,90,.3)" }}>
                <span className="bd" style={{ background: enabled ? "var(--green)" : "var(--red)" }}></span>
                <div>
                    Automation is <b>{enabled ? "enabled" : "paused"}</b>. 
                    {enabled ? ` Next poll in ${nextPollDisplay} · next full run 16:30 ET today.` : " Start automation to resume polling."}
                </div>
            </div>



            <div className="card">
                <div className="card-h">
                    <h3>Schedule Automation</h3>
                    <span className="hint">Coordinator</span>
                </div>
                <div className="card-b" style={{ padding: "24px" }}>
                    
                    {schedules.map((sched, idx) => (
                        <div key={sched.id} style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px", backgroundColor: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Frequency</label>
                                <select className="search" style={{ width: "100%" }} value={sched.type} onChange={(e) => updateSchedule(sched.id, 'type', e.target.value)}>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>

                            {sched.type === 'Weekly' && (
                                <div style={{ flex: 2 }}>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Days</label>
                                    <input type="text" className="search" style={{ width: "100%" }} placeholder="e.g. Mon, Wed, Fri" value={sched.days.join(', ')} onChange={(e) => updateSchedule(sched.id, 'days', e.target.value.split(', '))} />
                                </div>
                            )}
                            
                            {sched.type === 'Monthly' && (
                                <div style={{ flex: 2 }}>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Dates</label>
                                    <input type="text" className="search" style={{ width: "100%" }} placeholder="e.g. 1st, 15th" value={sched.days.join(', ')} onChange={(e) => updateSchedule(sched.id, 'days', e.target.value.split(', '))} />
                                </div>
                            )}

                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Time (ET)</label>
                                <input type="time" className="search" style={{ width: "100%" }} value={sched.time.replace(' ET', '')} onChange={(e) => updateSchedule(sched.id, 'time', e.target.value + ' ET')} />
                            </div>

                            <div style={{ alignSelf: "flex-end" }}>
                                <button className="btn" style={{ height: "38px", color: "var(--red)", borderColor: "rgba(255,100,100,0.2)" }} onClick={() => removeSchedule(sched.id)}>Remove</button>
                            </div>
                        </div>
                    ))}

                    <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
                        <button className="btn" style={{ borderStyle: "dashed", width: "100%" }} onClick={addSchedule}>+ Add Schedule</button>
                    </div>

                </div>
            </div>

            <div className="card">
                <div className="card-h"><h3>SMTP Configurations</h3></div>
                <div className="card-b" style={{ padding: "24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Sender Name</label>
                            <input type="text" className="search" style={{ width: "100%" }} name="senderName" value={smtpForm.senderName} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Sender Email</label>
                            <input type="text" className="search" style={{ width: "100%" }} name="senderEmail" value={smtpForm.senderEmail} onChange={handleSmtpChange} />
                        </div>
                        
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Reply-To Email (Optional)</label>
                            <input type="text" className="search" style={{ width: "100%" }} name="replyToEmail" value={smtpForm.replyToEmail} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>Security Protocol</label>
                            <select className="search" style={{ width: "100%" }} name="securityProtocol" value={smtpForm.securityProtocol} onChange={handleSmtpChange}>
                                <option value="TLS">TLS</option>
                                <option value="SSL">SSL</option>
                                <option value="STARTTLS">STARTTLS</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>SMTP Host</label>
                            <input type="text" className="search" style={{ width: "100%" }} name="smtpHost" value={smtpForm.smtpHost} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>SMTP Port</label>
                            <input type="text" className="search" style={{ width: "100%" }} name="smtpPort" value={smtpForm.smtpPort} onChange={handleSmtpChange} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>SMTP Username</label>
                            <input type="text" className="search" style={{ width: "100%" }} name="smtpUsername" value={smtpForm.smtpUsername} onChange={handleSmtpChange} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", color: "var(--dim)" }}>SMTP Password</label>
                            <input type="password" className="search" style={{ width: "100%" }} placeholder="Leave blank to keep existing" name="smtpPassword" value={smtpForm.smtpPassword} onChange={handleSmtpChange} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px" }}>
                        <button className="btn" onClick={handleTestConnection}>Test Connection</button>
                        <button className="btn btn-primary" onClick={handleSaveConfig}>Save Configuration</button>
                    </div>
                </div>
            </div>

            <div className="save-bar">
                {enabled ? (
                    <>
                        <button className="btn btn-primary" onClick={handleSave}>Save schedule</button>
                        <button className="btn btn-danger" onClick={pauseAutomation}>Pause automation</button>
                    </>
                ) : (
                    <>
                        <button className="btn btn-primary" onClick={startAutomation}>Start automation</button>
                    </>
                )}
            </div>

            {enabled && (
                <div className="card" style={{ marginTop: "24px" }}>
                    <div className="card-h"><h3>Live Automation Logs</h3><span className="hint">Terminal</span></div>
                    <div className="card-b" style={{ padding: "0" }}>
                        <div 
                            ref={terminalRef}
                            style={{ 
                                height: "300px", 
                                overflowY: "auto", 
                                backgroundColor: "#05080c", 
                                color: "#66d9a8", 
                                fontFamily: "monospace", 
                                padding: "16px",
                                fontSize: "13px",
                                whiteSpace: "pre-wrap",
                                borderTop: "1px solid rgba(255,255,255,0.05)"
                            }}
                        >
                            {logs || "Waiting for watcher output..."}
                        </div>
                    </div>
                </div>
            )}

            {popupMessage && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(5, 8, 12, 0.4)', backdropFilter: 'blur(2px)',
                        zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}
                    onClick={() => setPopupMessage(null)}
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
                        <p style={{ margin: 0, color: 'var(--dim, #6e7a8a)' }}>{popupMessage}</p>
                        <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => setPopupMessage(null)}>
                            OK
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Schedule;