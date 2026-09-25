/*
    I-01: pagination controls for the filings list.

    Presentational only - it owns no data. The page number lives in
    Dashboard.jsx, which slices the already-filtered list. That keeps
    search, the form filter, the timeframe filter and the StatStrip
    counts working on the FULL result set exactly as before; only the
    number of cards rendered at once changes.

    Renders nothing when everything fits on one page, so a short list
    looks exactly as it did.
*/

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function pageNumbers(current, total) {
    /*
        Windowed page numbers with ellipses, so 41 pages do not produce
        41 buttons:  1 … 7 8 [9] 10 11 … 41
    */
    const pages = [];
    const window = 2;

    const push = (value) => {
        if (pages[pages.length - 1] !== value) pages.push(value);
    };

    for (let i = 1; i <= total; i += 1) {
        const nearEdge = i === 1 || i === total;
        const nearCurrent = Math.abs(i - current) <= window;

        if (nearEdge || nearCurrent) {
            push(i);
        } else if (pages[pages.length - 1] !== "...") {
            push("...");
        }
    }

    return pages;
}

function Pagination({
    page,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
}) {

    const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);

    if (totalItems === 0) {
        return null;
    }

    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, totalItems);

    const go = (target) => {
        const clamped = Math.min(Math.max(target, 1), totalPages);
        if (clamped !== page) onPageChange(clamped);
    };

    const navButton = (label, target, disabled) => (
        <button
            className="btn"
            onClick={() => go(target)}
            disabled={disabled}
            style={{
                padding: "4px 12px",
                fontSize: "13px",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1
            }}
        >
            {label}
        </button>
    );

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
                padding: "16px 4px 8px"
            }}
        >
            <span style={{ fontSize: "12px", color: "var(--dim)" }}>
                Showing <strong style={{ color: "var(--text, #a3b1c6)" }}>{first}–{last}</strong>
                {" of "}
                <strong style={{ color: "var(--text, #a3b1c6)" }}>{totalItems}</strong>
                {" filings"}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

                {navButton("‹ Previous", page - 1, page === 1)}

                {totalPages > 1 && pageNumbers(page, totalPages).map((value, index) => (
                    value === "..." ? (
                        <span
                            key={`gap-${index}`}
                            style={{ padding: "0 4px", color: "var(--dim)", fontSize: "13px" }}
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={value}
                            className="btn"
                            onClick={() => go(value)}
                            aria-current={value === page ? "page" : undefined}
                            style={{
                                padding: "4px 10px",
                                fontSize: "13px",
                                minWidth: "34px",
                                border: value === page
                                    ? "1px solid var(--accent)"
                                    : "1px solid rgba(255,255,255,0.1)",
                                color: value === page ? "var(--accent)" : "var(--dim)",
                                fontWeight: value === page ? "600" : "400"
                            }}
                        >
                            {value}
                        </button>
                    )
                ))}

                {navButton("Next ›", page + 1, page === totalPages)}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--dim)" }}>
                    Per page
                </span>
                <select
                    className="search"
                    style={{ width: "76px", padding: "4px 8px", fontSize: "13px" }}
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default Pagination;