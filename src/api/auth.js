/*
 * FE-001 / FE-010: login token and connection state.
 *
 * The token is kept in localStorage so a page reload stays logged in.
 * Connection state is a tiny pub/sub so any component can show a
 * "connection lost" banner without prop drilling.
 */

const USER_KEY = "watcher_user";

/*
 * I-07: is there a logged-in session?
 *
 * The token is an HttpOnly cookie and is invisible to JavaScript by
 * design, so the client can no longer test for it directly. The stored
 * user object is only a client-side marker that a login happened; the
 * cookie is what actually authenticates, and the server rejects the
 * request if it is missing or expired.
 *
 * This REPLACES the old getToken() truthiness check. RequireAuth.jsx
 * and Login.jsx both used getToken() that way - if either is left
 * calling a function that now returns null, every page redirects to
 * /login and the app is unusable.
 */
/*
 * P-05: fetch a csrftoken cookie before the first POST.
 *
 * Called once at app start, including on the login page - login is
 * itself a POST, so the cookie has to exist before it. Failures are
 * swallowed: if the endpoint is unavailable the app must still load,
 * and the backend only enforces CSRF when explicitly switched on.
 */
export async function primeCsrfToken() {
    try {
        const { default: api } = await import("./axios");
        await api.get("/auth/csrf/");
    } catch {
        // Deliberately silent.
    }
}

export function hasSession() {
    return getUser() !== null;
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
        return null;
    }
}

export function saveSession(token, user) {
    // I-07: "token" is accepted and deliberately ignored. The backend
    // already delivered it as an HttpOnly cookie on the login response.
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(USER_KEY);

    // I-07: clear any token left behind by a pre-cookie build.
    localStorage.removeItem("watcher_token");
}

// ---- connection state (FE-010) ----------------------------------------

let connectionLost = false;
const listeners = new Set();

export function isConnectionLost() {
    return connectionLost;
}

export function setConnectionLost(value) {
    if (connectionLost === value) {
        return;
    }
    connectionLost = value;
    listeners.forEach((listener) => listener(value));
}

export function onConnectionChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}