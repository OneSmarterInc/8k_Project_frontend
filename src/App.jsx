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
import Accuracy from "./pages/Accuracy";
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

                    
                                    <Route
                        path="/accuracy"
                        element={<Accuracy />}
                    />

</Route>

            </Routes>

        </BrowserRouter>

    );

}


export default App;