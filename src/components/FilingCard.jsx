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

            {/* 8-K/A DISABLED: amendment badges removed.
            {filing.amends_accession && (
                <div style={{ backgroundColor: 'rgba(255, 204, 0, 0.2)', color: '#ffcc00', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', margin: '0 20px', borderRadius: '4px', border: '1px solid rgba(255, 204, 0, 0.4)' }}>
                    AMENDMENT TO {filing.amends_accession}
                </div>
            )}
            
{filing.amended_by_accession?.length > 0 && (
    <div style={{ backgroundColor: 'rgba(255, 68, 68, 0.2)', color: '#ff4444', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', margin: '0 20px', borderRadius: '4px', border: '1px solid rgba(255, 68, 68, 0.4)' }}>
        ⚠️ OUTDATED: SEE AMENDMENT {filing.amended_by_accession.join(", ")}
    </div>
)}
*/}
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