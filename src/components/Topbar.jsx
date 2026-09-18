import { useEffect, useState } from "react";


function Topbar(){

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