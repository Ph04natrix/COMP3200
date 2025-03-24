import "../StaticGraphView/StaticGraph.css";

import { Dispatch, SetStateAction, useMemo } from "react";
import { Canvas, extend } from "@react-three/fiber";
import * as THREE from "three";
import * as drei from "@react-three/drei";

import Controls from "./Controls";
import InstancedPoints from "./InstancedPoints";
import { AttrSelect, ContinuousMetric, LowercaseAttr, Song, SpatialDimension, StaticCamera, StaticLayers } from "../../../../../types/audioResources";

extend(THREE as any)

export default function StaticGraph(props: {
    songs: Song[],
    currentAttrs: AttrSelect[],
    selectedSong: Song,
    setSelectedSong: Dispatch<SetStateAction<Song>>,
    cameraState: StaticCamera
}) {
    const gridWidth = 100;

    const cachedAxisMetrics: {
        x: ContinuousMetric,
        y: ContinuousMetric,
        z: ContinuousMetric
    } = useMemo(() => {
        let x; let y; let z;
        props.currentAttrs.map((attrSel) => {
            switch (attrSel.use) {
                case SpatialDimension.X: return x = attrSel.attr
                case SpatialDimension.Y: return y = attrSel.attr
                case SpatialDimension.Z: return z = attrSel.attr
                case "Unused": return attrSel.attr
            }
        })
        return {
            x: x ? x : ContinuousMetric.Acousticness,
            y: y ? y : ContinuousMetric.Danceability,
            z: z ? z : ContinuousMetric.Energy
        }
    }, [props.currentAttrs]);

    const songCoords: Pick<Song, "coords">[] = useMemo(
        () => {
            const xAttr = (cachedAxisMetrics.x as string).toLowerCase() as LowercaseAttr;
            const yAttr = (cachedAxisMetrics.y as string).toLowerCase() as LowercaseAttr;
            const zAttr = (cachedAxisMetrics.z as string).toLowerCase() as LowercaseAttr;
            // cursed method of getting the right attribute property value on song by converting
            // from ContinuousMetric to a string which is then used to index on Song

            return props.songs.map((song) => {
                //console.log("[Co-ords] x: ", song[xAttr],", y: ", song[yAttr],", z: ", song[zAttr]);
                return { coords: { x: song[xAttr],
                    y: song[yAttr],
                    z: song[zAttr]
                } }
            })
        },
        [props.songs, cachedAxisMetrics]
    );

    const orthoCameraEndVector: [number, number, number] = useMemo(()=>{
        switch (props.cameraState) {
            case StaticCamera.All: return [gridWidth, gridWidth, gridWidth]
            case StaticCamera.NoX: return [gridWidth, gridWidth/2, gridWidth/2]
            case StaticCamera.NoY: return [gridWidth/2, gridWidth, gridWidth/2]
            case StaticCamera.NoZ: return [gridWidth/2, gridWidth/2, gridWidth]
        }
    }, [props.cameraState]);
    
    const gridHelperArgs: [
        size: number, division: number, THREE.ColorRepresentation, THREE.ColorRepresentation
    ] = [gridWidth, 10, "grey", "grey"];

    const xLayers = new THREE.Layers(); xLayers.enable(StaticLayers.X);
    const yLayers = new THREE.Layers(); yLayers.enable(StaticLayers.Y);
    const zLayers = new THREE.Layers(); zLayers.enable(StaticLayers.Z);
    const allLayers = new THREE.Layers(); allLayers.enableAll();

    const arrConeRadius = 1.6;
    const arrConeHeight = 3.0;
    const axisColor = 0x808080;
    
    return(<>
    <div className="vis-container">
        <Canvas>
            <drei.PerspectiveCamera
                position={[gridWidth, gridWidth*0.8, gridWidth]}
                makeDefault={props.cameraState === StaticCamera.All}
                layers={allLayers}
                fov={90}
            />
            <drei.OrthographicCamera
                args={[-gridWidth, gridWidth, gridWidth, -gridWidth, 0, gridWidth*10]}
                position={orthoCameraEndVector}
                makeDefault={props.cameraState !== StaticCamera.All}
                rotation={[0,0,0]}
            >
                {/*<drei.Helper type={THREE.CameraHelper}/>*/}
            </drei.OrthographicCamera>
            <Controls gridWidth={gridWidth} cameraState={props.cameraState}/>
            <ambientLight color="#ffffff" intensity={0.1} />
            <hemisphereLight color="#ffffff" groundColor={0x080820} intensity={1.0} args={[0xffffbb]}/>
            <InstancedPoints
                data={songCoords}
                songs={props.songs}
                gridWidth={gridWidth}
                selectedSong={props.selectedSong}
                setSelectedSong={props.setSelectedSong}
                axisMetrics={cachedAxisMetrics}
            />
            <gridHelper // XY-Grid
                args={gridHelperArgs}
                rotation={[Math.PI / 2, 0, 0]}
                position={[gridWidth / 2, gridWidth / 2, 0]}
            />
            <gridHelper // XZ-Grid
                args={gridHelperArgs}
                position={[gridWidth / 2, 0, gridWidth / 2]}
            />
            <gridHelper // YZ-Grid
                args={gridHelperArgs}
                rotation={[0, 0, Math.PI / 2]}
                position={[0, gridWidth / 2, gridWidth / 2]}
            />
            <group name="x-axis-line" layers={xLayers}>
                <drei.Text
                    color={axisColor} 
                    position={(props.cameraState === StaticCamera.NoY)
                        ? [gridWidth/2, 0, -5]
                        : [gridWidth/2, -4, 0]} 
                    scale={8}
                    rotation={(props.cameraState === StaticCamera.NoY)
                        ? [Math.PI/2, Math.PI, Math.PI]
                        : [0,0,0]
                    }
                >
                    {cachedAxisMetrics.x}
                </drei.Text>
                <mesh position={[gridWidth/2,0,0]} rotation={[0, 0, Math.PI/-2]}>
                    <cylinderGeometry args={[arrConeRadius/3, arrConeRadius/3, gridWidth]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <mesh position={[gridWidth+(arrConeHeight/2),0,0]} rotation={[0, 0, Math.PI/-2]}>
                    <coneGeometry args={[arrConeRadius, arrConeHeight]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
            </group>
            <group name="y-axis-line" layers={yLayers}>
                <drei.Text
                    color={axisColor}
                    position={(props.cameraState === StaticCamera.NoX)
                        ? [0, gridWidth/2,-5]
                        : [-4, gridWidth/2,0]
                    }
                    scale={8}
                    rotation={(props.cameraState === StaticCamera.NoX)
                        ? [Math.PI/-2,Math.PI/2,0]
                        : [0,0,Math.PI/2]
                    }
                >
                    {cachedAxisMetrics.y}
                </drei.Text>
                <mesh position={[0, gridWidth/2, 0]} rotation={[0, 0, Math.PI]}>
                    <cylinderGeometry args={[arrConeRadius/3, arrConeRadius/3, gridWidth]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <mesh position={[0, gridWidth+(arrConeHeight/2),0]}>
                    <coneGeometry args={[arrConeRadius, arrConeHeight]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
            </group>
            <group name="z-axis-line" layers={zLayers}>
                <drei.Text
                    color={axisColor}
                    position={(props.cameraState === StaticCamera.NoY)
                        ? [-6, 0, gridWidth/2]
                        : [0, -4, gridWidth/2]}
                    scale={8}
                    rotation={(props.cameraState === StaticCamera.NoY)
                        ? [Math.PI/-2, 0, Math.PI/2]
                        : [0, Math.PI/2, 0]
                    }
                >
                    {cachedAxisMetrics.z}
                </drei.Text>
                <mesh position={[0, 0, gridWidth/2]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[arrConeRadius/3, arrConeRadius/3, gridWidth]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <mesh position={[0, 0, gridWidth+(arrConeHeight/2)]} rotation={[Math.PI/2, 0, 0]}>
                    <coneGeometry args={[arrConeRadius, arrConeHeight]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
            </group>
            {
                // todo add number indicators on the graph
            }
        </Canvas>
    </div>
    </>)
}