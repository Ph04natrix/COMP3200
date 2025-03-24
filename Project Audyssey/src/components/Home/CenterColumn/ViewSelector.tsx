import { SongCollection, StaticCamera } from "../../../types/audioResources";
import "../CenterColumn/ViewSelector.css";

export default function ViewSelector(props: {
    activeAudioResource: SongCollection,
    setActiveAudioResource: any,
    cameraState: StaticCamera
}) {
    const handleRadioChange = (event: any) => {
        console.log("view changed to: ", event.target.value)
        
        props.setActiveAudioResource({
            ...props.activeAudioResource,
            view: event.target.value
        })
    }

    return(<>
    <div id="view-selector" className="container">
        <label htmlFor="dashboard" className="view-selector">
            <input
                type="radio"
                value="Dashboard"
                checked={props.activeAudioResource.view === "Dashboard"}
                onChange={handleRadioChange}
                name="Dashboard"
            />
            <img src="/dashboard.svg" alt="Dashboard" className="view-svg"/>
        </label>
        <label htmlFor="table" className="view-selector">
            <input
                type="radio"
                value="Table"
                checked={props.activeAudioResource.view === "Table"}
                onChange={handleRadioChange}
                name="Table"
            />
            <img src="/table.svg" alt="Table" className="view-svg"/>
        </label>
        <label htmlFor="static-graph" className="view-selector">
            <input
                type="radio"
                value="StaticGraph"
                checked={props.activeAudioResource.view === "StaticGraph"}
                onChange={handleRadioChange}
                name="StaticGraph"
            />
            <img
                src={props.cameraState === "XYZ" ? "/static-graph-3d.svg" : "/static-graph-2d.svg"}
                alt="Static Graph"
                className="view-svg"
            />
        </label>
        <label htmlFor="dynamic-graph" className="view-selector">
            <input
                type="radio"
                value="DynamicGraph"
                checked={props.activeAudioResource.view === "DynamicGraph"}
                onChange={handleRadioChange}
                name="DynamicGraph"
            />
            <img src="/dynamic-graph.svg" alt="Dynamic Graph" className="view-svg"/>
        </label>
    </div>
    </>)
}