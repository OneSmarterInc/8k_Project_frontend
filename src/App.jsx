import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";


import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import ReviewQueue from "./pages/ReviewQueue";
import Schedule from "./pages/Schedule";
import RunHistory from "./pages/RunHistory";
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

                    <Route
                        path="/history"
                        element={<RunHistory />}
                    />

                    
                </Route>

            </Routes>

        </BrowserRouter>

    );

}


export default App;