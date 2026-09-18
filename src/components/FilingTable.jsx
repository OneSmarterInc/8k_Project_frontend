function FilingTable({filings}){


    return (

        <div className="table-wrapper">


            <table className="filing-table">


                <thead>

                    <tr>

                        <th>
                            Timestamp
                        </th>

                        <th>
                            Filename
                        </th>

                        <th>
                            Ticker
                        </th>

                        <th>
                            Type
                        </th>

                        <th>
                            Summary Status
                        </th>

                        <th>
                            Original File
                        </th>

                    </tr>

                </thead>


                <tbody>


                {
                    filings.map(

                        filing => (

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
                                        filing.ticker
                                    }

                                </td>



                                <td>

                                    <span className="form-pill">

                                        {
                                            filing.form
                                        }

                                    </span>

                                </td>



                                <td>

                                    <span className="status-pill">

                                        {
                                            filing.summary
                                            ?
                                            "Generated"
                                            :
                                            "Pending"
                                        }

                                    </span>

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

                        )

                    )
                }


                </tbody>


            </table>


        </div>

    );

}


export default FilingTable;