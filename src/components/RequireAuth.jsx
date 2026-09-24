import { Navigate, useLocation } from "react-router-dom";

import { getToken } from "../api/auth";

// FE-001: every page except /login needs a token.
function RequireAuth({ children }) {
    const location = useLocation();

    if (!getToken()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}

export default RequireAuth;