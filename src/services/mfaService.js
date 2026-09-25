import api from "../api/axios";

/*
    MFA-01: authenticator enrolment and the second login step.

    Every call here goes through the shared axios client, so the
    HttpOnly session cookie and the X-CSRFToken header are attached
    automatically by the P-05 configuration already in place.
*/

export async function getMfaStatus() {
    const response = await api.get("/auth/mfa/");
    return response.data;
}

/*
    Begin enrolment. Returns the QR as inline SVG plus the base32 key
    for manual entry when a camera is not available.

    The device is NOT active until confirmMfa succeeds, so abandoning
    this screen cannot lock the account out.
*/
export async function startMfaSetup() {
    const response = await api.post("/auth/mfa/setup/");
    return response.data;
}

/*
    Activate the device. Returns the backup codes, which are shown once
    and are not recoverable afterwards.
*/
export async function confirmMfaSetup(code) {
    const response = await api.post("/auth/mfa/confirm/", { code });
    return response.data;
}

export async function disableMfa(password, code) {
    const response = await api.post("/auth/mfa/disable/", { password, code });
    return response.data;
}

/*
    Step 2 of login. `code` is either a six-digit authenticator code or
    one of the backup codes issued at enrolment.
*/
export async function verifyMfaLogin(mfaToken, code) {
    const response = await api.post("/auth/login/verify/", {
        mfa_token: mfaToken,
        code,
    });
    return response.data;
}