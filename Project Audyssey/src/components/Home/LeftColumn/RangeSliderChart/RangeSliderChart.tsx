import { Canvas } from "@react-three/fiber";
import * as drei from "@react-three/drei";

import { AttrSelect, LowercaseAttr, Song } from "../../../../types/audioResources";
import { SELECTED_COLOR } from "../../../../types/colors";
import RangeInstPoints from "./RangeInstPoints";
import { rescale } from "../../CenterColumn/Views/StaticGraphView/InstancedPoints";


export default function RangeSliderChart(props: {
    width: number,
    height: number,
    data: AttrSelect[],
    selectedSong: Song | undefined
}) {
    // go through each attr select and create a range slider

    return(<Canvas>
        <drei.OrthographicCamera position={[0, 0, 100]} makeDefault />
        {
            props.data.map((data, i) => <RangeInstPoints {...props} data={data} idx={i}/>)
        }
        {props.selectedSong && <drei.Line segments
            points={
                props.data.map((data, i) => [
                    props.selectedSong
                        ? rescale(
                            props.selectedSong.contMetrics[
                                data.attr.toLowerCase() as LowercaseAttr
                            ], data
                        ) * props.width
                        : 0,
                    (i+0.5)*props.height,
                    5
                ])
            }
            lineWidth={1}
            color={SELECTED_COLOR}
        />}
    </Canvas>)
}