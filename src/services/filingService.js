/*
    Filing Service

    Purpose:
    - Connect React UI with Django backend.
    - No fake/static filing data.
    - Backend PostgreSQL data is displayed in UI.

    Backend API:
    GET /api/filings/
*/


import api from "../api/axios";



/*
    Fetch filings

    Filters supported by backend:

    ticker:
    /api/filings/?ticker=ORCL

    form:
    /api/filings/?form=8-K

*/

export async function getFilings(filters = {}) {


    const response = await api.get(
        "/filings/",
        {
            params: filters
        }
    );


    return response.data;

}