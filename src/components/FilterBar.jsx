/*
    FilterBar Component

    Purpose:
    - Provides filtering and sorting controls for filings.
    - Works only with backend-provided filing data.
    - Does not call APIs directly.
    - Parent component controls the final filtered result.
*/


function FilterBar({
    search,
    setSearch,
    formFilter,
    setFormFilter,
    timeframe,
    setTimeframe
}) {

    const formatDateStr = (dateStr) => {
        const [yyyy, mm, dd] = dateStr.split('-');
        const d = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
            return "Today";
        }
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };


    return (

        <div className="filters">


            {/* Search filings by ticker name */}
            <input
                className="search"

                type="text"

                placeholder="Search ticker..."

                value={search}

                onChange={
                    (event)=>
                    setSearch(
                        event.target.value
                    )
                }

            />



            {/* Filing type filter */}
            <select
                className="search"

                value={formFilter}

                onChange={
                    (event)=>
                    setFormFilter(
                        event.target.value
                    )
                }

            >

                <option value="ALL">
                    All Forms
                </option>


                <option value="8-K">
                    8-K
                </option>


                <option value="10-K">
                    10-K
                </option>


                <option value="10-Q">
                    10-Q
                </option>


            </select>




            {/* Timeframe filter */}
            <select
                className="search"
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
            >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WTD">Week to Date (WTD)</option>
                <option value="MTD">Month to Date (MTD)</option>
                <option value="QTD">Quarter to Date (QTD)</option>
                <option value="YTD">Year to Date (YTD)</option>
            </select>

        </div>

    );

}


export default FilterBar;