import { useEffect, useState } from "react";
import api from "../api/axios";
import "../styles/accuracy.css";

/*
    The Auditor's report.

    Separate from Filings on purpose: different audience, different
    cadence. Someone clearing the daily review queue does not need
    accuracy trends.

    The category rail is the hero because the failure this page exists
    to catch is ONE category falling while the average holds. An
    overall number at the top would bury exactly that.
*/

const pct = (v) =>
    v === null || v === undefined ? "—" : `${(v * 100).toFixed(1)}%`;

function Gauge({ value, bar, thin }) {
    if (value === null || value === undefined) {
        return <div className="gauge"><div className="gauge-track" /></div>;
    }

    const below = !thin && bar !== undefined && value < bar;

    return (
        <div className="gauge">
            <div className="gauge-track">
                <div
                    className={
                        "gauge-fill " + (thin ? "thin" : below ? "low" : "ok")
                    }
                    style={{ width: `${Math.min(100, value * 100)}%` }}
                />
            </div>
            {/* The bar sits on the track, so "is it passing" is read
                from position rather than by comparing two numbers. */}
            {bar !== undefined && (
                <div className="gauge-mark" style={{ left: `${bar * 100}%` }} />
            )}
        </div>
    );
}

function Spark({ points }) {
    const w = 110;
    const h = 22;

    if (!points || points.length < 2) {
        return (
            <svg className="spark" width={w} height={h}>
                <text className="spark-empty" x="0" y="15">
                    one window
                </text>
            </svg>
        );
    }

    const step = w / (points.length - 1);
    const d = points
        .map((p, i) => {
            const y = h - 2 - (p.agreement_rate || 0) * (h - 4);
            return `${i ? "L" : "M"}${(i * step).toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    return (
        <svg className="spark" width={w} height={h} aria-hidden="true">
            <path d={d} />
        </svg>
    );
}

function Accuracy() {
    const [days, setDays] = useState(90);
    const [data, setData] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const [summary, disagreements] = await Promise.all([
                    api.get("/audit/summary/", { params: { days } }),
                    api.get("/audit/disagreements/"),
                ]);

                if (!cancelled) {
                    setData(summary.data);
                    setRows(disagreements.data?.results ?? []);
                }
            } catch (err) {
                console.error("Failed to load the audit report", err);
                if (!cancelled) {
                    setError(
                        "The audit report did not load. Check that the backend is running."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [days]);

    if (loading) {
        return <div className="acc"><p className="acc-empty">Loading the audit report…</p></div>;
    }

    if (error) {
        return <div className="acc"><p className="acc-empty">{error}</p></div>;
    }

    if (!data?.latest_run) {
        return (
            <div className="acc">
                <div className="acc-head"><h1>Accuracy</h1></div>
                <div className="acc-empty">
                    No audit has run yet. Run the Auditor to compare the
                    Interpreter against an independent read of the same
                    filings.
                    <code>python manage.py audit --sample 100</code>
                </div>
            </div>
        );
    }

    const run = data.latest_run;
    const bars = data.bars;
    const floor = bars.min_sample_for_alarm;
    const categories = [...(data.categories || []), "OVERALL"];

    return (
        <div className="acc">
            <div className="acc-head">
                <h1>Accuracy</h1>
                <dl className="acc-meta">
                    <div>
                        <dt>Last run</dt>
                        <dd>{new Date(run.started_at).toLocaleString()}</dd>
                    </div>
                    <div>
                        <dt>Checked</dt>
                        <dd>
                            {run.classification_checked} of {run.sampled_count}
                        </dd>
                    </div>
                    <div>
                        <dt>Audit model</dt>
                        <dd>{run.auditor_model_name}</dd>
                    </div>
                    <div>
                        <dt>Prompt</dt>
                        <dd>{run.auditor_prompt_version}</dd>
                    </div>
                    <div>
                        <dt>Taxonomy</dt>
                        <dd>{run.taxonomy_version}</dd>
                    </div>
                </dl>
            </div>

            <div className="acc-controls">
                <label htmlFor="acc-window" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                    Window
                </label>
                <select
                    id="acc-window"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                >
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={180}>Last 180 days</option>
                    <option value={365}>Last year</option>
                </select>
            </div>

            <section className="acc-section">
                <h2>Agreement by category</h2>
                <p className="note">
                    How often an independent read of the same filing reaches the
                    Interpreter's answer. The tick on each bar is the level that
                    category is held to. Hatched bars are samples too small to
                    judge — under {floor} filings.
                </p>

                <div className="rail">
                    {categories.map((category) => {
                        const latest = data.latest?.[category];
                        const trend = data.trend?.[category] ?? [];
                        const isOverall = category === "OVERALL";
                        const bar = isOverall ? bars.overall : bars.per_category;

                        if (!latest) {
                            return (
                                <div className="rail-row" key={category}>
                                    <div className="rail-name">
                                        {category}
                                        <small>not in the latest sample</small>
                                    </div>
                                    <div className="gauge">
                                        <div className="gauge-track" />
                                    </div>
                                    <div className="rail-rate">—</div>
                                    <div />
                                    <div />
                                </div>
                            );
                        }

                        const thin = latest.sample_size < floor;

                        return (
                            <div
                                className={"rail-row" + (isOverall ? " is-overall" : "")}
                                key={category}
                            >
                                <div className="rail-name">
                                    {category}
                                    {thin && <small>too few to judge</small>}
                                </div>
                                <Gauge
                                    value={latest.agreement_rate}
                                    bar={bar}
                                    thin={thin}
                                />
                                <div className="rail-rate">
                                    {pct(latest.agreement_rate)}
                                </div>
                                <Spark points={trend} />
                                <div className="rail-n">n={latest.sample_size}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="acc-section">
                <h2>Summary grounding</h2>
                <p className="note">
                    Claims in the generated summaries that appear in the filing
                    text. A summary that leaves a fact out is not counted; only
                    one that states something the filing does not.
                </p>
                <div className="rail">
                    <div className="rail-row is-overall">
                        <div className="rail-name">
                            Grounded claims
                            <small>
                                {data.grounding.grounded_claims} of{" "}
                                {data.grounding.total_claims}
                            </small>
                        </div>
                        <Gauge
                            value={data.grounding.rate}
                            bar={bars.grounding}
                            thin={data.grounding.total_claims < floor}
                        />
                        <div className="rail-rate">{pct(data.grounding.rate)}</div>
                        <div />
                        <div />
                    </div>
                </div>
            </section>

            <section className="acc-section">
                <h2>Confidence calibration</h2>
                {data.calibration_monotonic === false && (
                    <p className="warn">
                        Agreement is not rising with confidence. If that holds at
                        a real sample size, the confidence score is not telling
                        you which filings are wrong, and the review queue is
                        sending people to the wrong ones.
                    </p>
                )}
                <div className="ladder">
                    {(data.calibration || []).map((band) => (
                        <div className="ladder-row" key={band.band}>
                            <div className="ladder-label">{band.band}</div>
                            <div className="ladder-bar">
                                <span
                                    style={{
                                        width: `${(band.agreement_rate || 0) * 100}%`,
                                    }}
                                />
                            </div>
                            <div className="ladder-rate">
                                {pct(band.agreement_rate)}
                            </div>
                            <div className="ladder-n">n={band.sample_size}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="acc-section">
                <h2>Where the two reads differ</h2>
                <p className="note">
                    A rate tells you something moved. These tell you which
                    boundary, and which filings to open.
                </p>

                {data.confusion.length === 0 ? (
                    <p className="acc-empty">
                        Both reads agreed on every filing in the latest sample.
                    </p>
                ) : (
                    <div className="flows">
                        {data.confusion.map((row) => (
                            <div
                                className="flow"
                                key={`${row.predicted}-${row.actual}`}
                            >
                                <div className="flow-from">{row.predicted}</div>
                                <div className="flow-arrow">&gt;</div>
                                <div className="flow-to">{row.actual}</div>
                                <div className="flow-count">{row.count}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {rows.length > 0 && (
                <section className="acc-section">
                    <h2>Filings to read</h2>
                    <p className="note">
                        Open a few of these and decide who is right. Until
                        someone does, the agreement rate says the two reads
                        differ, not which one is wrong.
                    </p>
                    <table className="acc-table">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Accession</th>
                                <th>Interpreter</th>
                                <th>Confidence</th>
                                <th>Independent read</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.slice(0, 25).map((row) => (
                                <tr key={row.id}>
                                    <td>{row.ticker}</td>
                                    <td className="mono">
                                        <a
                                            href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&filenum=${row.accession}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {row.accession}
                                        </a>
                                    </td>
                                    <td>{row.interpreter_category}</td>
                                    <td className="mono">
                                        {row.interpreter_confidence === null
                                            ? "—"
                                            : row.interpreter_confidence.toFixed(2)}
                                    </td>
                                    <td style={{ color: "var(--amber)" }}>
                                        {row.auditor_category}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}

export default Accuracy;
