import { useCallback, useEffect, useRef, useState } from "react";
import {
    getNextLabellingItem,
    submitLabel
} from "../services/labellingService";

/*
    Guide 4.2: blind labelling screen for ground truth (G2).

    Shows filing text and the taxonomy only. The API never sends a
    summary, a flag, a model answer or another labeller's label, and this
    page must not fetch any of them either.

    Every hook sits above every return (rules-of-hooks).
*/

const CONFIDENCE_LEVELS = [
    { value: 1, label: "1 · guess" },
    { value: 2, label: "2" },
    { value: 3, label: "3 · fair" },
    { value: 4, label: "4" },
    { value: 5, label: "5 · certain" }
];

function firstError(data, fallback) {
    if (!data || typeof data !== "object") {
        return fallback;
    }
    const value = Object.values(data)[0];
    return Array.isArray(value) ? value[0] : String(value || fallback);
}

function Labelling() {
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [isMaterial, setIsMaterial] = useState(null);
    const [category, setCategory] = useState("");
    const [confidence, setConfidence] = useState(null);
    const [notes, setNotes] = useState("");
    const [openCategory, setOpenCategory] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [savedCount, setSavedCount] = useState(0);

    // Set by resetForm() each time a filing loads.
    const startedAt = useRef(0);

    const resetForm = useCallback(() => {
        setIsMaterial(null);
        setCategory("");
        setConfidence(null);
        setNotes("");
        setOpenCategory("");
        setSubmitError("");
        startedAt.current = Date.now();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setLoadError("");

            try {
                const data = await getNextLabellingItem();
                if (!cancelled) {
                    setPayload(data);
                    resetForm();
                }
            } catch (err) {
                console.error("Failed to load labelling item", err);
                if (!cancelled) {
                    setLoadError(
                        err?.response?.status === 403
                            ? "Your account is not in the labeller group."
                            : "Could not load the next filing. The backend may be unavailable."
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
    }, [reloadKey, resetForm]);

    const sample = payload?.sample;
    const categories = payload?.taxonomy?.categories || [];

    const canSubmit =
        !submitting
        && sample
        && isMaterial !== null
        && confidence !== null
        && (isMaterial === false || category !== "");

    async function handleSubmit() {
        if (!canSubmit) {
            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            await submitLabel({
                filing_id: sample.filing.id,
                is_material: isMaterial,
                category: isMaterial ? category : "",
                confidence,
                notes,
                duration_seconds: Math.max(
                    0,
                    Math.round((Date.now() - startedAt.current) / 1000)
                )
            });
            setSavedCount(count => count + 1);
            setReloadKey(key => key + 1);
        } catch (err) {
            console.error("Failed to save label", err);
            setSubmitError(
                firstError(err?.response?.data, "Could not save the label.")
            );
        } finally {
            setSubmitting(false);
        }
    }

    function chooseMaterial(value) {
        setIsMaterial(value);
        if (!value) {
            setCategory("");
        }
    }

    if (loading) {
        return (
            <section className="content page" id="page-labelling">
                Loading...
            </section>
        );
    }

    if (loadError) {
        return (
            <section className="content page" id="page-labelling">
                <div
                    style={{
                        padding: "24px",
                        border: "1px solid rgba(226,105,90,.3)",
                        background: "rgba(226,105,90,.06)",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px"
                    }}
                >
                    <span style={{ color: "var(--red, #e2695a)" }}>{loadError}</span>
                    <button
                        className="btn"
                        onClick={() => setReloadKey(key => key + 1)}
                    >
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    const progress = payload?.progress || {};

    const progressLine = (
        <div
            style={{
                fontFamily: "var(--mono)",
                fontSize: "12px",
                color: "var(--ink-3)",
                marginBottom: "14px"
            }}
        >
            You: {progress.labelled_by_me ?? 0} labelled
            {savedCount > 0 ? ` (${savedCount} this session)` : ""}
            {" · "}
            Overall: {progress.slots_filled ?? 0} / {progress.slots_total ?? 0} labels
            {" · "}
            Taxonomy {payload?.taxonomy?.version}
        </div>
    );

    if (payload?.done) {
        return (
            <section className="content page" id="page-labelling">
                {progressLine}
                <div className="card" style={{ padding: "24px" }}>
                    Nothing left for you to label right now.
                    {progress.samples_total === 0
                        ? " No labelling sample has been drawn yet."
                        : ""}
                </div>
            </section>
        );
    }

    const filing = sample.filing;

    return (
        <section className="content page" id="page-labelling">
            {progressLine}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                    gap: "16px",
                    alignItems: "start"
                }}
            >
                {/* LEFT: filing text */}
                <div className="card" style={{ minWidth: 0 }}>
                    <div className="card-h" style={{ flexWrap: "wrap" }}>
                        <h3>
                            {filing.ticker} · {filing.company_name}
                        </h3>
                        <span className="hint">
                            {filing.form} · {filing.accession_number} ·
                            Items {filing.sec_item_codes || "—"}
                        </span>
                    </div>

                    {sample.text_truncated && (
                        <div
                            style={{
                                padding: "8px 18px",
                                fontSize: "12px",
                                color: "var(--amber)"
                            }}
                        >
                            Text truncated for display.{" "}
                            <a
                                href={filing.source_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "var(--cyan)" }}
                            >
                                Open the full filing on SEC
                            </a>
                        </div>
                    )}

                    <div
                        style={{
                            padding: "16px 18px",
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                            maxHeight: "70vh",
                            overflowY: "auto",
                            fontSize: "13.5px",
                            lineHeight: 1.55
                        }}
                    >
                        {sample.text || "No text is available for this filing."}
                    </div>
                </div>

                {/* RIGHT: taxonomy and answer */}
                <div className="card" style={{ minWidth: 0 }}>
                    <div className="card-h">
                        <h3>Your judgement</h3>
                    </div>

                    <div style={{ padding: "16px 18px" }}>
                        <div style={{ fontSize: "12.5px", color: "var(--ink-3)", marginBottom: "10px" }}>
                            {payload.taxonomy.material_definition}
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
                            <button
                                className={`chip ${isMaterial === true ? "active" : ""}`}
                                onClick={() => chooseMaterial(true)}
                            >
                                Material
                            </button>
                            <button
                                className={`chip ${isMaterial === false ? "active" : ""}`}
                                onClick={() => chooseMaterial(false)}
                            >
                                Routine
                            </button>
                        </div>

                        {isMaterial === true && (
                            <div style={{ marginBottom: "18px" }}>
                                {categories.map(item => (
                                    <div
                                        key={item.code}
                                        style={{
                                            border: "1px solid var(--line)",
                                            borderColor: category === item.code
                                                ? "var(--green)"
                                                : "var(--line)",
                                            borderRadius: "8px",
                                            padding: "10px 12px",
                                            marginBottom: "8px"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <button
                                                className={`chip ${category === item.code ? "active" : ""}`}
                                                onClick={() => setCategory(item.code)}
                                            >
                                                {item.label}
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ marginLeft: "auto" }}
                                                onClick={() => setOpenCategory(
                                                    openCategory === item.code ? "" : item.code
                                                )}
                                            >
                                                {openCategory === item.code ? "Hide rules" : "Rules"}
                                            </button>
                                        </div>
                                        <div style={{ fontSize: "12.5px", color: "var(--ink-2)", marginTop: "6px" }}>
                                            {item.definition}
                                        </div>
                                        {openCategory === item.code && (
                                            <div style={{ fontSize: "12px", marginTop: "8px", color: "var(--ink-2)" }}>
                                                <div style={{ color: "var(--green)" }}>Includes</div>
                                                <ul style={{ margin: "4px 0 8px", paddingLeft: "18px" }}>
                                                    {item.includes.map(text => <li key={text}>{text}</li>)}
                                                </ul>
                                                <div style={{ color: "var(--red)" }}>Excludes</div>
                                                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                                                    {item.excludes.map(text => <li key={text}>{text}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ fontSize: "12.5px", marginBottom: "6px" }}>
                            How sure are you?
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
                            {CONFIDENCE_LEVELS.map(level => (
                                <button
                                    key={level.value}
                                    className={`chip ${confidence === level.value ? "active" : ""}`}
                                    onClick={() => setConfidence(level.value)}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={notes}
                            onChange={event => setNotes(event.target.value)}
                            placeholder="Notes (optional) - especially why a boundary case was hard"
                            rows={3}
                            style={{
                                width: "100%",
                                background: "var(--bg-2)",
                                border: "1px solid var(--line)",
                                borderRadius: "8px",
                                color: "var(--ink)",
                                padding: "8px 10px",
                                fontFamily: "var(--sans)",
                                fontSize: "13px",
                                marginBottom: "12px",
                                resize: "vertical"
                            }}
                        />

                        {submitError && (
                            <div style={{ color: "var(--red)", fontSize: "12.5px", marginBottom: "10px" }}>
                                {submitError}
                            </div>
                        )}

                        <button
                            className="btn btn-primary btn-block"
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                            style={{ opacity: canSubmit ? 1 : 0.5 }}
                        >
                            {submitting ? "Saving..." : "Save and next"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Labelling;
