// Shared formatters for Watcher output.
// The entry rule is defined in US Eastern time, so accepted_at is always
// shown in ET regardless of the viewer's browser zone.

export function formatET(isoString, fallback = "-") {
    if (!isoString) return fallback;

    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return fallback;

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23", // avoids "24:05" at midnight in some browsers
    })
        .formatToParts(d)
        .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} ET`;
}

// Same cleanup the mail panel already applies to sec_item_codes.
export function formatItems(codes, fallback = "-") {
    if (!codes) return fallback;
    const cleaned = String(codes).replace(/[()']/g, "").trim();
    return cleaned || fallback;
}