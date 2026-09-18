function StatStrip({ filings, timeframe }) {

    const timeframeLabels = {
        ALL: "ALL TIME",
        TODAY: "TODAY",
        WTD: "WTD",
        MTD: "MTD",
        QTD: "QTD",
        YTD: "YTD"
    };

    const stats = [
        {
            label: `TOTAL FILINGS - ${timeframeLabels[timeframe]}`,
            value: filings.length
        },
        {
            label: "8-K",
            value: filings.filter(f => f.form === "8-K").length
        },
        {
            label: "10-K",
            value: filings.filter(f => f.form === "10-K").length
        },
        {
            label: "10-Q",
            value: filings.filter(f => f.form === "10-Q").length
        }
    ];

    return (
        <div className="strip">
            {stats.map(stat => (
                <div className="stat" key={stat.label}>
                    <div className="n">{stat.value}</div>
                    <div className="l">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}

export default StatStrip;