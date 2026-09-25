import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { primeCsrfToken } from "./api/auth";

import "./index.css";
import "./styles/theme.css";


// P-05: make sure a csrftoken cookie exists before the first POST
// (login included). Does not block rendering.
primeCsrfToken();

ReactDOM.createRoot(
    document.getElementById("root")
)
.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);