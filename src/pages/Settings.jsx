/*
    I-08: this page is intentionally unreachable.

    The real settings live in Schedule.jsx, which owns the automation
    schedule, the SMTP configuration and the live log terminal. There
    is no route for /settings in App.jsx and the nav entry in
    Sidebar.jsx is commented out, so nothing links here.

    The file is kept rather than deleted so a future Settings page has
    somewhere obvious to start. If that happens, register the route in
    App.jsx and uncomment the nav entry in Sidebar.jsx.
*/
function Settings(){

    return (
        <h1>
            Settings
        </h1>
    );

}

export default Settings;