/*
 * FE-008: the live log terminal, moved out of Schedule.jsx.
 *
 * Presentational only. terminalRef is created in Schedule.jsx and
 * passed down so the existing auto-scroll effect keeps working against
 * the same DOM node.
 */
function LogTerminal({
    logs,
    showLogs,
    isRunning,
    enabled,
    terminalRef,
}) {

    return (
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
    );
}

export default LogTerminal;