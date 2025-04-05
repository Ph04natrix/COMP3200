import "../StaticGraphView/StaticGraph.css";

import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend } from "@react-three/fiber";
import * as THREE from "three";
import * as drei from "@react-three/drei";

import Controls from "./Controls";
import InstancedPoints from "./InstancedPoints";
import { AttrSelect, ContinuousMetric, Song, SpatialDimension, StaticCamera, StaticLayers } from "../../../../../types/audioResources";
import { listen, once } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { SongContMetricProgress } from "../../../../../types/tauriEvent";

extend(THREE as any)

const gridWidth = 200;

export default function StaticGraph(props: {
    currentAttrs: AttrSelect[],
    selectedSong: Song | undefined,
    setSelectedSong: Dispatch<SetStateAction<Song | undefined>>,
    cameraState: StaticCamera
}) {
    const fetchedSongs = useRef<boolean>(false);
    const [songs, setSongs] = useState<Song[]>(null!);

    useEffect(() => {
        if (!fetchedSongs.current) {// main func
            loadSongs().then(songs => {
                fetchedSongs.current = true;
                setSongs(songs);
                props.setSelectedSong(songs[0]);
            });
        };

        return () => {// cleanup function
            fetchedSongs.current = false;
        };
    }, [fetchedSongs])

    const cachedAxisMetrics: {
        x: AttrSelect,
        y: AttrSelect,
        z: AttrSelect
    } = useMemo(() => {
        let x: AttrSelect = {
            attr: ContinuousMetric.Acousticness,
            use: SpatialDimension.X,
            values: [], min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 1
        };
        let y: AttrSelect = {
            attr: ContinuousMetric.Danceability,
            use: SpatialDimension.Y,
            values: [], min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 1
        };
        let z: AttrSelect = {
            attr: ContinuousMetric.Energy,
            use: SpatialDimension.Z,
            values: [], min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 1
        };

        props.currentAttrs.map((attrSel) => {
            switch (attrSel.use) {
                case SpatialDimension.X: return x = attrSel
                case SpatialDimension.Y: return y = attrSel
                case SpatialDimension.Z: return z = attrSel
                case "Unused": return attrSel
            }
        });

        return { x: x, y: y, z: z }
    }, [props.currentAttrs]);

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

    const textScale = 18;
    
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
                songs={songs}
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
                    scale={textScale}
                    rotation={(props.cameraState === StaticCamera.NoY)
                        ? [Math.PI/2, Math.PI, Math.PI]
                        : [0,0,0]
                    }
                >{cachedAxisMetrics.x.attr}</drei.Text>
                <mesh position={[gridWidth/2,0,0]} rotation={[0, 0, Math.PI/-2]}>
                    <cylinderGeometry args={[arrConeRadius/3, arrConeRadius/3, gridWidth]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <mesh position={[gridWidth+(arrConeHeight/2),0,0]} rotation={[0, 0, Math.PI/-2]}>
                    <coneGeometry args={[arrConeRadius, arrConeHeight]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <drei.Text
                    color={axisColor}
                    position={[gridWidth+(arrConeHeight/2)+5, -5, 0]}
                    rotation={(props.cameraState === StaticCamera.NoY)
                        ? [Math.PI/2, Math.PI, Math.PI]
                        : [0,0,0]}
                    scale={textScale}
                >{cachedAxisMetrics.x.range.currMax}</drei.Text>
            </group>
            <group name="y-axis-line" layers={yLayers}>
                <drei.Text
                    color={axisColor}
                    position={(props.cameraState === StaticCamera.NoX)
                        ? [0, gridWidth/2,-5]
                        : [-4, gridWidth/2,0]
                    }
                    scale={textScale}
                    rotation={(props.cameraState === StaticCamera.NoX)
                        ? [Math.PI/-2,Math.PI/2,0]
                        : [0,0,Math.PI/2]
                    }
                >{cachedAxisMetrics.y.attr}</drei.Text>
                <mesh position={[0, gridWidth/2, 0]} rotation={[0, 0, Math.PI]}>
                    <cylinderGeometry args={[arrConeRadius/3, arrConeRadius/3, gridWidth]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <mesh position={[0, gridWidth+(arrConeHeight/2),0]}>
                    <coneGeometry args={[arrConeRadius, arrConeHeight]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <drei.Text
                    color={axisColor}
                    position={(props.cameraState === StaticCamera.NoX)
                        ? [0, gridWidth+(arrConeHeight/2) + 5, -5]
                        : [0, gridWidth+(arrConeHeight/2) +5, 0]
                    }
                    scale={textScale}
                    rotation={(props.cameraState === StaticCamera.NoX)
                        ? [Math.PI/-2,Math.PI/2,0]
                        : [0,0,0]
                    }
                >{cachedAxisMetrics.y.range.currMax}</drei.Text>
            </group>
            <group name="z-axis-line" layers={zLayers}>
                <drei.Text
                    color={axisColor}
                    position={(props.cameraState === StaticCamera.NoY)
                        ? [-6, 0, gridWidth/2]
                        : [0, -4, gridWidth/2]}
                    scale={textScale}
                    rotation={(props.cameraState === StaticCamera.NoY)
                        ? [Math.PI/-2, 0, Math.PI/2]
                        : [0, Math.PI/2, 0]
                    }
                >{cachedAxisMetrics.z.attr}</drei.Text>
                <mesh position={[0, 0, gridWidth/2]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[arrConeRadius/3, arrConeRadius/3, gridWidth]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <mesh position={[0, 0, gridWidth+(arrConeHeight/2)]} rotation={[Math.PI/2, 0, 0]}>
                    <coneGeometry args={[arrConeRadius, arrConeHeight]}/>
                    <meshBasicMaterial color={axisColor}/>
                </mesh>
                <drei.Text
                    color={axisColor}
                    position={(props.cameraState === StaticCamera.NoY)
                        ? [0, 0, gridWidth+(arrConeHeight/2)+5]
                        : [0, -5, gridWidth+(arrConeHeight/2)+5]}
                    scale={textScale}
                    rotation={(props.cameraState === StaticCamera.NoY)
                        ? [Math.PI/-2, 0, 0]
                        : [0, Math.PI/2, 0]
                    }
                >{cachedAxisMetrics.z.range.currMax}</drei.Text>
            </group>
        </Canvas>
    </div>
    </>)
}

async function loadSongs() {
    const newSongs: Song[] = [];

    const unlisten = await listen<SongContMetricProgress>("song-cont-metric-progress", (e) => {
        const payload = e.payload;
        console.log(payload);
        newSongs.push({
            type: "Song",
            name: payload.name,
            contMetrics: {
                duration: payload.duration,
                acousticness: payload.acousticness,
                danceability: payload.danceability,
                energy: payload.energy,
                valence: payload.valence,
                tempo: payload.tempo,
                speechiness: payload.speechiness,
                liveness: payload.liveness,
                loudness: payload.loudness,
                instrumentalness: payload.instrumentalness,
                popularity: payload.popularity,
                timestamp: new Date(payload.timestamp).getTime()
            },
            coords: {
                x: 0,
                y: 0,
                z: 0
            }
        });
    });

    invoke("get_songs_for_static_graph").then(msg => console.log(msg));

    once("song-cont-metric-finished", (_e) => {
        console.log("Finished fetching songs from backend with continuous metrics");
        unlisten();
    });

    return newSongs
}