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
            await api.post("/runs/trigger/", {
                daily_chronicle: dailyChronicle
            });
        } catch (e) {
            console.error("Failed to trigger run:", e);
        }
    };

    const startAutomation = () => {
        setEnabled(true);
        // Trigger immediately once started
        triggerRun();
        const intervalMs = parseInt(pollInterval, 10) * 1000;
        setSecondsToPoll(parseInt(pollInterval, 10));

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            triggerRun();
            setSecondsToPoll(parseInt(pollInterval, 10));
        }, intervalMs);

        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setSecondsToPoll((prev) => (prev > 0 ? prev - 1 : parseInt(pollInterval, 10) - 1));
        }, 1000);
    };

    const pauseAutomation = () => {
        setEnabled(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        setSecondsToPoll(0);
    };

    useEffect(() => {
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
        pauseAutomation
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