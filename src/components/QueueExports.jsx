import { useCallback, useEffect, useState } from "react";

import {
    downloadQueueExport,
    getQueueExports,
    regenerateQueueExports
} from "../services/queueExportService";

/*
    W-038: Capture Queue Exports.

    A collapsible panel on the Filings page. The analyst picks a date
    range, sees every daily capture file the Watcher produced in that
    window, and downloads any of them as CSV.

    Purely additive: it fetches its own data and owns its own state, so
    nothing else on the page is affected if the endpoint is
    unavailable. It starts collapsed so the page looks unchanged until
    someone opens it.
*/

function isoDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
}

function formatSize(bytes) {
    if (typeof bytes !== "number") return "";
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

function QueueExports() {

    const [open, setOpen] = useState(false);

    const [startDate, setStartDate] = useState(isoDaysAgo(29));
    const [endDate, setEndDate] = useState(isoDaysAgo(0));

    const [files, setFiles] = useState([]);
    const [totalRows, setTotalRows] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState("");

    const load = useCallback(async () => {

        setLoading(true);
        setError("");

        try {
            const data = await getQueueExports(startDate, endDate);
            setFiles(data.files || []);
            setTotalRows(data.total_rows || 0);
        } catch (err) {
            setFiles([]);
            setTotalRows(0);
            setError(
                err?.response?.data?.detail ||
                "Could not load exports."
            );
        } finally {
            setLoading(false);
        }

    }, [startDate, endDate]);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    const [regenerating, setRegenerating] = useState(false);
    const [notice, setNotice] = useState("");

    /*
        A scheduled export can be missed - if the scheduler was down at
        22:30, the day's file stays at whatever it held when it last
        ran. This re-runs the export for the visible range and reloads
        the list. It cannot overwrite: a changed day gets a new
        revision, an unchanged day gets nothing.
    */
    const handleRegenerate = async () => {

        if (regenerating || loading) return;

        setRegenerating(true);
        setError("");
        setNotice("");

        try {
            const result = await regenerateQueueExports(startDate, endDate);
            const lines = result?.output || [];

            const written = lines.filter(l => l.includes("wrote")).length;

            setNotice(
                written > 0
                    ? `${written} export${written === 1 ? "" : "s"} written.`
                    : "Everything already up to date."
            );

            await load();
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                "Could not regenerate exports."
            );
        } finally {
            setRegenerating(false);
        }
    };

    const handleDownload = async (filename) => {

        if (downloading) return;

        setDownloading(filename);
        setError("");

        try {
            await downloadQueueExport(filename);
        } catch {
            setError(`Could not download ${filename}.`);
        } finally {
            setDownloading("");
        }
    };

    return (
        <div className="card" style={{ marginBottom: "20px" }}>

            <div
                className="card-h"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer"
                }}
                onClick={() => setOpen(!open)}
            >
                <div>
                    <h3 style={{ margin: 0, display: "inline-block" }}>
                        Capture Queue Exports
                    </h3>
                    <span className="hint" style={{ marginLeft: "8px" }}>
                        daily CSV of captured filings
                    </span>
                </div>

                <span style={{ fontSize: "12px", color: "var(--dim)" }}>
                    {open ? "▲ Hide" : "▼ Show"}
                </span>
            </div>

            {open && (
                <div className="card-b" style={{ padding: "16px 24px" }}>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "12px",
                            flexWrap: "wrap",
                            marginBottom: "16px"
                        }}
                    >
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "4px",
                                    color: "var(--dim)"
                                }}
                            >
                                From date
                            </label>
                            <input
                                type="date"
                                className="search"
                                style={{ padding: "4px 8px" }}
                                value={startDate}
                                max={endDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    marginBottom: "4px",
                                    color: "var(--dim)"
                                }}
                            >
                                To date
                            </label>
                            <input
                                type="date"
                                className="search"
                                style={{ padding: "4px 8px" }}
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn"
                            onClick={load}
                            disabled={loading}
                            style={{
                                border: "1px solid var(--accent)",
                                color: "var(--accent)",
                                cursor: loading ? "wait" : "pointer",
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? "Loading..." : "Apply range"}
                        </button>

                        <button
                            className="btn"
                            onClick={handleRegenerate}
                            disabled={regenerating || loading}
                            title="Re-run the export for this range. Never overwrites: a changed day gets a new revision."
                            style={{
                                cursor: (regenerating || loading) ? "wait" : "pointer",
                                opacity: (regenerating || loading) ? 0.6 : 1
                            }}
                        >
                            {regenerating ? "Regenerating..." : "↻ Regenerate"}
                        </button>

                        {files.length > 0 && (
                            <span
                                className="hint"
                                style={{ fontSize: "11px", marginLeft: "auto" }}
                            >
                                {files.length} export{files.length === 1 ? "" : "s"}
                                {" · "}
                                {totalRows} filing{totalRows === 1 ? "" : "s"}
                            </span>
                        )}
                    </div>

                    {notice && !error && (
                        <div
                            style={{
                                fontSize: "12px",
                                color: "var(--green, #66d9a8)",
                                marginBottom: "12px"
                            }}
                        >
                            {notice}
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#eba336",
                                marginBottom: "12px"
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {!loading && files.length === 0 && !error && (
                        <div
                            className="hint"
                            style={{ fontSize: "12px", padding: "8px 0" }}
                        >
                            No exports in this range. The nightly sweep writes
                            the day's file at 22:30 ET.
                        </div>
                    )}

                    {files.length > 0 && (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "13px"
                            }}
                        >
                            <thead>
                                <tr style={{ color: "var(--dim)" }}>
                                    <th style={{ textAlign: "left", padding: "6px 4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Market date</th>
                                    <th style={{ textAlign: "left", padding: "6px 4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>File</th>
                                    <th style={{ textAlign: "right", padding: "6px 4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Filings</th>
                                    <th style={{ textAlign: "right", padding: "6px 4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Size</th>
                                    <th style={{ textAlign: "right", padding: "6px 4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Download</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file) => (
                                    <tr
                                        key={file.filename}
                                        style={{
                                            borderTop: "1px solid rgba(255,255,255,0.05)",
                                            // A superseded revision is dimmed so the current
                                            // picture of a day is obvious at a glance. Both
                                            // stay downloadable: the older one is the record
                                            // of what was known when it was written.
                                            opacity: file.is_current === false ? 0.45 : 1
                                        }}
                                    >
                                        <td style={{ padding: "8px 4px" }}>
                                            {file.date}
                                            {file.is_current === false ? (
                                                <span
                                                    style={{
                                                        marginLeft: "8px",
                                                        fontSize: "11px",
                                                        padding: "2px 6px",
                                                        borderRadius: "10px",
                                                        color: "var(--dim)",
                                                        border: "1px solid rgba(255,255,255,0.12)"
                                                    }}
                                                    title={`Superseded by a later export (revision ${file.revision + 1} or higher). Kept as the record of what was known when it was written.`}
                                                >
                                                    superseded · rev {file.revision}
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        marginLeft: "8px",
                                                        fontSize: "11px",
                                                        padding: "2px 6px",
                                                        borderRadius: "10px",
                                                        color: "var(--green, #66d9a8)",
                                                        border: "1px solid rgba(102,217,168,0.3)"
                                                    }}
                                                    title="The current picture of this day"
                                                >
                                                    current{file.revision > 1 ? ` · rev ${file.revision}` : ""}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: "8px 4px", fontFamily: "monospace", color: "var(--dim)" }}>
                                            {file.filename}
                                        </td>
                                        <td style={{ padding: "8px 4px", textAlign: "right" }}>
                                            {file.rows === null ? "—" : file.rows}
                                        </td>
                                        <td style={{ padding: "8px 4px", textAlign: "right", color: "var(--dim)" }}>
                                            {formatSize(file.size_bytes)}
                                        </td>
                                        <td style={{ padding: "8px 4px", textAlign: "right" }}>
                                            <button
                                                className="btn"
                                                onClick={() => handleDownload(file.filename)}
                                                disabled={downloading === file.filename}
                                                style={{
                                                    padding: "3px 10px",
                                                    fontSize: "12px",
                                                    border: "1px solid var(--accent)",
                                                    color: "var(--accent)",
                                                    cursor: downloading === file.filename ? "wait" : "pointer",
                                                    opacity: downloading === file.filename ? 0.6 : 1
                                                }}
                                            >
                                                {downloading === file.filename ? "..." : "⬇ CSV"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default QueueExports;