import { useState } from "react";

function FilingWorkspace({ filings }) {
    const [activeMailFiling, setActiveMailFiling] = useState(null);

    const closeModal = () => setActiveMailFiling(null);

    return (
        <>
            <div id="filingList">
                {filings.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "var(--dim, #6e7a8a)", backgroundColor: "var(--card-bg, #161b22)", borderRadius: "8px", border: "1px dashed var(--border, rgba(255,255,255,0.1))", margin: "20px 0" }}>
                        <h3 style={{ margin: "0 0 10px 0", color: "var(--text, #a3b1c6)" }}>No filings available</h3>
                        <p style={{ margin: 0 }}>There are no processed SEC filings for the selected date.</p>
                    </div>
                ) : (
                    filings.map((filing) => (
                        <div className="fcard" key={filing.id}>
                            {/* Filing header */}
                            <div className="fcard-head">
                                <span className="tkr">{filing.ticker} <span style={{fontSize: "0.85em", opacity: 0.75, fontWeight: "normal"}}>({filing.company_name})</span></span>
                                <span className="item">{filing.form}</span>
                                {filing.classification && (
                                    <span className={`tag ${filing.classification.toLowerCase() === 'material' ? 't-mat' : filing.classification.toLowerCase() === 'flagged' ? 't-flag' : 't-rout'}`}>
                                        {filing.classification.toUpperCase()}
                                    </span>
                                )}
                                <span className="acc">{filing.accession_number}</span>
                            </div>

                            {/* AI summary from backend */}
                            <p className="fsum" style={{ textAlign: "justify", whiteSpace: "pre-wrap", lineHeight: "1.6", color: "var(--text-color, #e0e0e0)" }}>
                                {filing.summary ? filing.summary.replace(/\[CHUNK[^\]]*\]/gi, '').trim() : "Summary pending"}
                            </p>

                            {/* Filing metadata */}
                            <div className="fmeta">
                                Filed {filing.filing_date || "-"}
                            </div>

                            {/* Actions */}
                            <div className="factions">
                                <button className="btn" onClick={() => setActiveMailFiling(filing)}>
                                    View Mail
                                </button>

                                <a href={filing.source_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-open">
                                    Open
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Mail Panel Overlay (Right Side) */}
            {activeMailFiling && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        backgroundColor: 'rgba(5, 8, 12, 0.4)', backdropFilter: 'blur(2px)',
                        zIndex: 9999, display: 'flex', justifyContent: 'flex-end'
                    }}
                    onClick={closeModal}
                >
                    <div 
                        style={{
                            backgroundColor: 'var(--bg, #0d1117)', width: '100%', maxWidth: '450px', height: '100vh',
                            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
                            display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: 'default',
                            borderLeft: '1px solid var(--border, rgba(255,255,255,0.05))'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ padding: '24px', backgroundColor: 'var(--card-head-bg, #121820)', borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ margin: '0 0 8px 0', color: 'var(--green, #66d9a8)', fontSize: '24px', fontWeight: '500' }}>
                                    {activeMailFiling.ticker} <span style={{fontSize: "0.7em", opacity: 0.8}}>({activeMailFiling.company_name})</span>
                                </h2>
                                <div style={{ color: 'var(--dim, #6e7a8a)', fontSize: '12px', fontFamily: 'monospace' }}>
                                    {activeMailFiling.accession_number}
                                </div>
                            </div>
                            <button 
                                onClick={closeModal} 
                                style={{ background: 'none', border: 'none', color: 'var(--dim, #6e7a8a)', fontSize: '24px', cursor: 'pointer', padding: '0 5px' }}
                            >
                                &times;
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                                <span className="item">{activeMailFiling.form}</span>
                                {activeMailFiling.classification && (
                                    <span className={`tag ${activeMailFiling.classification.toLowerCase() === 'material' ? 't-mat' : activeMailFiling.classification.toLowerCase() === 'flagged' ? 't-flag' : 't-rout'}`}>
                                        {activeMailFiling.classification.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            
                            <h3 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1px', color: 'var(--dim, #6e7a8a)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                AI Summary
                            </h3>
                            
                            <div style={{ color: 'var(--text, #a3b1c6)', fontSize: '14px', lineHeight: '1.6', textAlign: 'justify', whiteSpace: 'pre-wrap', marginBottom: '40px' }}>
                                {activeMailFiling.summary ? activeMailFiling.summary.replace(/\[CHUNK[^\]]*\]/gi, '').trim() : "Summary generation pending..."}
                            </div>
                            
                            <h3 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1px', color: 'var(--dim, #6e7a8a)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Company / Filing Details
                            </h3>
                            
                            <div style={{ border: '1px solid var(--border, rgba(255,255,255,0.05))', borderRadius: '6px', overflow: 'hidden', marginBottom: '40px' }}>
                                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', color: 'var(--text, #a3b1c6)' }}>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)', width: '40%' }}>Ticker</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>{activeMailFiling.ticker}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>Form Type</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>{activeMailFiling.form}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>Filing Date</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>{activeMailFiling.filing_date || activeMailFiling.accepted_at?.split('T')[0]}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>EDGAR Accepted</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>
                                                {activeMailFiling.accepted_at 
                                                    ? (new Date(activeMailFiling.accepted_at).toLocaleString('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '') + ' ET') 
                                                    : "N/A"}
                                            </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>Entry Session</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>
                                                {(() => {
                                                    if(!activeMailFiling.accepted_at) return "N/A";
                                                    let d = new Date(activeMailFiling.accepted_at);
                                                    d.setDate(d.getDate() + 1);
                                                    return d.toISOString().split('T')[0];
                                                })()}
                                            </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>SEC Item Codes</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>
                                                {activeMailFiling.sec_item_codes ? activeMailFiling.sec_item_codes.replace(/[()']/g, '') : "N/A"}
                                            </td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>Item Verification</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace', color: 'var(--green, #66d9a8)' }}>MATCH</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>Company Verification</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace', color: 'var(--green, #66d9a8)' }}>MATCH</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))' }}>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>Accession Number</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace' }}>{activeMailFiling.accession_number}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '8px 16px', color: 'var(--dim, #6e7a8a)' }}>Filename</td>
                                            <td style={{ padding: '8px 16px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                {activeMailFiling.form} (Current report)_{activeMailFiling.form}_{activeMailFiling.filing_date || activeMailFiling.accepted_at?.split('T')[0]}.htm
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <h3 style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1px', color: 'var(--dim, #6e7a8a)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                Source Information
                            </h3>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn" style={{ flex: 1 }} onClick={() => window.open(activeMailFiling.source_url, '_blank')}>
                                    Open SEC EDGAR Filing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default FilingWorkspace;