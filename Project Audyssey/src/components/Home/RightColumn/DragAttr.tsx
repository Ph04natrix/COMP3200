import React from "react";
import { AttrSelect } from "../../../types/audioResources";
import RangeSlider from "./RangeSlider";

export default function DragAttr(props: {
    attrSelect: AttrSelect
    draggable: boolean,
    updateRange: any
}) {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        //e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.setData("attr", e.currentTarget.id);
        console.log("Started dragging")
    };
      
    return(<div
        id={props.attrSelect.attr} key={props.attrSelect.attr}
        className="draggable-metric"
        draggable={props.draggable}
        onDragStart={handleDragStart}
    >
        <span id="attr-name">{props.attrSelect.attr}</span>
        <RangeSlider
            min={props.attrSelect.min}
            max={props.attrSelect.max}
            range={props.attrSelect.range}
            attr={props.attrSelect.attr}
            updateRange={props.updateRange}
            step={props.attrSelect.step}
        />
    </div>)
}