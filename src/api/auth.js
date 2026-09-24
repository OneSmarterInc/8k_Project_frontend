/*
 * FE-001 / FE-010: login token and connection state.
 *
 * The token is kept in localStorage so a page reload stays logged in.
 * Connection state is a tiny pub/sub so any component can show a
 * "connection lost" banner without prop drilling.
 */

const TOKEN_KEY = "watcher_token";
const USER_KEY = "watcher_user";

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
        return null;
    }
}

export function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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