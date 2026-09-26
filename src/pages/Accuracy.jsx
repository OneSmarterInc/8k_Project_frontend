import { useEffect, useState } from "react";
import api from "../api/axios";

/*
    The Auditor's report.

    Deliberately a separate page from Filings: different audience,
    different cadence. Someone clearing the daily review queue does not
    need accuracy trends, and putting them there would be noise.

    Per-category is the primary view, not overall. The failure this
    exists to catch is one category quietly falling while the average
    holds, because that category is a small share of volume.
*/

const PCT = (value) =>
    value === null || value === undefined ? "—" : `${(value * 100).toFixed(1)}%`;

function Bar({ value, bar }) {
    // A rate is easier to read against its bar than as a bare number.
    if (value === null || value === undefined) {
        return <span style={{ color: "#888" }}>—</span>;
    }

    const below = bar !== undefined && value < bar;

    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
                style={{
                    display: "inline-block",
                    width: 90,
                    height: 8,
                    background: "#eee",
                    borderRadius: 4,
                    overflow: "hidden",
                }}
            >
                <span
                    style={{
                        display: "block",
                        width: `${Math.min(100, value * 100)}%`,
                        height: "100%",
                        background: below ? "#c0392b" : "#27ae60",
                    }}
                />
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {PCT(value)}
            </span>
        </span>
    );
}

function Sparkline({ points }) {
    if (!points || points.length < 2) {
        return <span style={{ color: "#888" }}>not enough windows</span>;
    }

    const width = 120;
    const height = 24;
    const step = width / (points.length - 1);

    const path = points
        .map((p, i) => {
            const y = height - (p.agreement_rate || 0) * height;
            return `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    return (
        <svg width={width} height={height} style={{ verticalAlign: "middle" }}>
            <path d={path} fill="none" stroke="#2c3e50" strokeWidth="1.5" />
        </svg>
    );
}

function Accuracy() {
    const [days, setDays] = useState(90);
    const [data, setData] = useState(null);
    const [disagreements, setDisagreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const [summary, rows] = await Promise.all([
                    api.get("/audit/summary/", { params: { days } }),
                    api.get("/audit/disagreements/"),
                ]);

                if (!cancelled) {
                    setData(summary.data);
                    setDisagreements(rows.data?.results ?? []);
                }
            } catch (err) {
                console.error("Failed to load audit summary", err);
                if (!cancelled) {
                    setError(
                        "Could not load the audit report. The backend may be unavailable."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [days]);

    if (loading) {
        return <p>Loading audit report…</p>;
    }

    if (error) {
        return <p style={{ color: "#c0392b" }}>{error}</p>;
    }

    if (!data?.latest_run) {
        return (
            <div>
                <h1>Accuracy</h1>
                <p>
                    No audit has run yet. Run{" "}
                    <code>python manage.py audit --sample 100</code> to produce
                    the first report.
                </p>
            </div>
        );
    }

    const run = data.latest_run;
    const bars = data.bars;
    const categories = [...(data.categories || []), "OVERALL"];

    return (
        <div>
            <h1>Accuracy</h1>

            {/* Version context first. When a rate moves, the first
                question is whether the system changed or the filings
                did — and that is unanswerable without these. */}
            <p style={{ color: "#555", fontSize: 13 }}>
                Last run {new Date(run.started_at).toLocaleString()} ·{" "}
                {run.status} · {run.sampled_count} sampled ·{" "}
                {run.classification_checked} checked · taxonomy{" "}
                {run.taxonomy_version} · audit prompt{" "}
                {run.auditor_prompt_version} · {run.auditor_model_name}
                {run.error_count > 0 && (
                    <span style={{ color: "#c0392b" }}>
                        {" "}· {run.error_count} error(s)
                    </span>
                )}
            </p>

            <label style={{ fontSize: 13 }}>
                Window{" "}
                <select
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                >
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                    <option value={365}>365 days</option>
                </select>
            </label>

            <h2>Agreement by category</h2>
            <table width="100%" cellPadding="6">
                <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                        <th>Category</th>
                        <th>Agreement</th>
                        <th>n</th>
                        <th>Trend</th>
                        <th>Grounding</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => {
                        const latest = data.latest?.[category];
                        const trend = data.trend?.[category] ?? [];
                        const bar =
                            category === "OVERALL"
                                ? bars.overall
                                : bars.per_category;

                        if (!latest) {
                            return (
                                <tr key={category}>
                                    <td>{category}</td>
                                    <td colSpan="4" style={{ color: "#888" }}>
                                        not sampled in the latest run
                                    </td>
                                </tr>
                            );
                        }

                        /* A sample below the alarm floor is shown but
                           not judged: three wrong out of four is 25%
                           and means nothing. */
                        const thin =
                            latest.sample_size < bars.min_sample_for_alarm;

                        return (
                            <tr
                                key={category}
                                style={{ borderBottom: "1px solid #f0f0f0" }}
                            >
                                <td>
                                    <strong>{category}</strong>
                                </td>
                                <td>
                                    <Bar
                                        value={latest.agreement_rate}
                                        bar={thin ? undefined : bar}
                                    />
                                </td>
                                <td>
                                    {latest.sample_size}
                                    {thin && (
                                        <span
                                            style={{
                                                color: "#888",
                                                fontSize: 12,
                                            }}
                                            title={`Below the ${bars.min_sample_for_alarm}-sample floor: too small to judge.`}
                                        >
                                            {" "}(thin)
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <Sparkline points={trend} />
                                </td>
                                <td>{PCT(latest.grounding_rate)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <h2>Summary grounding</h2>
            <p>
                <Bar
                    value={data.grounding.rate}
                    bar={bars.grounding}
                />{" "}
                <span style={{ color: "#555", fontSize: 13 }}>
                    {data.grounding.grounded_claims} of{" "}
                    {data.grounding.total_claims} claims in the generated
                    summaries appear in the filing text. A dropped fact is not
                    counted — only an invented one.
                </span>
            </p>

            <h2>Calibration</h2>
            {data.calibration_monotonic === false && (
                <p style={{ color: "#c0392b" }}>
                    Agreement does not rise with confidence. If this holds at a
                    real sample size, the confidence score is not informative
                    and the review queue is routing people to the wrong filings.
                </p>
            )}
            <table cellPadding="6">
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>Interpreter confidence</th>
                        <th>Agreement</th>
                        <th>n</th>
                    </tr>
                </thead>
                <tbody>
                    {(data.calibration || []).map((band) => (
                        <tr key={band.band}>
                            <td>{band.band}</td>
                            <td>{PCT(band.agreement_rate)}</td>
                            <td>{band.sample_size}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>Where they disagree</h2>
            {/* The actionable half: a rate says something moved, these
                say which filings to read. */}
            {data.confusion.length === 0 ? (
                <p style={{ color: "#888" }}>No disagreements in the latest run.</p>
            ) : (
                <ul>
                    {data.confusion.map((row) => (
                        <li key={`${row.predicted}-${row.actual}`}>
                            Interpreter said <strong>{row.predicted}</strong>,
                            auditor said <strong>{row.actual}</strong> ×
                            {row.count}
                        </li>
                    ))}
                </ul>
            )}

            <h3>Filings to read</h3>
            <table width="100%" cellPadding="6">
                <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                        <th>Ticker</th>
                        <th>Accession</th>
                        <th>Interpreter</th>
                        <th>Conf</th>
                        <th>Auditor</th>
                    </tr>
                </thead>
                <tbody>
                    {disagreements.slice(0, 25).map((row) => (
                        <tr key={row.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <td>{row.ticker}</td>
                            <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                                {row.accession}
                            </td>
                            <td>{row.interpreter_category}</td>
                            <td>
                                {row.interpreter_confidence === null
                                    ? "—"
                                    : row.interpreter_confidence.toFixed(2)}
                            </td>
                            <td>{row.auditor_category}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {disagreements.length === 0 && (
                <p style={{ color: "#888" }}>Nothing to read.</p>
            )}
        </div>
    );
}

export default Accuracy;
