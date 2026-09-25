import api from "../api/axios";

/*
    W-038: capture queue exports.

    The backend writes one CSV per market day under queue/. These two
    calls list what exists in a date range and pull one down. Both are
    read-only: the browser can never trigger an export or a revision.
*/

export async function getQueueExports(startDate, endDate) {

    const response = await api.get(
        "/queue/exports/",
        {
            params: {
                start: startDate,
                end: endDate
            }
        }
    );

    return response.data;
}

/*
    Download one export.

    Fetched as a blob rather than linked with <a href>, because the API
    needs the auth header and a plain link cannot carry it. The blob
    becomes a temporary object URL, is clicked, then revoked.
*/
export async function downloadQueueExport(filename) {

    const response = await api.get(
        `/queue/exports/${filename}/`,
        { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "text/csv" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/*
    Re-run the export for a date range.

    The one write in this service, and deliberate: export_queue never
    overwrites, so this either writes a new revision when the day's
    rows have changed or writes nothing at all. It exists so a missed
    scheduled export can be recovered without shell access.
*/
export async function regenerateQueueExports(startDate, endDate) {

    const response = await api.post(
        "/queue/exports/regenerate/",
        { start: startDate, end: endDate }
    );

    return response.data;
}