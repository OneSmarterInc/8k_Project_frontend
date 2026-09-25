import { Navigate, useLocation } from "react-router-dom";

import { hasSession } from "../api/auth";

// FE-001 / I-07: every page except /login needs a session.
function RequireAuth({ children }) {
    const location = useLocation();

    if (!hasSession()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}

export default RequireAuth;