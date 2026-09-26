import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";


import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import ReviewQueue from "./pages/ReviewQueue";
import Schedule from "./pages/Schedule";
import MfaSetup from "./pages/MfaSetup";
import RunHistory from "./pages/RunHistory";
import Labelling from "./pages/Labelling";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";


function App(){

    return (

        <BrowserRouter>

            <Routes>

                <Route path="/login" element={<Login />} />

                <Route
                    element={
                        <RequireAuth>
                            <MainLayout />
                        </RequireAuth>
                    }
                >

                    <Route
                        path="/"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/review"
                        element={<ReviewQueue />}
                    />

                    <Route
                        path="/schedule"
                        element={<Schedule />}
                    />

                    {/* MFA-01: authenticator enrolment. */}
                    <Route
                        path="/security"
                        element={<MfaSetup />}
                    />

                    <Route
                        path="/history"
                        element={<RunHistory />}
                    />

                    {/* Guide 4.2: blind labelling for ground truth (G2). */}
                    <Route
                        path="/labelling"
                        element={<Labelling />}
                    />

                    
                </Route>

            </Routes>

        </BrowserRouter>

    );

}


export default App;