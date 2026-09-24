/*
 * FE-001 / FE-010: login session and connection state.
 *
 * W-041: the token is NO LONGER stored in localStorage. The backend
 * sets it as an HttpOnly cookie at login, which JavaScript cannot read,
 * so an XSS payload can no longer steal the session. The browser
 * attaches the cookie to every same-origin request automatically.
 *
 * Only the user object stays in localStorage. It holds a username and
 * an is_staff flag, which are not credentials - they drive which nav
 * items render. Every permission decision is made server-side.
 *
 * A page reload still stays logged in: the cookie carries the same TTL
 * as the token (TOKEN_TTL_HOURS).
 *
 * Connection state is a tiny pub/sub so any component can show a
 * "connection lost" banner without prop drilling.
 */

const USER_KEY = "watcher_user";

/*
 * W-041: kept so any older caller does not crash, but it can no longer
 * return a token - the cookie is invisible to JavaScript by design.
 * Presence of a session is now indicated by getUser().
 */
export function getToken() {
    return null;
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
        return null;
    }
}

export function saveSession(token, user) {
    // W-041: "token" is accepted and deliberately ignored. The backend
    // already delivered it as an HttpOnly cookie on the login response.
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(USER_KEY);

    // W-041: a stale token from a pre-cookie build would otherwise sit
    // in localStorage forever. Clear it once on the way past.
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