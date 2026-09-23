function FilingTable({ filings }) {

    return (

        <div className="table-wrapper">

            <table className="filing-table">

                <thead>

                    <tr>

                        <th>Timestamp</th>

                        <th>Filename</th>

                        <th>Ticker</th>

                        <th>Type</th>

                        <th>Summary Status</th>

                        <th>Entry Session</th>

                        <th>Entry Rule</th>

                        <th>SEC Items</th>

                        <th>Item Check</th>

                        <th>Original File</th>

                    </tr>

                </thead>


                <tbody>

                    {
                        filings.map((filing) => (

                            <tr key={filing.id}>


                                <td>
                                    {
                                        filing.accepted_at ||
                                        filing.created_at ||
                                        "-"
                                    }
                                </td>


                                <td>
                                    {
                                        filing.primary_document ||
                                        "-"
                                    }
                                </td>


                                <td className="ticker">
                                    {
                                        filing.ticker || "-"
                                    }
                                </td>


                                <td>

                                    <span className="form-pill">
                                        {
                                            filing.form || "-"
                                        }
                                    </span>

                                    {filing.amends_accession && (
                                        <div style={{
                                            fontSize: "10px",
                                            color: "#ffcc00",
                                            marginTop: "4px"
                                        }}>
                                            Amends: {filing.amends_accession.substring(0, 10)}...
                                        </div>
                                    )}

                                    {filing.amended_by_accession?.length > 0 && (
                                        <div style={{
                                            fontSize: "10px",
                                            color: "#ff4444",
                                            marginTop: "4px"
                                        }}>
                                            ⚠️ Outdated
                                        </div>
                                    )}

                                </td>


                                <td>

                                    <span className="status-pill">

                                        {
                                            filing.summary
                                                ? "Generated"
                                                : "Pending"
                                        }

                                    </span>

                                </td>


                                <td>
                                    {
                                        filing.entry_session || "-"
                                    }
                                </td>


                                <td>
                                    {
                                        filing.entry_rule || "-"
                                    }
                                </td>


                                <td>

                                    {
                                        filing.sec_item_codes
                                            ? filing.sec_item_codes.replace(/[()']/g, "")
                                            : "-"
                                    }

                                </td>


                                <td>

                                    {
                                        filing.item_codes_match === true
                                            ? "MATCH"
                                            :
                                        filing.item_codes_match === false
                                            ? "MISMATCH"
                                            :
                                            "N/A"
                                    }

                                </td>


                                <td>

                                    {
                                        filing.source_url
                                            ?
                                            (
                                                <a
                                                    href={filing.source_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    View
                                                </a>
                                            )
                                            :
                                            "-"
                                    }

                                </td>


                            </tr>

                        ))
                    }

                </tbody>

            </table>

        </div>

    );

}


export default FilingTable;