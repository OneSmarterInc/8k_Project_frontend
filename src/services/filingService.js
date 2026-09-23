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
export async function getFilings(filters = {}) {

    const response = await api.get(
        "/filings/",
        {
            params: filters
        }
    );

    return normalizeFilingResponse(
        response.data
    );
}


/*
    W-022:
    Resolve an ambiguous 8-K/A against one of the
    backend-approved original 8-K candidates.

    This endpoint is admin-only.
*/
export async function resolveAmendment(
    filingId,
    originalId
) {

    const response = await api.post(
        `/filings/${filingId}/resolve-amendment/`,
        {
            original_id: originalId
        }
    );

    return response.data;
}