import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
// 8-K/A DISABLED: resolveAmendment removed.
// import { getFilings, resolveAmendment } from "../services/filingService";
import { getFilings } from "../services/filingService";
import { getUser } from "../api/auth";
import ClassificationReview from "../components/ClassificationReview";

// const AMBIGUOUS_AMENDMENT_TARGET = "AMBIGUOUS_AMENDMENT_TARGET";  // 8-K/A DISABLED
const formatStage = (stage) => {
    if (!stage) {
        return "Unknown";
    }

    return (
        stage.charAt(0).toUpperCase()
        + stage.slice(1)
    );
};


const formatReason = (code) => {
    if (!code) {
        return "Unknown Error";
    }

    return code
        .split("_")
        .map(
            (word) =>
                word.charAt(0).toUpperCase()
                + word.slice(1)
        )
        .join(" ");
};


const formatDate = (isoString) => {
    if (!isoString) {
        return "-";
    }

    const date = new Date(
        isoString
    );

    return date.toLocaleString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
};


// Guide Part 5: this was the whole page. It is now the "Failures" tab,
// unchanged apart from rendering the tab bar it is given.
function FailuresQueue({ tabs }) {

    const [filings, setFilings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 8-K/A DISABLED: amendment-resolution state removed.
    // const [selectedCandidates, setSelectedCandidates] =
    //     useState({});
    //
    // const [resolvingId, setResolvingId] =
    //     useState(null);

    // 8-K/A DISABLED: only the amendment-resolve flow set this.
    // const [actionError, setActionError] =
    //     useState("");


    useEffect(() => {

    async function fetchReviewQueue() {
        try {
            setLoading(true);
            setError("");

            const result = await getFilings({
                status: "review"
            });

            setFilings(
                result.items
            );

        } catch (err) {

            console.error(
                "Failed to fetch review queue",
                err
            );

            setError(
                "Unable to load review queue"
            );

        } finally {
            setLoading(false);
        }
    }

    fetchReviewQueue();

}, []);


    // 8-K/A DISABLED: amendment helpers and resolve handler removed.
    // const isAmbiguousAmendment = (filing) => (
    //     filing.form === "8-K/A"
    //     && filing.flag === true
    //     && filing.flag_reason
    //         === AMBIGUOUS_AMENDMENT_TARGET
    //     && !filing.amends_accession
    // );


    // const handleCandidateChange = (
    //     filingId,
    //     value
    // ) => {

    //     setSelectedCandidates(
    //         (current) => ({
    //             ...current,
    //             [filingId]: value
    //         })
    //     );

    //     setActionError("");
    // };


    // const handleResolve = async (filing) => {

    //     const selectedOriginalId =
    //         selectedCandidates[
    //             filing.id
    //         ];

    //     if (!selectedOriginalId) {

    //         setActionError(
    //             "Select an original 8-K before resolving the amendment."
    //         );

    //         return;
    //     }

    //     try {

    //         setResolvingId(
    //             filing.id
    //         );

    //         setActionError("");

    //         await resolveAmendment(
    //             filing.id,
    //             Number(
    //                 selectedOriginalId
    //             )
    //         );

    //         /*
    //             Once resolved, the filing is no longer
    //             part of the ambiguous review queue.
    //         */
    //         setFilings(
    //             (current) =>
    //                 current.filter(
    //                     (item) =>
    //                         item.id
    //                         !== filing.id
    //                 )
    //         );

    //         setSelectedCandidates(
    //             (current) => {

    //                 const next = {
    //                     ...current
    //                 };

    //                 delete next[
    //                     filing.id
    //                 ];

    //                 return next;
    //             }
    //         );

    //     } catch (err) {

    //         console.error(
    //             "Failed to resolve amendment",
    //             err
    //         );

    //         if (
    //             err?.response?.status === 401
    //             || err?.response?.status === 403
    //         ) {
    //             setActionError(
    //                 "Administrator authentication is required to resolve amendments."
    //             );

    //         } else if (
    //             err?.response?.data?.message
    //         ) {
    //             setActionError(
    //                 err.response.data.message
    //             );

    //         } else {
    //             setActionError(
    //                 "Unable to resolve amendment."
    //             );
    //         }

    //     } finally {

    //         setResolvingId(
    //             null
    //         );
    //     }
    // };


    if (loading) {
        return (
            <section
                className="content page"
                id="page-review"
            >
                {tabs}
                Loading...
            </section>
        );
    }


    if (error) {
        return (
            <section
                className="content page"
                id="page-review"
            >
                {tabs}
                {error}
            </section>
        );
    }


    return (
        <section
            className="content page"
            id="page-review"
        >
            <h2
                style={{
                    marginBottom: "20px",
                    color:
                        "var(--text, #e0e0e0)",
                    fontSize: "24px",
                    fontWeight: "500"
                }}
            >
                Review Queue
            </h2>

            {tabs}

            {/* 8-K/A DISABLED: amendment action-error banner removed.
            {actionError && (
                <div
                    style={{
                        marginBottom: "16px",
                        padding: "12px 14px",
                        border:
                            "1px solid var(--border, rgba(255,255,255,0.1))",
                        borderRadius: "6px"
                    }}
                >
                    {actionError}
                </div>
            )}
            */}

            {filings.length === 0 ? (

                <div
                    style={{
                        padding: "40px",
                        textAlign: "center",
                        color:
                            "var(--dim, #6e7a8a)",
                        backgroundColor:
                            "var(--card-bg, #161b22)",
                        borderRadius: "8px",
                        border:
                            "1px dashed var(--border, rgba(255,255,255,0.1))",
                        margin: "20px 0"
                    }}
                >
                    <h3
                        style={{
                            margin:
                                "0 0 10px 0",
                            color:
                                "var(--text, #a3b1c6)"
                        }}
                    >
                        No files to review
                    </h3>

                    <p
                        style={{
                            margin: 0
                        }}
                    >
                        {/* 8-K/A DISABLED: was "There are currently no failed filings or ambiguous amendments requiring review." */}
                        There are currently no failed filings
                        requiring review.
                    </p>
                </div>

            ) : (

                <div className="tbl-wrap">

                    <div className="tbl-scroll">

                        <table className="log">

                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Company</th>
                                    <th>Form</th>
                                    <th>Filing Date</th>
                                    <th>
                                        Accession Number
                                    </th>
                                    <th>
                                        Review Type
                                    </th>
                                    <th>
                                        Reason
                                    </th>
                                    <th>
                                        Details
                                    </th>
                                    <th>
                                        Review Date
                                    </th>
                                    <th>
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {filings.map(
                                    (filing) => {

                                        // 8-K/A DISABLED: ambiguous-amendment rows removed.
                                        // const ambiguous =
                                        //     isAmbiguousAmendment(
                                        //         filing
                                        //     );
                                        //
                                        // const candidates =
                                        //     Array.isArray(
                                        //         filing
                                        //             .candidate_originals
                                        //     )
                                        //         ? filing
                                        //             .candidate_originals
                                        //         : [];

                                        return (
                                            <tr
                                                key={
                                                    filing.id
                                                }
                                            >
                                                <td>
                                                    {
                                                        filing.ticker
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        filing.company_name
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        filing.form
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        filing.filing_date
                                                        || "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        filing.accession_number
                                                    }
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            /* 8-K/A DISABLED: ambiguous ? "rstat" : */
                                                            "rstat r-fail"
                                                        }
                                                    >
                                                        {
                                                            /* 8-K/A DISABLED: ambiguous ? "Amendment Review" : */
                                                            formatStage(
                                                                filing
                                                                    .failure_stage
                                                            )
                                                        }
                                                    </span>
                                                </td>

                                                <td>
                                                    {
                                                        /* 8-K/A DISABLED: ambiguous ? "Ambiguous Amendment Target" : */
                                                        formatReason(
                                                            filing
                                                                .failure_code
                                                        )
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        maxWidth:
                                                            "360px",
                                                        wordWrap:
                                                            "break-word",
                                                        whiteSpace:
                                                            "normal"
                                                    }}
                                                >
                                                    {
                                                        /* 8-K/A DISABLED: candidate-original picker removed.
                                                        ambiguous
                                                            ? (
                                                                <div>
                                                                    <div
                                                                        style={{
                                                                            marginBottom:
                                                                                "8px"
                                                                        }}
                                                                    >
                                                                        Select the original 8-K
                                                                        that this amendment belongs to.
                                                                    </div>

                                                                    {candidates.length > 0 ? (
                                                                        <select
                                                                            value={
                                                                                selectedCandidates[
                                                                                    filing.id
                                                                                ]
                                                                                || ""
                                                                            }
                                                                            onChange={
                                                                                (event) =>
                                                                                    handleCandidateChange(
                                                                                        filing.id,
                                                                                        event.target.value
                                                                                    )
                                                                            }
                                                                        >
                                                                            <option value="">
                                                                                Select original filing
                                                                            </option>

                                                                            {candidates.map(
                                                                                (
                                                                                    candidate
                                                                                ) => (
                                                                                    <option
                                                                                        key={
                                                                                            candidate.id
                                                                                        }
                                                                                        value={
                                                                                            candidate.id
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            candidate.accession_number
                                                                                        }
                                                                                        {" — "}
                                                                                        {
                                                                                            candidate.filing_date
                                                                                            || "No filing date"
                                                                                        }
                                                                                    </option>
                                                                                )
                                                                            )}
                                                                        </select>
                                                                    ) : (
                                                                        <span>
                                                                            No valid candidate originals found.
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )
                                                        */
                                                        filing
                                                            .failure_message
                                                        || "Unknown error"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        /* 8-K/A DISABLED: ambiguous ? (filing.report_date || "-") : */
                                                        formatDate(
                                                            filing
                                                                .failure_created_at
                                                        )
                                                    }
                                                </td>

                                                <td>
                                                    <div
                                                        style={{
                                                            display:
                                                                "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap:
                                                                "8px"
                                                        }}
                                                    >
                                                        {filing.source_url && (
                                                            <a
                                                                href={
                                                                    filing.source_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="link"
                                                            >
                                                                Review Source
                                                            </a>
                                                        )}

                                                        {/* 8-K/A DISABLED: Resolve Amendment button removed.
                                                        {ambiguous && (
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    resolvingId
                                                                        === filing.id
                                                                    || !selectedCandidates[
                                                                        filing.id
                                                                    ]
                                                                }
                                                                onClick={
                                                                    () =>
                                                                        handleResolve(
                                                                            filing
                                                                        )
                                                                }
                                                            >
                                                                {
                                                                    resolvingId
                                                                        === filing.id
                                                                        ? "Resolving..."
                                                                        : "Resolve Amendment"
                                                                }
                                                            </button>
                                                        )}
                                                        */}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>
            )}
        </section>
    );
}


/*
    Guide Part 5: Review Queue with two tabs.

    Failures        - the existing view, untouched (status=review).
    Classification  - low-confidence Interpreter output (staff only;
                      the backend enforces this too).

    Non-staff users see exactly the page they saw before: no tab bar.
*/
function ReviewQueue() {
    const isStaff = Boolean(getUser()?.is_staff);
    // "/review?tab=classification" (from a Filings card) opens that tab.
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState(
        searchParams.get("tab") === "classification" ? "classification" : "failures"
    );

    const tabs = isStaff ? (
        <div className="filters" style={{ marginBottom: "16px" }}>
            <button
                className={`chip ${tab === "failures" ? "active" : ""}`}
                onClick={() => setTab("failures")}
            >
                Failures
            </button>
            <button
                className={`chip ${tab === "classification" ? "active" : ""}`}
                onClick={() => setTab("classification")}
            >
                Classification
            </button>
        </div>
    ) : null;

    if (isStaff && tab === "classification") {
        return <ClassificationReview tabs={tabs} />;
    }

    return <FailuresQueue tabs={tabs} />;
}

export default ReviewQueue;