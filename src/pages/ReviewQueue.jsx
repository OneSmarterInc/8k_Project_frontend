import { useEffect, useState } from "react";
import api from "../api/axios";

function ReviewQueue() {
    const [filings, setFilings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchFailedFilings() {
            try {
                setLoading(true);
                const response = await api.get("/filings/?status=failed");
                setFilings(response.data);
            } catch (err) {
                console.error("Failed to fetch review queue", err);
                setError("Unable to load review queue");
            } finally {
                setLoading(false);
            }
        }
        fetchFailedFilings();
    }, []);

    if (loading) {
        return <section className="content page" id="page-review">Loading...</section>;
    }

    if (error) {
        return <section className="content page" id="page-review">{error}</section>;
    }

    return (
        <section className="content page" id="page-review">
            <h2 style={{ marginBottom: "20px", color: "var(--text, #e0e0e0)", fontSize: "24px", fontWeight: "500" }}>Review Queue</h2>
            
            {filings.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--dim, #6e7a8a)", backgroundColor: "var(--card-bg, #161b22)", borderRadius: "8px", border: "1px dashed var(--border, rgba(255,255,255,0.1))", margin: "20px 0" }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--text, #a3b1c6)" }}>No files to review</h3>
                    <p style={{ margin: 0 }}>There are currently no filings that failed processing.</p>
                </div>
            ) : (
                <div className="tbl-wrap">
                    <div className="tbl-scroll">
                        <table className="log">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Form</th>
                                    <th>Company</th>
                                    <th>Filing Date</th>
                                    <th>Accession Number</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filings.map((filing) => (
                                    <tr key={filing.id}>
                                        <td>{filing.ticker}</td>
                                        <td>{filing.form}</td>
                                        <td>{filing.company_name}</td>
                                        <td>{filing.filing_date || "-"}</td>
                                        <td>{filing.accession_number}</td>
                                        <td>
                                            <span className="rstat r-fail">Failed</span>
                                        </td>
                                        <td>
                                            <a href={filing.source_url} target="_blank" rel="noreferrer" className="link">
                                                Review Source
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}

export default ReviewQueue;