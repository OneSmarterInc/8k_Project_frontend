import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/axios";

// FE-006: log polling intervals
const LOG_POLL_ACTIVE_MS = 1500;           // while a run is active (same as before)
const LOG_POLL_IDLE_MS = 10000;            // when nothing is running
const LOG_POLL_STARTUP_GRACE_MS = 30000;   // stay fast right after Run Now
const RUN_STARTUP_LOCK_MS = 15000;         // keep Run Now disabled while the watcher starts

function Schedule() {
    const {
        enabled,
        pollInterval,
        setPollInterval,
        dailyChronicle,
        setDailyChronicle,
        secondsToPoll,
        startAutomation,
        pauseAutomation,
        triggerRun
    } = useOutletContext() || {};

    const [weekendRuns, setWeekendRuns] = useState(false);
    const [emailFlagged, setEmailFlagged] = useState(true);
    const [emailGate, setEmailGate] = useState(true);

    const [logs, setLogs] = useState("");
    const terminalRef = useRef(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const fastPollUntilRef = useRef(0);
    // Keeps Run Now disabled while the watcher process starts up, before it
    // holds the lock and /runs/logs/ reports is_running (prevents a second
    // click from launching again and truncating watcher_latest.log).
    const [startingUp, setStartingUp] = useState(false);
    const startupTimerRef = useRef(null);
    const runLocked = isRunning || startingUp;

    useEffect(() => {
        return () => clearTimeout(startupTimerRef.current);
    }, []);

    const [freq, setFreq] = useState("daily");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState("19:37");
    const [syncZone, setSyncZone] = useState(false);

    // Daily
    const [dailyRecur, setDailyRecur] = useState(4);

    // Weekly
    const [weeklyRecur, setWeeklyRecur] = useState(1);
    const [weeklyDays, setWeeklyDays] = useState({
        sun: false, mon: true, tue: false, wed: false, thu: false, fri: false, sat: false
    });

    // Monthly
    const [monthlyMonths, setMonthlyMonths] = useState("All months");
    const [monthlyType, setMonthlyType] = useState("days");
    const [monthlyDays, setMonthlyDays] = useState("1, 17, 18");
    const [monthlyOnWeek, setMonthlyOnWeek] = useState("Second");
    const [monthlyOnDay, setMonthlyOnDay] = useState("Sunday");

    // Multiple Runs
    const [runCount, setRunCount] = useState(4);
    const [runTimes, setRunTimes] = useState(["00:00", "06:00", "12:00", "18:00"]);
    
    // SMTP Form State
    const [smtpForm, setSmtpForm] = useState({
    senderName: "",
    senderEmail: "",
    replyToEmail: "",
    securityProtocol: "TLS",
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: ""
});

    const handleSmtpChange = (e) => {
        setSmtpForm({ ...smtpForm, [e.target.name]: e.target.value });
    };
    useEffect(() => {
    let cancelled = false;

    const loadSmtpConfig = async () => {
        try {
            const response = await api.get("/settings/smtp/");

            if (cancelled) {
                return;
            }

            const data = response.data || {};

            setSmtpForm({
                senderName: data.senderName || "",
                senderEmail: data.senderEmail || "",
                replyToEmail: data.replyToEmail || "",
                securityProtocol: data.securityProtocol || "TLS",
                smtpHost: data.smtpHost || "",
                smtpPort: data.smtpPort || "587",
                smtpUsername: data.smtpUsername || "",
                smtpPassword: ""
            });

        } catch (error) {
            console.error(
                "Failed to load SMTP configuration:",
                error
            );
        }
    };

    loadSmtpConfig();

    return () => {
        cancelled = true;
    };
}, []);

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
const handleManualRun = async () => {
    if (runLocked) {
        return;
    }

    setStartingUp(true);
    clearTimeout(startupTimerRef.current);

    try {
        const result = await triggerRun();

        if (result?.status === "started") {
            startupTimerRef.current = setTimeout(
                () => setStartingUp(false),
                RUN_STARTUP_LOCK_MS
            );

            setIsRunning(true);
            setShowLogs(true);

            fastPollUntilRef.current = Date.now() + LOG_POLL_STARTUP_GRACE_MS;

            setPopupMessage(
                "Manual run started successfully."
            );

            return;
        }

        setStartingUp(false);

        if (result?.status === "already_running") {
            setIsRunning(true);
            setShowLogs(true);

            fastPollUntilRef.current = Date.now() + LOG_POLL_STARTUP_GRACE_MS;

            setPopupMessage(
                "The SEC watcher is already running."
            );

            return;
        }

        setPopupMessage(
            result?.message ||
            "Unable to determine watcher status."
        );

    } catch (error) {
        setStartingUp(false);

        console.error(
            "Failed to start manual run:",
            error
        );

        setPopupMessage(
            error.response?.data?.message ||
            "Failed to start the manual run."
        );
    }
};
    // FE-006: adaptive log polling.
    // - 1.5 s while a run is active or just started (same as before).
    // - 10 s when idle or when the browser tab is hidden.
    // - Next request starts only after the previous one finishes.
    useEffect(() => {
        let cancelled = false;
        let timer = null;
        let inFlight = false;
        let lastRunning = false;

        const scheduleNext = () => {
            if (cancelled) return;

            clearTimeout(timer);

            const fast =
                !document.hidden &&
                (lastRunning || Date.now() < fastPollUntilRef.current);

            timer = setTimeout(
                fetchLogs,
                fast ? LOG_POLL_ACTIVE_MS : LOG_POLL_IDLE_MS
            );
        };

        const fetchLogs = async () => {
            if (cancelled || inFlight) return;

            inFlight = true;

            try {
                const response = await api.get("/runs/logs/");

                if (!cancelled && response.data) {
                    const logText = response.data.logs || "";
                    const running = Boolean(response.data.is_running);

                    lastRunning = running;

                    setLogs(logText);
                    setIsRunning(running);

                    // Show logs while running, and keep showing the
                    // last run's log after it finishes or after reload.
                    if (running || logText) {
                        setShowLogs(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch watcher logs:", error);
            } finally {
                inFlight = false;
                scheduleNext();
            }
        };

        const handleVisibility = () => {
            if (!document.hidden) {
                clearTimeout(timer);
                fetchLogs();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        fetchLogs();

        return () => {
            cancelled = true;
            clearTimeout(timer);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        api.get("/settings/schedule/")
            .then(res => {
                if(res.data && Object.keys(res.data).length > 0) {
                    const d = res.data;
                    if(d.frequency) setFreq(d.frequency);
                    if(d.start_date) setStartDate(d.start_date);
                    if(d.start_time) setStartTime(d.start_time);
                    if(d.sync_zone !== undefined) setSyncZone(d.sync_zone);
                    if(d.daily_recur) setDailyRecur(d.daily_recur);
                    if(d.weekly_recur) setWeeklyRecur(d.weekly_recur);
                    if(d.weekly_days) setWeeklyDays(d.weekly_days);
                    if(d.monthly_type) setMonthlyType(d.monthly_type);
                    if(d.monthly_months) setMonthlyMonths(d.monthly_months);
                    if(d.monthly_days) setMonthlyDays(d.monthly_days);
                    if(d.monthly_on_week) setMonthlyOnWeek(d.monthly_on_week);
                    if(d.monthly_on_day) setMonthlyOnDay(d.monthly_on_day);
                    if(d.run_count) setRunCount(d.run_count);
                    if(d.run_times) setRunTimes(d.run_times);
                }
            })
            .catch(e => console.error("Failed to load schedule config:", e));
    }, []);

    const handleSave = async () => {
        try {
            await api.post("/settings/schedule/", {
                frequency: freq,
                start_date: startDate,
                start_time: startTime,
                sync_zone: syncZone,
                daily_recur: dailyRecur,
                weekly_recur: weeklyRecur,
                weekly_days: weeklyDays,
                monthly_type: monthlyType,
                monthly_months: monthlyMonths,
                monthly_days: monthlyDays,
                monthly_on_week: monthlyOnWeek,
                monthly_on_day: monthlyOnDay,
                run_count: runCount,
                run_times: runTimes,
                is_active: enabled
            });
            setPopupMessage("Schedule saved.");
            if (enabled) {
                // Restart with new interval
                startAutomation();
            }
        } catch (e) {
            console.error(e);
            setPopupMessage("Failed to save schedule.");
        }
    };


   const handleRunCountChange = (e) => {
    const count = Math.min(
        Math.max(parseInt(e.target.value) || 1, 1),
        4
    );

    setRunCount(count);

    const newTimes = [];

    for (let i = 0; i < count; i++) {
        const totalHours = i * 6;

        const hour = String(totalHours).padStart(2, "0");

        newTimes.push(`${hour}:00`);
    }

    setRunTimes(newTimes);
};

    const handleRunTimeChange = (idx, val) => {
        const newTimes = [...runTimes];
        newTimes[idx] = val;
        setRunTimes(newTimes);
    };

    // Generate preview text
    let previewRule = "";
    if (freq === "onetime") {
        previewRule = "Once at the scheduled start time";
    } else if (freq === "daily") {
        previewRule = `Every ${dailyRecur} day(s)`;
    } else if (freq === "weekly") {
        const days = Object.entries(weeklyDays).filter(([_, v]) => v).map(([k, _]) => k.charAt(0).toUpperCase() + k.slice(1, 3));
        previewRule = days.length ? `Every ${weeklyRecur} week(s) on ${days.join(', ')}` : "No day selected";
    } else {
        if (monthlyType === 'days') {
            previewRule = `Months: ${monthlyMonths}, Days: ${monthlyDays}`;
        } else {
            previewRule = `Months: ${monthlyMonths}, On: ${monthlyOnWeek} ${monthlyOnDay}`;
        }
    }

    return (
        <section className="content page" id="page-schedule">
            <div className="auto-banner" style={{ background: enabled ? "rgba(90,201,153,.06)" : "rgba(226,105,90,.06)", borderColor: enabled ? "rgba(90,201,153,.3)" : "rgba(226,105,90,.3)" }}>
                <span className="bd" style={{ background: enabled ? "var(--green)" : "var(--red)" }}></span>
               <div>
    Automation is <b>{enabled ? "enabled" : "paused"}</b>.
    {
        enabled
            ? " Scheduled runs will follow the saved automation schedule."
            : " Start automation to resume scheduled runs."
    }
</div>
            </div>

            <div className="card" style={{ marginBottom: "24px" }}>
                <div className="card-h" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <h3 style={{ margin: 0 }}>Schedule Automation</h3>
                        <span className="hint" style={{ margin: 0 }}>Coordinator</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: enabled ? "var(--text)" : "var(--dim)" }}>
                            {enabled ? "Background Schedule: ON" : "Background Schedule: OFF"}
                        </span>
                        <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px" }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={enabled} onChange={async (e) => {
                                setShowLogs(false);
                                const newEnabled = e.target.checked;
                                
                                try {
                                    await api.post("/settings/schedule/", {
                                        frequency: freq,
                                        start_date: startDate,
                                        start_time: startTime,
                                        sync_zone: syncZone,
                                        daily_recur: dailyRecur,
                                        weekly_recur: weeklyRecur,
                                        weekly_days: weeklyDays,
                                        monthly_type: monthlyType,
                                        monthly_months: monthlyMonths,
                                        monthly_days: monthlyDays,
                                        monthly_on_week: monthlyOnWeek,
                                        monthly_on_day: monthlyOnDay,
                                        run_count: runCount,
                                        run_times: runTimes,
                                        is_active: newEnabled
                                    });
                                    
                                    if (newEnabled) startAutomation();
                                    else pauseAutomation();
                                } catch (err) {
                                    setPopupMessage("Failed to sync toggle with server.");
                                }
                            }} />
                            <span style={{ 
                                position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                                backgroundColor: enabled ? "var(--accent)" : "rgba(255,255,255,0.1)", 
                                transition: ".4s", borderRadius: "24px" 
                            }}>
                                <span style={{
                                    position: "absolute", content: '""', height: "18px", width: "18px", 
                                    left: enabled ? "23px" : "3px", bottom: "3px", backgroundColor: "#fff", 
                                    transition: ".4s", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>
                <div className="card-b" style={{ padding: "16px 24px" }}>
                    
                    <div style={{ display: "flex", gap: "24px" }}>
                        
                        {/* LEFT PANEL: Radio buttons */}
                        <div style={{ flex: "0 0 130px", borderRight: "1px solid rgba(255,255,255,0.05)", paddingRight: "16px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", color: "var(--dim)" }}>Settings</label>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {['onetime', 'daily', 'weekly', 'monthly'].map(f => (
                                    <label key={f} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px" }}>
                                        <input type="radio" name="freq" value={f} checked={freq === f} onChange={() => setFreq(f)} />
                                        {f === 'onetime' ? 'One time' : f.charAt(0).toUpperCase() + f.slice(1)}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT PANEL: Settings for frequency */}
                        <div style={{ flex: 1 }}>
                            
                            {/* Global Start Date/Time */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                <span style={{ fontSize: "13px", fontWeight: "500", width: "50px" }}>Start:</span>
                                <input type="date" className="search" style={{ width: "130px", padding: "4px 8px" }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <input type="time" className="search" style={{ width: "110px", padding: "4px 8px" }} value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>

                            {/* Frequency Specific Settings Box */}
                            <div style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "6px", minHeight: "75px" }}>
                                
                                {/* Daily Settings */}
                                {freq === "daily" && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <span style={{ fontSize: "13px" }}>Recur every:</span>
                                        <input type="number" className="search" style={{ width: "70px", textAlign: "center" }} min="1" value={dailyRecur} onChange={e => setDailyRecur(e.target.value)} />
                                        <span style={{ fontSize: "13px" }}>days</span>
                                    </div>
                                )}

                            {/* Weekly Settings */}
                            {freq === "weekly" && (
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                        <span style={{ fontSize: "13px" }}>Recur every:</span>
                                        <input type="number" className="search" style={{ width: "70px", textAlign: "center" }} min="1" value={weeklyRecur} onChange={e => setWeeklyRecur(e.target.value)} />
                                        <span style={{ fontSize: "13px" }}>weeks on:</span>
                                    </div>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                            <label key={day} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                                                <input type="checkbox" checked={weeklyDays[day.toLowerCase().substring(0,3)]} onChange={e => setWeeklyDays({...weeklyDays, [day.toLowerCase().substring(0,3)]: e.target.checked})} />
                                                {day}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Monthly Settings */}
                            {freq === "monthly" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <span style={{ fontSize: "13px", width: "60px" }}>Months:</span>
                                        <select className="search" style={{ width: "200px" }} value={monthlyMonths} onChange={e => setMonthlyMonths(e.target.value)}>
                                            <option>All months</option>
                                            <option>Select months...</option>
                                        </select>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", opacity: monthlyType === 'days' ? 1 : 0.5 }}>
                                        <input type="radio" name="monthlyType" value="days" checked={monthlyType === 'days'} onChange={() => setMonthlyType('days')} />
                                        <span style={{ fontSize: "13px", width: "40px" }}>Days:</span>
                                        <input type="text" className="search" style={{ flex: 1 }} value={monthlyDays} onChange={e => setMonthlyDays(e.target.value)} disabled={monthlyType !== 'days'} />
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", opacity: monthlyType === 'on' ? 1 : 0.5 }}>
                                        <input type="radio" name="monthlyType" value="on" checked={monthlyType === 'on'} onChange={() => setMonthlyType('on')} />
                                        <span style={{ fontSize: "13px", width: "40px" }}>On:</span>
                                        <select className="search" style={{ width: "120px" }} value={monthlyOnWeek} onChange={e => setMonthlyOnWeek(e.target.value)} disabled={monthlyType !== 'on'}>
                                            <option>First</option>
                                            <option>Second</option>
                                            <option>Third</option>
                                            <option>Fourth</option>
                                            <option>Last</option>
                                        </select>
                                        <select className="search" style={{ width: "140px" }} value={monthlyOnDay} onChange={e => setMonthlyOnDay(e.target.value)} disabled={monthlyType !== 'on'}>
                                            <option>Sunday</option>
                                            <option>Monday</option>
                                            <option>Tuesday</option>
                                            <option>Wednesday</option>
                                            <option>Thursday</option>
                                            <option>Friday</option>
                                            <option>Saturday</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                                {/* One Time Settings */}
                                {freq === "onetime" && (
                                    <div style={{ fontSize: "13px", color: "var(--dim)" }}>
                                        Task will run once at the specified start time.
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Multiple Run Times block */}
                    {freq !== "onetime" && (
                        <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <h4 style={{ margin: 0, fontSize: "13px" }}>Run Time(s)</h4>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ fontSize: "12px", color: "var(--dim)" }}>Total runs per day:</span>
                                    <input type="number" className="search" style={{ width: "60px", textAlign: "center", padding: "2px 6px" }} min="1" max="4" value={runCount} onChange={handleRunCountChange} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                                {runTimes.map((time, idx) => (
                                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "rgba(255,255,255,0.02)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                                        <span style={{ fontSize: "12px", color: "var(--dim)", width: "45px" }}>Run {idx + 1}</span>
                                        <input type="time" className="search" style={{ flex: 1, padding: "2px 6px" }} value={time} onChange={(e) => handleRunTimeChange(idx, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PREVIEW BLOCK */}
                    <div style={{ marginTop: "16px", backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "12px 16px" }}>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--accent)" }}>Schedule Preview</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                            <div><span style={{ color: "var(--dim)", width: "80px", display: "inline-block" }}>Frequency:</span> <span style={{ color: "var(--text)", fontWeight: "500" }}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</span></div>
                            <div><span style={{ color: "var(--dim)", width: "80px", display: "inline-block" }}>Runs:</span> <span style={{ color: "var(--text)" }}>{runCount} time(s) on each scheduled day</span></div>
                            <div><span style={{ color: "var(--dim)", width: "80px", display: "inline-block" }}>Run On:</span> <span style={{ color: "var(--text)" }}>{previewRule}</span></div>
                            <div><span style={{ color: "var(--dim)", width: "80px", display: "inline-block" }}>Run Times:</span> <span style={{ color: "var(--text)" }}>{runTimes.map(t => {
                                let [h, m] = t.split(':');
                                let suffix = h >= 12 ? 'PM' : 'AM';
                                h = h % 12 || 12;
                                return `${String(h).padStart(2,'0')}:${m} ${suffix}`;
                            }).join(", ")}</span></div>
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button className="btn btn-primary" onClick={handleSave}>Save Schedule</button>
                    </div>

                </div>
            </div>

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
                            <input type="password" className="search" style={{ width: "100%", padding: "4px 8px" }} placeholder="Leave blank to keep existing" name="smtpPassword" value={smtpForm.smtpPassword} onChange={handleSmtpChange} />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                        <button className="btn" onClick={handleTestConnection}>Test Connection</button>
                        <button className="btn btn-primary" onClick={handleSaveConfig}>Save Configuration</button>
                    </div>
                </div>
            </div>

            <div className="save-bar" style={{ display: "flex", gap: "24px", justifyContent: "flex-end", alignItems: "center" }}>
               <button
    className="btn"
    style={{
        marginLeft: "auto",
        border: `1px solid ${runLocked ? "rgba(255,255,255,0.2)" : "var(--accent)"}`,
        color: runLocked ? "var(--dim)" : "var(--accent)",
        cursor: runLocked ? "not-allowed" : "pointer",
        opacity: runLocked ? 0.6 : 1
    }}
    disabled={runLocked}
    onClick={handleManualRun}
>
    {isRunning ? "● Running..." : (startingUp ? "● Starting..." : "▶ Run Now")}
</button>
            </div>

            <div className="card" style={{ marginTop: "24px", marginBottom: "24px" }}>
                <div className="card-h" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h3 style={{ margin: 0, display: "inline-block" }}>Live Automation Logs</h3>
                        <span className="hint" style={{ marginLeft: "8px" }}>Terminal</span>
                    </div>
                    <span style={{ 
                        fontSize: "12px", 
                        fontWeight: "600",
                        padding: "4px 10px", 
                        borderRadius: "12px", 
                        backgroundColor: isRunning ? "rgba(102, 217, 168, 0.1)" : (enabled ? "rgba(255, 255, 255, 0.05)" : "rgba(235, 163, 54, 0.1)"),
                        color: isRunning ? "#66d9a8" : (enabled ? "var(--dim)" : "#eba336"),
                        border: `1px solid ${isRunning ? "rgba(102, 217, 168, 0.2)" : (enabled ? "rgba(255, 255, 255, 0.1)" : "rgba(235, 163, 54, 0.2)")}`
                    }}>
                        {isRunning ? "● Running Now" : (enabled ? "○ Standby (Scheduled)" : "⏸ Scheduler Paused")}
                    </span>
                </div>
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
                        {showLogs ? logs : (enabled ? "Waiting for next scheduled trigger time..." : "Automation is currently disabled. Toggle ON to resume background schedule.")}
                    </div>
                </div>
            </div>

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