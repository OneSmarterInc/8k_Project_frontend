import {
    useEffect,
    useState
} from "react";
import FilingTable from "../components/FilingTable";

import {
    getFilings
} from "../services/filingService";

import FilingWorkspace from "../components/FilingWorkspace";
import Pagination from "../components/Pagination";
import QueueExports from "../components/QueueExports";
import StatStrip from "../components/StatStrip";

import FilingCard from "../components/FilingCard";

/*
    Filter controls for filing intelligence table
*/
import FilterBar from "../components/FilterBar";

// Last successful filings response, kept for this browser session.
// Lets the Filings page render immediately when you navigate back to it
// while a fresh copy loads in the background.
let filingsCache = null;

function Dashboard(){


    const [filings,setFilings] = useState(filingsCache || []);

    /*
    Filter and sorting states
*/
const [search,setSearch] = useState("");

    // I-01: which slice of the filtered list is rendered. The full
    // list is still fetched and still filtered in full - only the
    // number of cards on screen changes.
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

const [formFilter,setFormFilter] = useState("ALL");
const [timeframe, setTimeframe] = useState("ALL");
    const [loading,setLoading] = useState(filingsCache === null);

    const [error,setError] = useState("");



    async function loadFilings(){
        try{
            // Show "Loading filings..." only when nothing is cached yet;
            // otherwise keep the cached list visible while refreshing.
            if (filingsCache === null) {
                setLoading(true);
            }

            const result = await getFilings();

            console.log(
                "FILINGS FROM BACKEND:",
                result
            );

            filingsCache = result.items;
            setFilings(result.items);
            setError("");
        }
        catch(err){

            console.error(
                "Filing API Error:",
                err.response || err
            );

            // With cached data on screen, a failed background refresh keeps
            // the list visible; without it, show the error as before.
            if (filingsCache === null) {
                setError(
                    err.response?.data?.detail ||
                    "Unable to load filings"
                );
            }
        }
        finally{
            setLoading(false);
        }
    }

    useEffect(()=>{

        loadFilings();

    },[]);


    // I-01: any change to the filters starts a new result set.
    useEffect(() => {
        setPage(1);
    }, [search, formFilter, timeframe, pageSize]);


    const filterByTimeframe = (filingsList) => {
        if (timeframe === "ALL") return filingsList;
        const now = new Date();
        return filingsList.filter(f => {
            if (!f.filing_date) return false;
            const [y, m, d] = f.filing_date.split('-');
            const filingDate = new Date(y, m - 1, d);
            
            if (timeframe === "TODAY") {
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return filingDate.getTime() === todayMidnight.getTime();
            }
            if (timeframe === "WTD") {
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                sevenDaysAgo.setHours(0,0,0,0);
                return filingDate >= sevenDaysAgo;
            }
            if (timeframe === "MTD") {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return filingDate >= startOfMonth;
            }
            if (timeframe === "QTD") {
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                const startOfQuarter = new Date(now.getFullYear(), quarterMonth, 1);
                return filingDate >= startOfQuarter;
            }
            if (timeframe === "YTD") {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return filingDate >= startOfYear;
            }
            return true;
        });
    };

    const timeframeFilteredFilings = filterByTimeframe(filings);

    const filteredFilings = timeframeFilteredFilings
        .filter((filing) =>
            filing.ticker?.toLowerCase().includes(search.toLowerCase())
        )
        .filter((filing) =>
            formFilter === "ALL" || filing.form === formFilter
        )
        .sort((a,b)=>{
            return new Date(b.accepted_at) - new Date(a.accepted_at);
        });

    // I-01: land back on page 1 whenever the result set changes, so a
    // narrowed search can never leave the user on an empty page.
    const totalPages = Math.max(
        Math.ceil(filteredFilings.length / pageSize),
        1
    );

    const currentPage = Math.min(page, totalPages);

    const pagedFilings = filteredFilings.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );



    if(loading){

        return (

            <div>

                Loading filings...

            </div>

        );

    }



    if(error){

        return (

            <div>

                {error}

            </div>

        );

    }



    return (

        <section className="content page" id="page-filings">
            
            <FilterBar
                search={search}
                setSearch={setSearch}
                formFilter={formFilter}
                setFormFilter={setFormFilter}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
            />

            <StatStrip
                filings={timeframeFilteredFilings}
                timeframe={timeframe}
            />

            {/* W-038: browse and download the daily capture queue CSVs. */}
            <QueueExports />

            <FilingWorkspace
                filings={pagedFilings}
            />

            {/* I-01: previous / next controls for the filings list. */}
            <Pagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={filteredFilings.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
            />



        </section>

    );

}



export default Dashboard;