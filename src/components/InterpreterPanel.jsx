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
                margin: "4px 0 10px"
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

function CardPanel({ interpretation: interp }) {
    const box = {
        border: "1px solid var(--line, #213640)",
        borderRadius: "8px",
        padding: "12px 14px",
        fontSize: "12.5px",
        color: "var(--ink-2, #a3b1c6)",
        background: "var(--panel-2, #12232b)"
    };

    const title = (
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
            <span style={{ ...heading, margin: 0 }}>Interpreter</span>
            <span style={{ fontSize: "10.5px", color: "var(--ink-3, #6e7a8a)" }}>unverified</span>
        </div>
    );

    if (!interp) {
        return (
            <div style={box}>
                {title}
                <div style={{ color: "var(--ink-3, #6e7a8a)" }}>
                    Not classified yet.
                </div>
            </div>
        );
    }

    const facts = interp.extracted_facts || {};
    const override = interp.override;
    const warn = Boolean(interp.needs_human_review) && !override;

    const shownMaterial = override ? override.is_material : interp.is_material;
    const shownCategory = override ? override.category : interp.category;

    const factRow = (label, value) => (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "2px 0" }}>
            <span style={{ color: "var(--ink-3, #6e7a8a)" }}>{label}</span>
            <span style={{ fontFamily: "var(--mono)", textAlign: "right", overflowWrap: "anywhere" }}>{value}</span>
        </div>
    );

    return (
        <div style={box}>
            {title}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span className={`tag ${warn ? "t-flag" : shownMaterial ? "t-mat" : "t-rout"}`}>
                    {answerLabel(shownMaterial, shownCategory)}
                </span>
                <span style={{ color: "var(--ink-3, #6e7a8a)" }}>
                    {shownMaterial === true ? "Material" : shownMaterial === false ? "Routine" : ""}
                </span>
            </div>

            {override ? (
                <div style={{ margin: "8px 0 10px", color: "var(--green, #5ac999)" }}>
                    Reviewed by {override.reviewer}
                    <div style={{ color: "var(--ink-3, #6e7a8a)", fontSize: "11.5px" }}>
                        Model said {answerLabel(interp.is_material, interp.category)} at {formatConfidence(interp.confidence)}
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                        <span style={{ color: "var(--ink-3, #6e7a8a)" }}>Confidence</span>
                        <span style={{ fontFamily: "var(--mono)" }}>{formatConfidence(interp.confidence)}</span>
                    </div>
                    <ConfidenceBar value={interp.confidence} warn={warn} />
                </>
            )}

            {factRow("Counterparty", show(facts.counterparty))}
            {factRow("Amount", amountText(facts))}
            {factRow("Date", show(eventDate(facts)))}

            {interp.reasoning && (
                <div style={{ marginTop: "8px", fontStyle: "italic", color: "var(--ink-2, #a3b1c6)" }}>
                    {interp.reasoning}
                </div>
            )}

            {warn && (
                <div style={{ marginTop: "10px" }}>
                    <Link
                        to="/review?tab=classification"
                        style={{ color: "var(--amber, #e2a44a)", fontSize: "12px" }}
                    >
                        Waiting for review →
                    </Link>
                </div>
            )}

            {interp.failure_code && (
                <div style={{ marginTop: "6px", color: "var(--red, #e2695a)", fontSize: "11.5px" }}>
                    {interp.failure_code}
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
