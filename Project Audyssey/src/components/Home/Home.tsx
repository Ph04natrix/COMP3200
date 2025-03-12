import { useState } from "react";
import BottomBar from "./BottomBar";
import TitleBar from "./CenterColumn/TitleBar";
import { AudioResource, SongColType } from "../../types/audioResources";

import "./Home.css";

/* //todo
Can use source which is just one audio collection
Or can use multiple sources of track
*/

export default function Main() {
    const [activeAudioResource, setActiveAudioResource] = useState<AudioResource>({
        type: SongColType.Library,
        name: "",
        view: {
            type: "Dashboard"
        }
    });
    
    // Should only be active when in a graph view
    const [xAxis, setXAxis] = useState();
    const [yAxis, setYAxis] = useState();
    const [zAxis, setZAxis] = useState();

    return(<>
    <div className="flex-row">
        <div id="leftColumn">
            <div className="SideBox">Top left box</div>
            <div className="SideBox">Bottom left box</div>
        </div>
        <div id="centerColumn" className="center">
            <TitleBar activeAudioResource={activeAudioResource} />
            <div className="View"></div>
            <div className="ViewSelector">
                <button>Table</button>
                <button>Static Graph</button>
                <button>Dynamic Graph</button>
            </div>
        </div>
        <div id="rightColumn">
            <div className="SideBox">Top right box</div>
            <div className="SideBox">Bottom right box</div>
        </div>
    </div>
    <BottomBar />
    </>);
}