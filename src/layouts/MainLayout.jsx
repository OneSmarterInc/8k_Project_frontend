import { Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function MainLayout(){
    const [enabled, setEnabled] = useState(false);
    const [pollInterval, setPollInterval] = useState("60"); // seconds
    const [dailyChronicle, setDailyChronicle] = useState(true);
    
    // For counting down to next poll
    const [secondsToPoll, setSecondsToPoll] = useState(0);

    const intervalRef = useRef(null);
    const countdownRef = useRef(null);

   const triggerRun = async () => {
    try {
        const response = await api.post("/runs/trigger/", {
            daily_chronicle: dailyChronicle
        });

        return response.data;

    } catch (e) {
        console.error("Failed to trigger run:", e);
        throw e;
    }
};
const handleManualRun = async () => {

    if (isRunning) {
        return;
    }

    setShowLogs(true);

    try {

        const result = await triggerRun();

        if (result?.status === "started") {

            setPopupMessage(
                "Manual run started successfully."
            );

        } else if (
            result?.status === "already_running"
        ) {

            setIsRunning(true);

            setPopupMessage(
                "The SEC watcher is already running."
            );

        } else {

            setPopupMessage(
                result?.message ||
                "Unable to determine watcher status."
            );

        }

    } catch (error) {

        setPopupMessage(
            error.response?.data?.message ||
            "Failed to start the manual run."
        );

    }
};

    const startAutomation = () => {
        setEnabled(true);
    };

    const pauseAutomation = () => {
        setEnabled(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        setSecondsToPoll(0);
    };

    useEffect(() => {
        api.get("/settings/schedule/")
            .then(res => {
                if(res.data && res.data.is_active !== undefined) {
                    setEnabled(res.data.is_active);
                }
            })
            .catch(e => console.error("Failed to load initial schedule config:", e));

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const automationContext = {
        enabled,
        pollInterval,
        setPollInterval,
        dailyChronicle,
        setDailyChronicle,
        secondsToPoll,
        startAutomation,
        pauseAutomation,
        triggerRun
    };

    return (
        <div id="app">
            <Sidebar />
            <main>
                <Topbar />
                <Outlet context={automationContext} />
            </main>
        </div>
    );
}

export default MainLayout;