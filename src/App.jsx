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


function App(){

    return (

        <BrowserRouter>

            <Routes>

                <Route element={<MainLayout />}>

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