import { useEffect, useState } from "react";


function Topbar({ onMenuClick }) {

    const [time,setTime] = useState("");



    useEffect(()=>{

        const timer=setInterval(()=>{

            setTime(
                new Date()
                .toLocaleTimeString(
                    "en-US",
                    {
                        hour12:false,
                        timeZone:"America/New_York"
                    }
                )
            );


        },1000);


        return ()=>clearInterval(timer);


    },[]);



    return (

        <header className="topbar">

            <button className="menu-btn" onClick={onMenuClick}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>

            <div>

                <h2>
                    Filings
                </h2>


                <span className="crumb">
                    home · intercepted 8-K documents
                </span>

            </div>



            <div className="top-spacer"/>



            <div className="readout">

                <span className="k">
                    SESSION
                </span>

                <span className="v" style={{color: "var(--green)"}}>
                    OPEN
                </span>

            </div>



            <div className="readout">

                <span className="k">
                    ET
                </span>

                <span className="v clock">
                    {time}
                </span>

            </div>



            <span className="status-chip">

                <span className="dot"/>

                COLLECTING

            </span>


        </header>

    );

}


export default Topbar;