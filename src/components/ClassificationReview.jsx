import { useEffect, useState } from "react";
import {
    getFilings,
    getTaxonomy,
    overrideClassification
} from "../services/filingService";

/*
    Guide Part 5: Classification tab of the Review Queue (staff only).

    Lists filings whose latest Interpreter answer needs a human (low
    confidence or unparseable). The reviewer confirms or corrects it.
    Each decision is saved as a separate override row; the model's
    answer is never edited.

    Every hook sits above every return (rules-of-hooks).
*/

function formatConfidence(value) {
    return typeof value === "number" ? value.toFixed(2) : "—";
}

function formatAmount(value) {
    if (typeof value !== "number") {
        return value ?? "—";
    }
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });
}

function firstError(data, fallback) {
    if (!data || typeof data !== "object") {
        return fallback;
    }
    if (data.detail) {
        return String(data.detail);
    }
    const value = Object.values(data)[0];
    return Array.isArray(value) ? value[0] : String(value || fallback);
}

function sortByConfidence(items) {
    // Least confident first; unparseable answers (no confidence) on top.
    return [...items].sort((a, b) => {
        const ca = a.interpretation?.confidence;
        const cb = b.interpretation?.confidence;
        return (typeof ca === "number" ? ca : -1)
            - (typeof cb === "number" ? cb : -1);
    });
}

function ClassificationReview({ tabs }) {
    const [filings, setFilings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [notes, setNotes] = useState({});
    const [savingId, setSavingId] = useState(null);
    const [rowErrors, setRowErrors] = useState({});
    const [lastSaved, setLastSaved] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const [queue, taxonomy] = await Promise.all([
                    getFilings({ status: "classification_review" }),
                    getTaxonomy()
                ]);

                if (!cancelled) {
                    setFilings(sortByConfidence(queue.items));
                    setCategories(taxonomy.categories || []);
                }
            } catch (err) {
                console.error("Failed to load classification review", err);
                if (!cancelled) {
                    setError(
                        err?.response?.status === 403
                            ? "Classification review is for staff only."
                            : "Unable to load classification review."
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
    }, [reloadKey]);

    async function decide(filing, { isMaterial, category }) {
        const interp = filing.interpretation;
        if (!interp || savingId) {
            return;
        }

        setSavingId(filing.id);
        setRowErrors(prev => ({ ...prev, [filing.id]: "" }));

        try {
            await overrideClassification(interp.id, {
                isMaterial,
                category,
                note: notes[filing.id] || ""
            });
            setFilings(prev => prev.filter(item => item.id !== filing.id));
            setLastSaved(
                `${filing.ticker}: saved as ${isMaterial ? category : "ROUTINE"}`
            );
        } catch (err) {
            const status = err?.response?.status;
            const message = firstError(err?.response?.data, "Could not save.");

            if (status === 409) {
                // Someone else reviewed it, or a newer answer exists.
                setFilings(prev => prev.filter(item => item.id !== filing.id));
                setLastSaved(`${filing.ticker}: ${message}`);
            } else {
                setRowErrors(prev => ({ ...prev, [filing.id]: message }));
            }
        } finally {
            setSavingId(null);
        }
    }

    const header = (
        <h2
            style={{
                marginBottom: "20px",
                color: "var(--text, #e0e0e0)",
                fontSize: "24px",
                fontWeight: "500"
            }}
        >
            Review Queue
        </h2>
    );

    if (loading) {
        return (
            <section className="content page" id="page-review">
                {header}
                {tabs}
                Loading...
            </section>
        );
    }

    if (error) {
        return (
            <section className="content page" id="page-review">
                {header}
                {tabs}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ color: "var(--red)" }}>{error}</span>
                    <button className="btn" onClick={() => setReloadKey(k => k + 1)}>
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="content page" id="page-review">
            {header}
            {tabs}

            {lastSaved && (
                <div style={{ fontSize: "12.5px", color: "var(--green)", marginBottom: "12px" }}>
                    {lastSaved}
                </div>
            )}

            {filings.length === 0 ? (
                <div
                    style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--dim, #6e7a8a)",
                        backgroundColor: "var(--card-bg, #161b22)",
                        borderRadius: "8px",
                        border: "1px dashed var(--border, rgba(255,255,255,0.1))",
                        margin: "20px 0"
                    }}
                >
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--text, #a3b1c6)" }}>
                        No classifications to review
                    </h3>
                    <p style={{ margin: 0 }}>
                        Every Interpreter answer is either confident or already reviewed.
                    </p>
                </div>
            ) : (
                filings.map(filing => {
                    const interp = filing.interpretation || {};
                    const facts = interp.extracted_facts || {};
                    const modelLabel = interp.is_material === false
                        ? "ROUTINE"
                        : interp.category || "—";
                    const canConfirm = !interp.failure_code
                        && (interp.is_material === false || Boolean(interp.category));
                    const busy = savingId === filing.id;

                    return (
                        <div className="fcard" key={filing.id}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "baseline" }}>
                                <strong>{filing.ticker}</strong>
                                <span style={{ color: "var(--ink-2)" }}>{filing.company_name}</span>
                                <span className="tag">{filing.form}</span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-3)" }}>
                                    {filing.accession_number} · Items {filing.sec_item_codes || "—"}
                                </span>
                                <a
                                    href={filing.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ marginLeft: "auto", color: "var(--cyan)", fontSize: "12.5px" }}
                                >
                                    Open on SEC
                                </a>
                            </div>

                            <div
                                style={{
                                    margin: "12px 0",
                                    padding: "10px 12px",
                                    border: "1px solid var(--line)",
                                    borderRadius: "8px",
                                    fontSize: "13px"
                                }}
                            >
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
                                    <span>Model: <strong>{modelLabel}</strong></span>
                                    <span>
                                        Confidence:{" "}
                                        <strong style={{ color: "var(--amber)" }}>
                                            {formatConfidence(interp.confidence)}
                                        </strong>
                                    </span>
                                    {interp.failure_code && (
                                        <span style={{ color: "var(--red)" }}>
                                            {interp.failure_code}
                                        </span>
                                    )}
                                    {interp.input_truncated && (
                                        <span style={{ color: "var(--amber)" }}>input truncated</span>
                                    )}
                                </div>
                                {interp.reasoning && (
                                    <div style={{ marginTop: "6px", color: "var(--ink-2)" }}>
                                        {interp.reasoning}
                                    </div>
                                )}
                                <div style={{ marginTop: "6px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--ink-3)" }}>
                                    Counterparty: {facts.counterparty ?? "—"}
                                    {" · "}Amount: {formatAmount(facts.amount_usd)}
                                    {" · "}Effective: {facts.effective_date ?? "—"}
                                </div>
                            </div>

                            {filing.summary && (
                                <details style={{ marginBottom: "12px", fontSize: "13px" }}>
                                    <summary style={{ cursor: "pointer", color: "var(--ink-2)" }}>
                                        Filing summary
                                    </summary>
                                    <div style={{ whiteSpace: "pre-wrap", marginTop: "8px" }}>
                                        {filing.summary}
                                    </div>
                                </details>
                            )}

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                                {canConfirm && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        disabled={busy}
                                        onClick={() => decide(filing, {
                                            isMaterial: interp.is_material,
                                            category: interp.category || ""
                                        })}
                                    >
                                        Confirm {modelLabel}
                                    </button>
                                )}
                                {categories.map(item => (
                                    <button
                                        key={item.code}
                                        className="btn btn-sm"
                                        disabled={busy}
                                        title={item.definition}
                                        onClick={() => decide(filing, {
                                            isMaterial: true,
                                            category: item.code
                                        })}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                <button
                                    className="btn btn-sm"
                                    disabled={busy}
                                    onClick={() => decide(filing, {
                                        isMaterial: false,
                                        category: ""
                                    })}
                                >
                                    Routine
                                </button>
                            </div>

                            <input
                                className="search"
                                style={{ marginLeft: 0, width: "100%" }}
                                placeholder="Note (optional)"
                                value={notes[filing.id] || ""}
                                onChange={event => setNotes(prev => ({
                                    ...prev,
                                    [filing.id]: event.target.value
                                }))}
                            />

                            {rowErrors[filing.id] && (
                                <div style={{ color: "var(--red)", fontSize: "12.5px", marginTop: "8px" }}>
                                    {rowErrors[filing.id]}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </section>
    );
}

export default ClassificationReview;
