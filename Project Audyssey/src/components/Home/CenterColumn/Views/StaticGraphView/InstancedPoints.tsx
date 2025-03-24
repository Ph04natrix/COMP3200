import { Dispatch, SetStateAction, useEffect, useRef } from "react"
import { Color, InstancedBufferAttribute, InstancedMesh, Object3D } from "three";
import { AttrSelect, ContinuousMetric, LowercaseAttr, Song } from "../../../../../types/audioResources";
import { ThreeEvent } from "@react-three/fiber";

// re-use for instance copmutations
const scratchObject3D = new Object3D();

const SELECTED_COLOR = "#d14f08";
const DEFAULT_COLOR = "#00ffea";
const FILTERED_COLOR = "#736b67";

const scratchColor = new Color();

export default function InstancedPoints(props: {
    data: Pick<Song, "coords">[],
    songs: Song[],
    gridWidth: number,
    selectedSong: Song,
    setSelectedSong: Dispatch<SetStateAction<Song>>,
    axisMetrics: {x: AttrSelect, y: AttrSelect, z: AttrSelect}
}) {
    const meshRef = useRef<InstancedMesh>(null!);
    const numPoints = props.data.length;

    const colorAttrib = useRef<InstancedBufferAttribute>(null!);
    const colorArray = new Float32Array(numPoints * 3);
    
    useEffect(() => {
        const xRange = props.axisMetrics.x.range;
        const yRange = props.axisMetrics.y.range;
        const zRange = props.axisMetrics.z.range;

        const xMetric = props.axisMetrics.x.attr.toLowerCase() as LowercaseAttr;
        const yMetric = props.axisMetrics.y.attr.toLowerCase() as LowercaseAttr;
        const zMetric = props.axisMetrics.z.attr.toLowerCase() as LowercaseAttr;

        for (let i = 0; i < numPoints; i++) {
            if (props.songs[i] === props.selectedSong) {
                scratchColor.set(SELECTED_COLOR);
            } else if ((
                props.songs[i][xMetric] >= xRange.currMin && props.songs[i][xMetric] <= xRange.currMax
            ) && (
                props.songs[i][yMetric] >= yRange.currMin && props.songs[i][yMetric] <= yRange.currMax
            ) && (
                props.songs[i][zMetric] >= zRange.currMin && props.songs[i][zMetric] <= zRange.currMax
            )) {
                scratchColor.set(DEFAULT_COLOR);
            } else {
                scratchColor.set(FILTERED_COLOR);
            }

            scratchColor.toArray(colorArray, i*3);
        }

        colorAttrib.current.needsUpdate = true;
    }, [numPoints, props.axisMetrics, props.songs, props.selectedSong, colorAttrib, colorArray]);

    useEffect(() => {// update instance matrices only when needed
        const mesh = meshRef.current;

        for (let i = 0; i < numPoints; ++i) {// set the transform matrix for each instance
            let {x, y, z} = props.data[i].coords;

            x = rescale(x, props.axisMetrics.x) * props.gridWidth;
            y = rescale(y, props.axisMetrics.y) * props.gridWidth;
            z = rescale(z, props.axisMetrics.z) * props.gridWidth;

            scratchObject3D.position.set(x, y, z);
            scratchObject3D.updateMatrix();
            mesh.setMatrixAt(i, scratchObject3D.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
    }, [numPoints, props.data]);

    const mouseDownRef = useRef([0, 0])
    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        mouseDownRef.current[0] = e.clientX;
        mouseDownRef.current[1] = e.clientY;
    }

    const handleClickSongSphere = (event: ThreeEvent<MouseEvent>) => {
        const downDistance = Math.sqrt(
            Math.pow(mouseDownRef.current[0] - event.clientX, 2) + 
            Math.pow(mouseDownRef.current[1] - event.clientY, 2)
        );

        // skip click if we dragged more than 5px distance
        if (downDistance > 5) {
            event.stopPropagation();
            return;
        }
        
        const clickedSong = props.songs[event.instanceId ? event.instanceId : 0];
        console.log(clickedSong.name, " was selected");

        if (clickedSong === props.selectedSong) {
            // do nothing
        } else {
            props.setSelectedSong(clickedSong)
        }
    }

    const handleSongContextMenu = (event: ThreeEvent<MouseEvent>) => {
        const screenXPos = event.screenX;
        const screenYPos = event.screenY;

        // todo create a <SongContextMenu /> component
        // set the component <SongContextMenu> to be active
        // and set its position to be (screenXPos, screenYPos)
    }

    function rescale(
        coord: number,
        attrSel: AttrSelect
    ): number {
        switch (attrSel.attr) {
            case ContinuousMetric.Duration: return(
                coord / attrSel.max
            )
            case ContinuousMetric.Tempo: return (
                coord/240
            )// between [0..240] -> [0..1]
            case ContinuousMetric.Loudness: return (
                (coord/60) + 1
            )// between [-60..0] -> [0..1]
            case ContinuousMetric.Acousticness:
            case ContinuousMetric.Danceability:
            case ContinuousMetric.Energy:
            case ContinuousMetric.Valence:
            case ContinuousMetric.Speechiness:
            case ContinuousMetric.Liveness:
            case ContinuousMetric.Instrumental:
            default: return coord
        }
    }

    return(
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, numPoints]}
            frustumCulled={false}
            onClick={handleClickSongSphere}
            onPointerDown={handlePointerDown}
            onContextMenu={handleSongContextMenu}
        >
            <sphereGeometry attach="geometry" args={[1]}>
                <instancedBufferAttribute
                    ref={colorAttrib}
                    args={[colorArray, 3]}
                    attach={"attributes-color"}
                />
            </sphereGeometry>
            <meshStandardMaterial vertexColors/>
        </instancedMesh>
    )
}

