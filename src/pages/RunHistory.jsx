import { useEffect, useState } from "react";
import api from "../api/axios";

function RunHistory() {
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRuns() {
            try {
                const response = await api.get("/runs/");
                setRuns(response.data);
            } catch (err) {
                console.error("Failed to fetch runs", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRuns();
    }, []);

    const [filter, setFilter] = useState("all");

    if (loading) {
        return <section className="content page" id="page-history">Loading...</section>;
    }

    const filteredRuns = runs.filter(run => {
        if (filter === "all") return true;
        if (filter === "success") return run.status === "completed";
        if (filter === "partial") return run.status === "partial";
        if (filter === "failed") return run.status === "failed";
        return true;
    });

    return (
        <section className="content page" id="page-history">
            <div className="filters" style={{ marginBottom: "16px" }}>
                <button className={`chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All runs</button>
                <button className={`chip ${filter === "success" ? "active" : ""}`} onClick={() => setFilter("success")}>Success</button>
                <button className={`chip ${filter === "partial" ? "active" : ""}`} onClick={() => setFilter("partial")}>Partial</button>
                <button className={`chip ${filter === "failed" ? "active" : ""}`} onClick={() => setFilter("failed")}>Failed</button>
            </div>
            <div className="tbl-wrap">
                <div className="tbl-scroll">
                    <table className="log">
                        <thead>
                            <tr>
                                <th>Run</th>
                                <th>Started</th>
                                <th className="num">Duration</th>
                                <th className="num">Detected</th>
                                <th className="num">Processed</th>
                                <th className="num">Summaries</th>
                                <th className="num">Emails</th>
                                <th>Status</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRuns.map(run => {
                                const started = new Date(run.started_at);
                                const completed = run.completed_at ? new Date(run.completed_at) : null;
                                let durationStr = "—";
                                if (completed) {
                                    const diffMs = completed - started;
                                    const diffSecs = Math.floor(diffMs / 1000);
                                    if (diffSecs < 60) durationStr = `${diffSecs}s`;
                                    else durationStr = `${Math.floor(diffSecs / 60)}m ${diffSecs % 60}s`;
                                }

                                const isOk = run.status === "completed";
                                const isFail = run.status === "failed";
                                const rstatClass = isOk ? "r-ok" : (isFail ? "r-fail" : "r-part");

                                let reason = "—";
                                if (isFail) {
                                    if (!run.completed_at) {
                                        reason = "Process aborted (Server restart)";
                                    } else {
                                        reason = "Processing failure";
                                    }
                                } else if (run.status === "partial") {
                                    reason = "Some files failed processing";
                                }

                                return (
                                    <tr key={run.id}>
                                        <td>run-{run.id}</td>
                                        <td>
                                            {started.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}{" "}
                                            {started.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                                        </td>
                                        <td className="num">{durationStr}</td>
                                        <td className="num">{run.files_detected}</td>
                                        <td className="num">{run.files_processed}</td>
                                        <td className="num">{run.summary_generated_count}</td>
                                        <td className="num">{run.email_sent_count}</td>
                                        <td>
                                            <span className={`rstat ${rstatClass}`}>
                                                {run.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: "var(--ink-3)", fontSize: "13px" }}>{reason}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredRuns.length === 0 && (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: "center", color: "var(--ink-3)" }}>
                                        No automation runs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

export default RunHistory;