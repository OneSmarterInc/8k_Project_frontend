import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFilings } from "../services/filingService";

// FE-010: Review Queue badge refresh interval
const SIDEBAR_REFRESH_MS = 60000;

function Sidebar() {
    const [failedCount, setFailedCount] = useState(0);
    const location = useLocation();

    // FE-010: keep the Review Queue badge current.
    // Refreshes on every page change and every 60 s (skipped while the
    // browser tab is hidden). On error the last known count is kept.
    useEffect(() => {
        let cancelled = false;

        async function fetchReviewCount() {
            try {
                const result = await getFilings({
                    status: "failed",
                    page_size: 1
                });

                if (!cancelled) {
                    setFailedCount(result.count);
                }

            } catch (err) {
                console.error(
                    "Failed to fetch review count",
                    err
                );
            }
        }

        fetchReviewCount();

        const interval = setInterval(() => {
            if (!document.hidden) {
                fetchReviewCount();
            }
        }, SIDEBAR_REFRESH_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [location.pathname]);

    const menu = [
        {
            name: "Filings",
            path: "/"
        },
        {
            name: "Review Queue",
            path: "/review",
            count: failedCount
        },
        {
            name: "Schedule",
            path: "/schedule"
        },
        {
            name: "Run History",
            path: "/history"
        }

        /*
        {
            name: "Settings",
            path: "/settings"
        }
        */
    ];

    return (
        <aside
            className="side"
            id="side"
        >
            <div className="side-top">
                <span className="glyph">
                    8K
                </span>

                <div>
                    <h1>
                        SIGINT Station
                    </h1>

                    <div className="sub">
                        portal
                    </div>
                </div>
            </div>

            <nav>
                {menu.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive
                                ? "nav-item active"
                                : "nav-item"
                        }
                    >
                        <span>
                            {item.name}
                        </span>

                        {item.count > 0 && (
                            <span className="count">
                                {item.count}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="side-user">
                <div className="avatar">
                    VS
                </div>

                <div style={{ flex: 1 }}>
                    <div className="nm">
                        Vikram Sethi
                    </div>

                    <div className="rl">
                        principal
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;