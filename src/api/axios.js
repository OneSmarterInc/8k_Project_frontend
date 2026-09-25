import axios from "axios";

import {
    clearSession,
    setConnectionLost,
} from "./auth";


const api = axios.create({

        baseURL: import.meta.env.VITE_API_BASE_URL || "/api",

    // I-07: send the session cookie. Same-origin requests would carry
    // it anyway, but this keeps the client correct if VITE_API_BASE_URL
    // is ever pointed at a different origin (which additionally needs
    // SameSite=None, Secure and CORS_ALLOW_CREDENTIALS on the server).
    withCredentials: true,

    headers: {
        "Content-Type": "application/json"
    }

});


// I-07: no Authorization header is set any more.
//
// The token lives in an HttpOnly cookie that the browser attaches to
// every same-origin request by itself. Same-origin holds in dev (the
// Vite proxy forwards /api/*) and in production (frontend and API on
// one host), which is also why SameSite=Lax is safe against CSRF.


api.interceptors.response.use(
    (response) => {
        // FE-010: any successful response means the backend is reachable.
        setConnectionLost(false);
        return response;
    },
    (error) => {
        if (!error.response) {
            // FE-010: no response at all = backend down or unreachable.
            setConnectionLost(true);
        } else {
            setConnectionLost(false);

            // FE-001: token missing, expired or revoked -> log in again.
            if (
                error.response.status === 401
                && window.location.pathname !== "/login"
            ) {
                clearSession();
                window.location.assign("/login");
            }
        }

        return Promise.reject(error);
    }
);


export default api;