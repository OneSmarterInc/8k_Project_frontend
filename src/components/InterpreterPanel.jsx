import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { eventDate, formatAmounts } from "../utils/interpreter";

/*
    Guide Part 5: Interpreter result, read from /api/filings/ (the
    `interpretation` field = latest FilingClassification + any override).

    variant="card"  right-hand panel on a Filings card
    variant="mail"  block inside View Mail, same rows and order as the
                    email the Watcher sends

    The API sends `interpretation` only to staff, so labellers can never
    see model output (guide 4.2). Callers decide whether to render the
    "not classified yet" state; this component never fetches anything.
*/

function answerLabel(isMaterial, category) {
    if (isMaterial === false) {
        return "ROUTINE";
    }
    return category || "UNKNOWN";
}

function formatConfidence(value) {
    return typeof value === "number" ? value.toFixed(2) : "N/A";
}

function amountText(facts) {
    const parts = formatAmounts(facts);
    return parts.length ? parts.join("; ") : "N/A";
}

function show(value) {
    return value === null || value === undefined || value === "" ? "N/A" : String(value);
}

function statusText(interp) {
    if (interp.override) {
        return `Reviewed by ${interp.override.reviewer}`;
    }
    if (interp.needs_human_review) {
        return "Sent to Review Queue (Classification)";
    }
    return "Confident";
}

// Same rows, same order as the email block (notification_service.py).
function emailRows(interp) {
    const facts = interp.extracted_facts || {};
    const rows = [
        ["Material", interp.is_material === true ? "Yes" : interp.is_material === false ? "No" : "Unknown"],
        ["Category", answerLabel(interp.is_material, interp.category)],
        ["Confidence", formatConfidence(interp.confidence)],
        ["Counterparty", show(facts.counterparty)],
        ["Amount", amountText(facts)],
        ["Event Date", show(eventDate(facts))],
        ["Status", statusText(interp)]
    ];
    if (interp.override) {
        rows.push([
            "Reviewer's answer",
            answerLabel(interp.override.is_material, interp.override.category)
        ]);
    }
    return rows;
}

const heading = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "1px",
    color: "var(--dim, #6e7a8a)",
    textTransform: "uppercase",
    margin: "0 0 12px 0"
};

function ConfidenceBar({ value, warn }) {
    const pct = typeof value === "number" ? Math.round(Math.min(Math.max(value, 0), 1) * 100) : 0;
    return (
        <div
            style={{
                height: "6px",
                background: "var(--line, #213640)",
                borderRadius: "3px",
                overflow: "hidden",
                margin: "0"
            }}
            aria-label={`Confidence ${formatConfidence(value)}`}
        >
            <div
                style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: warn ? "var(--amber, #e2a44a)" : "var(--cyan, #54b6d6)"
                }}
            />
        </div>
    );
}

/*
    Card variant: a section under the summary.

      INTERPRETER  unverified                     [FINANCING]  Material   Confidence 0.90 ▓▓▓▓▓▓▓▓░
      ───────────────────────────────────────────────────────────────────────────────────────────────
      COUNTERPARTY            AMOUNT                                EVENT DATE
      Deutsche Bank AG, …     EUR 625,000,000 (4.250% Notes 2031)   2026-09-24
                              EUR 500,000,000 (4.750% Notes 2036)
      ───────────────────────────────────────────────────────────────────────────────────────────────
      Reasoning, two lines; "Show more" only when it is actually cut off.

    Routine answers have no deal facts, so the facts grid is hidden for them.
*/
function CardPanel({ interpretation: interp }) {
    const [expanded, setExpanded] = useState(false);
    const [clipped, setClipped] = useState(false);
    const reasoningRef = useRef(null);

    const reasoning = interp?.reasoning || "";

    // Show the toggle only when two lines genuinely cut the text off.
    useEffect(() => {
        const el = reasoningRef.current;
        if (!el || expanded) {
            return undefined;
        }
        const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [reasoning, expanded]);

    const section = {
        marginTop: "16px",
        border: "1px solid var(--line, #213640)",
        borderRadius: "10px",
        background: "var(--panel-2, #12232b)",
        fontSize: "13px",
        color: "var(--ink-2, #a3b1c6)",
        overflow: "hidden"
    };

    const pad = { padding: "12px 16px" };
    const divider = { borderTop: "1px solid var(--line-soft, rgba(255,255,255,0.06))" };
    const smallLabel = {
        fontSize: "10.5px",
        fontWeight: 600,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        color: "var(--ink-3, #6e7a8a)",
        marginBottom: "4px"
    };
    const muted = { color: "var(--ink-3, #6e7a8a)" };

    const titleBlock = (
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ ...heading, margin: 0 }}>Interpreter</span>
            <span style={{ fontSize: "10.5px", ...muted }}>unverified</span>
        </div>
    );

    if (!interp) {
        return (
            <div style={section}>
                <div style={{ ...pad, display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "baseline" }}>
                    {titleBlock}
                    <span style={muted}>Not classified yet.</span>
                </div>
            </div>
        );
    }

    const facts = interp.extracted_facts || {};
    const override = interp.override;
    const warn = Boolean(interp.needs_human_review) && !override;

    const shownMaterial = override ? override.is_material : interp.is_material;
    const shownCategory = override ? override.category : interp.category;
    const amounts = formatAmounts(facts);

    const verdict = (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px", marginLeft: "auto" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span className={`tag ${warn ? "t-flag" : shownMaterial ? "t-mat" : "t-rout"}`}>
                    {answerLabel(shownMaterial, shownCategory)}
                </span>
                <span style={muted}>
                    {shownMaterial === true ? "Material" : shownMaterial === false ? "Routine" : ""}
                </span>
            </span>

            {override ? (
                <span>
                    <span style={{ color: "var(--green, #5ac999)" }}>Reviewed by {override.reviewer}</span>
                    <span style={{ ...muted, marginLeft: "8px" }}>
                        model said {answerLabel(interp.is_material, interp.category)} at {formatConfidence(interp.confidence)}
                    </span>
                </span>
            ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <span style={muted}>Confidence</span>
                    <span style={{ fontFamily: "var(--mono)", color: warn ? "var(--amber, #e2a44a)" : "var(--ink, #e7eeeb)" }}>
                        {formatConfidence(interp.confidence)}
                    </span>
                    <span style={{ width: "110px" }}>
                        <ConfidenceBar value={interp.confidence} warn={warn} />
                    </span>
                </span>
            )}

            {warn && (
                <Link to="/review?tab=classification" style={{ color: "var(--amber, #e2a44a)", fontSize: "12.5px" }}>
                    Waiting for review →
                </Link>
            )}
        </div>
    );

    const fact = (title, content) => (
        <div style={{ minWidth: 0 }}>
            <div style={smallLabel}>{title}</div>
            <div style={{ color: "var(--ink, #e7eeeb)", lineHeight: 1.5, overflowWrap: "anywhere" }}>
                {content}
            </div>
        </div>
    );

    return (
        <div style={section}>
            {/* Header: title + verdict */}
            <div style={{ ...pad, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px" }}>
                {titleBlock}
                {verdict}
            </div>

            {interp.failure_code && (
                <div style={{ ...pad, ...divider, paddingTop: "8px", paddingBottom: "8px", color: "var(--red, #e2695a)", fontSize: "12px" }}>
                    {interp.failure_code}
                </div>
            )}

            {/* Facts grid: material only */}
            {shownMaterial !== false && (
                <div
                    style={{
                        ...pad,
                        ...divider,
                        display: "grid",
                        // Three columns on wide cards; wraps to rows on narrow screens.
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px 24px"
                    }}
                >
                    {fact("Counterparty", show(facts.counterparty))}
                    {fact(
                        "Amount",
                        amounts.length
                            ? amounts.map(text => <div key={text}>{text}</div>)
                            : "N/A"
                    )}
                    {fact("Event date", <span style={{ fontFamily: "var(--mono)" }}>{show(eventDate(facts))}</span>)}
                </div>
            )}

            {/* Reasoning */}
            {reasoning && (
                <div style={{ ...pad, ...divider, lineHeight: 1.55, color: "var(--ink-2, #a3b1c6)" }}>
                    <div
                        ref={reasoningRef}
                        style={
                            expanded
                                ? undefined
                                : {
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                }
                        }
                    >
                        {reasoning}
                    </div>
                    {(clipped || expanded) && (
                        <button
                            type="button"
                            onClick={() => setExpanded(value => !value)}
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                marginTop: "4px",
                                color: "var(--cyan, #54b6d6)",
                                fontSize: "12px",
                                cursor: "pointer"
                            }}
                        >
                            {expanded ? "Show less" : "Show more"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function MailBlock({ interpretation: interp, emailSentAt }) {
    const addedLater =
        interp
        && emailSentAt
        && interp.created_at
        && new Date(interp.created_at) > new Date(emailSentAt);

    return (
        <>
            <h3 style={heading}>Interpreter (model label, unverified)</h3>

            {addedLater && (
                <div style={{ fontSize: "12px", color: "var(--amber, #e2a44a)", marginBottom: "10px" }}>
                    Added after this email was sent.
                </div>
            )}

            {!interp ? (
                <div style={{ color: "var(--dim, #6e7a8a)", fontSize: "13px", marginBottom: "40px" }}>
                    Not classified yet.
                </div>
            ) : (
                <div
                    style={{
                        border: "1px solid var(--border, rgba(255,255,255,0.05))",
                        borderRadius: "6px",
                        overflow: "hidden",
                        marginBottom: "40px"
                    }}
                >
                    <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse", color: "var(--text, #a3b1c6)" }}>
                        <tbody>
                            {emailRows(interp).map(([label, value]) => (
                                <tr key={label} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,0.05))" }}>
                                    <td style={{ padding: "8px 16px", color: "var(--dim, #6e7a8a)", width: "40%" }}>{label}</td>
                                    <td style={{ padding: "8px 16px", fontFamily: "monospace", overflowWrap: "anywhere" }}>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function InterpreterPanel({ interpretation, emailSentAt, variant = "card" }) {
    if (variant === "mail") {
        return <MailBlock interpretation={interpretation} emailSentAt={emailSentAt} />;
    }
    return <CardPanel interpretation={interpretation} />;
}

export default InterpreterPanel;
