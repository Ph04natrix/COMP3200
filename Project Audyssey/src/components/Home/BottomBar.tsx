import "./BottomBar.css";

function BottomBar() {


    return(
        <div className="outline">
            <div className="ActiveSong"></div>
            <div className="PlaybackControl"></div>
            <div className="SettingsAndFaff">{/* List of buttons, including the settings button*/}
                <p></p>
            </div>
            <p>This is the bottom bar.</p>
        </div>
    );
}

export default BottomBar;