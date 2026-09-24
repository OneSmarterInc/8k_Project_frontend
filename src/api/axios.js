import axios from "axios";

import {
    clearSession,
    getToken,
    setConnectionLost,
} from "./auth";


const api = axios.create({

        baseURL: import.meta.env.VITE_API_BASE_URL || "/api",

    headers: {
        "Content-Type": "application/json"
    }

});


// FE-001: send the login token on every request.
api.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }

    return config;
});


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