import { GREYED_COLOR, SELECTOR_COLOR, SELECTOR_BACKGROUND_COLOR } from "../../../../types/colors";
import { useEffect, useMemo, useRef } from "react";
import { InstancedBufferAttribute, InstancedMesh, Object3D } from "three";
import * as drei from "@react-three/drei";
import { AttrSelect } from "../../../../types/audioResources";
import { rescale } from "../../CenterColumn/Views/StaticGraphView/InstancedPoints";
import { ThreeEvent } from "@react-three/fiber";


const scratchObject3D = new Object3D();

export default function RangeInstPoints(props: {
    width: number,
    height: number,
    idx: number,
    data: AttrSelect,
}) {
    const instRef = useRef<InstancedMesh>(null!);

    useEffect(() => {// update instance matrices only when needed
        const mesh = instRef.current;

        props.data.values.forEach((val, idx) => {
            scratchObject3D.position.set(
                rescale(val, props.data) * props.width,
                (props.idx+0.5)*props.height,
                10
            );
            scratchObject3D.updateMatrix();
            mesh.setMatrixAt(idx, scratchObject3D.matrix);
        });
    
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
    }, [props.data, props.width, props.height, props.idx]);

    const colorAttrib = useRef<InstancedBufferAttribute>(null!);
    const colorArray = new Float32Array(props.data.values.length * 3);

    const scaledMin = //useMemo(() => { return
        rescale(props.data.range.currMin, props.data) * props.width
    //}, [props.width, props.data.range]);
    const scaledMax = //useMemo(() => { return
        rescale(props.data.range.currMax, props.data)  * props.width
    ///}, [props.width, props.data.range]);

    const startDrag = (e: ThreeEvent<PointerEvent>) => {
        // todo
        // * get the x position of where the user started dragging
    }
    
    const endDrag = (e: ThreeEvent<PointerEvent>) => {
        // todo
    }
    
    return <group key={props.data.attr}>
        <drei.Text
            position={[
                -60,
                (props.idx+0.5)*props.height,
                0,
            ]}
            scale={props.height/2}
        >
            {props.data.attr}
        </drei.Text>
        <drei.Line name="grey-track"
            points={[
                [0, (props.idx+0.5)*props.height, 1],
                [props.width, (props.idx+0.5)*props.height, 1]
            ]}
            color={GREYED_COLOR}
            lineWidth={1}
        />
        <drei.Line name="min-selector"
            points={[
                [scaledMin, (props.idx+0.25)*props.height, 2],
                [scaledMin, (props.idx+0.75)*props.height, 2]
            ]}
            color={SELECTOR_COLOR}
            lineWidth={2}
            onPointerDown={startDrag}
            onPointerUp={endDrag}
        />
        <mesh name="selector-background" position={[
            scaledMin + (scaledMax - scaledMin)/2,
            (props.idx+0.5)*props.height,
            0
        ]}>
            <planeGeometry args={[
                scaledMax - scaledMin,
                props.height*0.5
            ]}/>
            <meshBasicMaterial color={SELECTOR_BACKGROUND_COLOR} opacity={0.10}/>
        </mesh>
        <drei.Line name="max-selector"
            points={[
                [scaledMax, (props.idx+0.25)*props.height, 2],
                [scaledMax, (props.idx+0.75)*props.height, 2]
            ]}
            color={SELECTOR_COLOR}
            lineWidth={2}
            onPointerDown={startDrag}
            onPointerUp={endDrag}
        />
        <instancedMesh args={[undefined, undefined, props.data.values.length]} ref={instRef}>
            <circleGeometry args={[
                10,
                10,0,Math.PI*2
            ]}/>
            <meshStandardMaterial color="teal"/>
        </instancedMesh>
    </group>
}