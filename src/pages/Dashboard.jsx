import {
    useEffect,
    useState
} from "react";
import FilingTable from "../components/FilingTable";

import {
    getFilings
} from "../services/filingService";

import FilingWorkspace from "../components/FilingWorkspace";
import StatStrip from "../components/StatStrip";

import FilingCard from "../components/FilingCard";

/*
    Filter controls for filing intelligence table
*/
import FilterBar from "../components/FilterBar";

function Dashboard(){


    const [filings,setFilings] = useState([]);

    /*
    Filter and sorting states
*/
const [search,setSearch] = useState("");

const [formFilter,setFormFilter] = useState("ALL");
const [timeframe, setTimeframe] = useState("ALL");
    const [loading,setLoading] = useState(true);

    const [error,setError] = useState("");



    async function loadFilings(){
        try{
            setLoading(true);

            const result = await getFilings();

            console.log(
                "FILINGS FROM BACKEND:",
                result
            );

            setFilings(result.items);
        }
        catch(err){

            console.error(
                "Filing API Error:",
                err.response || err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load filings"
            );
        }
        finally{
            setLoading(false);
        }
    }

    useEffect(()=>{

        loadFilings();

    },[]);


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

            <FilingWorkspace
                filings={filteredFilings}
            />



        </section>

    );

}



export default Dashboard;