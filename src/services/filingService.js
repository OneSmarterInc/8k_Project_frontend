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
    Fetch filings

    Supported filters include:

    ticker:
    /api/filings/?ticker=ORCL

    form:
    /api/filings/?form=8-K

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