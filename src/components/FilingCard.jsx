function FilingCard({filing}){


    const cleanSummary = (text) => {
        if (!text) return "Summary generation pending";
        // Strip out any [CHUNK X] or similar tags the AI might have output
        let cleaned = text.replace(/\[CHUNK[^\]]*\]/gi, '').trim();
        return cleaned;
    };

    return (

        <div className="filing-card">


            <div className="filing-top">


                <div>

                    <h3>
                        {filing.ticker}
                    </h3>

                    <span>
                        {filing.company_name}
                    </span>

                </div>


                <div className="form-badge">

                    {filing.form}

                </div>


            </div>



            <div className="filing-meta">


                <div>

                    <label>
                        ACCESSION
                    </label>

                    <p>
                        {filing.accession_number}
                    </p>

                </div>



                <div>

                    <label>
                        DATE
                    </label>

                    <p>
                        {filing.filing_date || "-"}
                    </p>

                </div>


            </div>



            <div className="status-row">

                <span>
                    STATUS
                </span>

                <strong>
                    {filing.ingestion_status}
                </strong>

            </div>



            <div className="summary-box" style={{ textAlign: "justify", whiteSpace: "pre-wrap", lineHeight: "1.6", padding: "10px", marginTop: "10px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                {cleanSummary(filing.summary)}
            </div>



        </div>

    );


}


export default FilingCard;