import { AttrSelect } from "../../../types/audioResources";
import DragAttr from "./DragAttr";

export default function OtherAttrContainer(props: {
    attrSelectors: AttrSelect[],
    updateRange: any
}) {
    

    return(<div
        className="unused-attr-container"
    >
        {
            props.attrSelectors
                .filter(attr => attr.use === "Unused")
                .map(attr => <DragAttr
                    attrSelect={attr}
                    draggable={true}
                    updateRange={props.updateRange}
                />)
        }
    </div>)
}