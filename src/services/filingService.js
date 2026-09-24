/*
    Filing Service

    Purpose:
    - Connect React UI with Django backend.
    - No fake/static filing data.
    - Supports both:
        1. Current non-paginated API responses.
        2. W-035 paginated API responses.

    Backend API:
    GET /api/filings/

    W-022:
    POST /api/filings/<id>/resolve-amendment/
*/

import api from "../api/axios";


/*
    Normalize filing list responses.

    Current backend:
    [
        {...},
        {...}
    ]

    W-035 backend:
    {
        count: 100,
        next: "...",
        previous: null,
        results: [
            {...},
            {...}
        ]
    }

    The rest of the frontend always receives the same structure.
*/
function normalizeFilingResponse(data) {

    const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
            ? data.results
            : [];

    return {
        items,

        count:
            typeof data?.count === "number"
                ? data.count
                : items.length,

        next:
            Array.isArray(data)
                ? null
                : data?.next ?? null,

        previous:
            Array.isArray(data)
                ? null
                : data?.previous ?? null
    };
}


/*
    Supported filters include:

    status:
    /api/filings/?status=failed

    page:
    /api/filings/?page=2

    page_size:
    /api/filings/?page_size=100
*/
/*
    W-040: the backend now paginates /api/filings/ by default.

    Callers fall into two groups and both keep working unchanged:

    1. A caller that passes "page" or "page_size" wants ONE specific
       page. It gets exactly that page, as before. The Sidebar badge
       does this (page_size: 1) because it only reads "count".

    2. A caller that passes neither wants the whole set. Before W-040
       the backend returned everything in one unbounded response; now
       we walk "next" and hand back the same complete list. Dashboard
       and the Review Queue rely on this, so their behaviour does not
       change even though the wire format did.

    MAX_PAGES bounds the walk so a runaway "next" chain can never spin
    forever. At the 500-row max_page_size that is 25,000 filings.
*/
const MAX_PAGES = 50;

export async function getFilings(filters = {}) {

    const wantsOnePage =
        filters.page !== undefined ||
        filters.page_size !== undefined;

    const first = normalizeFilingResponse(
        (await api.get("/filings/", { params: filters })).data
    );

    if (wantsOnePage || !first.next) {
        return first;
    }

    const items = [...first.items];
    let nextUrl = first.next;
    let pages = 1;

    while (nextUrl && pages < MAX_PAGES) {

        // "next" is an absolute URL from DRF. Send only its query
        // string so the axios baseURL keeps applying (the API may be
        // reached through a dev proxy or a different host).
        const query = Object.fromEntries(
            new URL(nextUrl, window.location.origin).searchParams
        );

        const pageResult = normalizeFilingResponse(
            (await api.get("/filings/", { params: { ...filters, ...query } })).data
        );

        items.push(...pageResult.items);
        nextUrl = pageResult.next;
        pages += 1;
    }

    if (nextUrl) {
        console.warn(
            `getFilings stopped at ${MAX_PAGES} pages; ` +
            `${items.length} of ${first.count} filings loaded.`
        );
    }

    return {
        items,
        count: first.count,
        next: null,
        previous: null
    };
}


/*
    W-022:
    Resolve an ambiguous 8-K/A against one of the
    backend-approved original 8-K candidates.

    This endpoint is admin-only.
*/
// 8-K/A DISABLED: the /resolve-amendment/ route was removed from
// urls.py, so this call can only 404. No component imports it any more.
// export async function resolveAmendment(
//     filingId,
//     originalId
// ) {
//
//     const response = await api.post(
//         `/filings/${filingId}/resolve-amendment/`,
//         {
//             original_id: originalId
//         }
//     );
//
//     return response.data;
// }