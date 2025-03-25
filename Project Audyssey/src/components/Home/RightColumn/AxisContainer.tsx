import { Dispatch, SetStateAction, useMemo } from "react";
import { AttrSelect, ContinuousMetric, StaticCamera } from "../../../types/audioResources";
import "./AxisContainer.css";
import DragAttr from "./DragAttr";

export default function AxisContainer(props: {
    thisAttr: AttrSelect,
    allAttrs: AttrSelect[],
    updateAttrSelects: Dispatch<SetStateAction<AttrSelect[]>>,
    updateRange: any,
    cameraState: StaticCamera,
    setCameraState: Dispatch<SetStateAction<StaticCamera>>
}) {
    const selected: boolean = useMemo(() => {
        return props.cameraState.includes(props.thisAttr.use)
    }, [props.cameraState, props.thisAttr])

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const newAttr = e.dataTransfer.getData("attr") as ContinuousMetric;

        const newAttrSelectors: AttrSelect[] = props.allAttrs.map(attrSelect => {
            if (attrSelect.attr === props.thisAttr.attr) {// set the current attribute to be unused
                return {
                    ...attrSelect,
                    attr: props.thisAttr.attr,
                    use: "Unused",
                    active: false,
                }
            } else if (attrSelect.attr === newAttr) {// set the incoming attribute to be the new thingy
                return {
                    ...attrSelect,
                    attr: newAttr,
                    use: props.thisAttr.use,
                    active: true
                }
            } else {
                return attrSelect
            }
        })

        props.updateAttrSelects(newAttrSelectors);
    }

    function handleAxisClick() {
        if (props.cameraState.includes(props.thisAttr.use)) {
            // The axis this component controls is visible so we turn it off
            props.setCameraState("XYZ".replace(props.thisAttr.use, "") as StaticCamera);
        } else {
            // we turn axis on along, going back to 3D
            props.setCameraState(StaticCamera.All);
        }
    }

    if (props.thisAttr === undefined) {
        return(<div>N</div>)
    } else {
        return(<div
            className={selected ? "axis-container" : "axis-container unselected"}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
        >
            <button id="axis" onClick={handleAxisClick}>
                {props.thisAttr.use}
            </button>
            <DragAttr
                attrSelect={props.thisAttr}
                draggable={false}
                updateRange={props.updateRange}
            />
        </div>)
    }
}