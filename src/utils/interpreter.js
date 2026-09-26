/*
    Guide Part 5: the Interpreter only classifies these forms
    (watcher/interpreter/service.py INTERPRETABLE_FORMS).
*/
const INTERPRETABLE_FORMS = ["8-K", "8-K/A"];

export function isInterpretable(form) {
    return INTERPRETABLE_FORMS.includes(String(form || "").trim().toUpperCase());
}


/*
    Extracted facts. Prompt 1.0.2 writes `amounts` (a list, in the
    filing's own currency) and `event_date`; rows from 1.0.0 / 1.0.1
    hold `amount_usd` and `effective_date`. Both display.
*/
export function formatAmounts(facts) {
    const f = facts || {};

    if (Array.isArray(f.amounts) && f.amounts.length > 0) {
        const parts = f.amounts
            .filter(item => item && typeof item.value === "number" && Number.isFinite(item.value))
            .map(item => {
                const number = item.value.toLocaleString("en-US", { maximumFractionDigits: 0 });
                let text = `${item.currency || ""} ${number}`.trim();
                if (item.description) {
                    text += ` (${item.description})`;
                }
                return text;
            });
        if (parts.length > 0) {
            return parts;
        }
    }

    if (typeof f.amount_usd === "number" && Number.isFinite(f.amount_usd)) {
        return [`$${f.amount_usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`];
    }

    return [];
}

export function eventDate(facts) {
    const f = facts || {};
    return f.event_date || f.effective_date || null;
}
