import axios from "axios";

import {
    clearSession,
    setConnectionLost,
} from "./auth";


const api = axios.create({

        baseURL: import.meta.env.VITE_API_BASE_URL || "/api",

    headers: {
        "Content-Type": "application/json"
    }

});


// W-041: no Authorization header is set any more.
//
// The token lives in an HttpOnly cookie that the browser attaches to
// every same-origin request by itself. Same-origin holds in dev (the
// Vite proxy forwards /api/*) and in production (frontend and API on
// one host), which is also why SameSite=Lax is safe against CSRF.
//
// If VITE_API_BASE_URL is ever pointed at a DIFFERENT origin, this
// client needs withCredentials: true, and the backend needs
// SameSite=None + Secure + CORS_ALLOW_CREDENTIALS. All three together,
// or the session silently stops working.


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