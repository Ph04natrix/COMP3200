import { extend, ThreeElement, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { TrackballControls } from "three/addons";
import * as THREE from "three";
import { StaticCamera } from "../../../../../types/audioResources";

declare module "@react-three/fiber" {
    interface ThreeElements {
        trackballControls: ThreeElement<typeof TrackballControls>
    }
}

extend({ TrackballControls })

export default function Controls(props: {
    gridWidth: number,
    cameraState: StaticCamera
}) {
    const controls = useRef<TrackballControls>(null!); // null! is a non-null assertion
    const { camera, gl } = useThree();

    useFrame(() => {
        controls.current.update();
    });

    const targetVector = useMemo(() => {
        switch (props.cameraState) {
            case StaticCamera.All: return new THREE.Vector3(0,0,0)
            case StaticCamera.NoX: return new THREE.Vector3(
                0, props.gridWidth/2, props.gridWidth/2
                //0,0,0
            )
            case StaticCamera.NoY: return new THREE.Vector3(
                props.gridWidth/2, 0, props.gridWidth/2
                //0,0,0
            )
            case StaticCamera.NoZ: return new THREE.Vector3(
                props.gridWidth/2, props.gridWidth/2, 0
                //0,0,0
            )
        }
    }, [props.cameraState])

    return(
        <trackballControls
            ref={controls}
            args={[camera, gl.domElement]}
            dynamicDampingFactor={0.4}
            panSpeed={0.3}
            rotateSpeed={2.5}
            keys={[
                "KeyAlt",
                "KeyCtrl",
                "KeyCmd"
            ]}
            mouseButtons={{
                LEFT: THREE.MOUSE.PAN,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.ROTATE
            }}
            minDistance={2}
            maxDistance={props.gridWidth*2.451}
            noRotate={
                false//props.cameraState !== StaticCamera.All
            }
            target={targetVector}
        />
    )
}