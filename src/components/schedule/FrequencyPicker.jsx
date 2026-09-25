/*
    I-08: the frequency picker, moved out of Schedule.jsx.

    Presentational only. Every piece of state and every setter still
    lives in Schedule.jsx and is passed in, grouped by frequency so the
    signature stays readable instead of taking 32 separate props. The
    rendered output is identical to what was inline before.
*/
function FrequencyPicker({
    common,
    interval,
    daily,
    weekly,
    monthly,
}) {

    const { freq, setFreq, startDate, setStartDate,
            startTime, setStartTime, syncZone, setSyncZone } = common;

    const { intervalMinutes, setIntervalMinutes,
            windowStart, setWindowStart,
            windowEnd, setWindowEnd,
            nightlySweep, setNightlySweep } = interval;

    const { dailyRecur, setDailyRecur } = daily;

    const { weeklyRecur, setWeeklyRecur,
            weeklyDays, setWeeklyDays } = weekly;

    const { monthlyMonths, setMonthlyMonths,
            monthlyType, setMonthlyType,
            monthlyDays, setMonthlyDays,
            monthlyOnWeek, setMonthlyOnWeek,
            monthlyOnDay, setMonthlyOnDay } = monthly;

    return (
        <div style={{ display: "flex", gap: "24px" }}>

            {/* LEFT PANEL: Radio buttons */}
            <div style={{ flex: "0 0 130px", borderRight: "1px solid rgba(255,255,255,0.05)", paddingRight: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", color: "var(--dim)" }}>Settings</label>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {['onetime', 'interval', 'daily', 'weekly', 'monthly'].map(f => (
                        <label key={f} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px" }}>
                            <input type="radio" name="freq" value={f} checked={freq === f} onChange={() => setFreq(f)} />
                            {f === 'onetime' ? 'One time' : f === 'interval' ? 'Intraday' : f.charAt(0).toUpperCase() + f.slice(1)}
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

                    {/* Intraday Interval Settings (W-037 / R-08, R-09) */}
                    {freq === "interval" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                <span style={{ fontSize: "13px" }}>Poll every:</span>
                                <select className="search" style={{ width: "110px" }} value={intervalMinutes} onChange={e => setIntervalMinutes(Number(e.target.value))}>
                                    {[5, 10, 15, 20, 30, 60].map(m => (
                                        <option key={m} value={m}>{m} min</option>
                                    ))}
                                </select>
                                <span style={{ fontSize: "13px", color: "var(--dim)" }}>Mon-Fri, market time</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                <span style={{ fontSize: "13px" }}>Active window:</span>
                                <input type="time" className="search" style={{ width: "110px", padding: "4px 8px" }} value={windowStart} onChange={e => setWindowStart(e.target.value)} />
                                <span style={{ fontSize: "13px" }}>to</span>
                                <input type="time" className="search" style={{ width: "110px", padding: "4px 8px" }} value={windowEnd} onChange={e => setWindowEnd(e.target.value)} />
                            </div>

                            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px" }}>
                                <input type="checkbox" checked={nightlySweep} onChange={e => setNightlySweep(e.target.checked)} />
                                Nightly catch-up sweep at 22:30 ET (includes weekends)
                            </label>

                            <div className="hint" style={{ marginTop: "10px", fontSize: "12px" }}>
                                The window end hour is inclusive, so 21:00 polls through 21:59 ET.
                            </div>
                        </div>
                    )}

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
    );
}

export default FrequencyPicker;