import { Dispatch, SetStateAction } from "react";
import { AttrSelect, ContinuousMetric } from "../../../types/audioResources";
import "./AxisContainer.css";
import DragAttr from "./DragAttr";

export default function AxisContainer(props: {
    attr: AttrSelect,
    allAttrs: AttrSelect[],
    updateAttrSelects: Dispatch<SetStateAction<AttrSelect[]>>,
    updateRange: any,
}) {

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const newAttr = e.dataTransfer.getData("attr") as ContinuousMetric;

        const newAttrSelectors: AttrSelect[] = props.allAttrs.map(attrSelect => {
            if (attrSelect.attr === props.attr.attr) {// set the current attribute to be unused
                return {
                    ...attrSelect,
                    attr: props.attr.attr,
                    use: "Unused",
                    active: false,
                }
            } else if (attrSelect.attr === newAttr) {// set the incoming attribute to be the new thingy
                return {
                    ...attrSelect,
                    attr: newAttr,
                    use: props.attr.use,
                    active: true
                }
            } else {
                return attrSelect
            }
        })

        props.updateAttrSelects(newAttrSelectors);
    }

    if (props.attr === undefined) {
        return(<div>N</div>)
    } else {
        return(<div
            className="axis-container"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
        >
            <button id="axis">{props.attr.use}</button>
            <DragAttr attrSelect={props.attr} draggable={false} updateRange={props.updateRange}/>
        </div>)
    }
}