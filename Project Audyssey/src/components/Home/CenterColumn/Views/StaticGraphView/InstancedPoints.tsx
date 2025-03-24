import { Dispatch, SetStateAction, useEffect, useRef } from "react"
import { InstancedMesh, Object3D } from "three";
import { ContinuousMetric, Song } from "../../../../../types/audioResources";
import { ThreeEvent } from "@react-three/fiber";

// re-use for instance copmutations
const scratchObject3D = new Object3D();

export default function InstancedPoints(props: {
    data: Pick<Song, "coords">[],
    songs: Song[],
    gridWidth: number,
    selectedSong: Song,
    setSelectedSong: Dispatch<SetStateAction<Song>>
    axisMetrics: {x: ContinuousMetric, y: ContinuousMetric, z: ContinuousMetric}
}) {
    const meshRef = useRef<InstancedMesh>(null!);
    const numPoints = props.data.length;

    // update instance matrices only when needed
    useEffect(() => {
        const mesh = meshRef.current;

        // set the transform matrix for each instance
        for (let i = 0; i < numPoints; ++i) {
            let {x, y, z} = props.data[i].coords;
            x = rescale(x, props.axisMetrics.x);

            scratchObject3D.position.set(x*props.gridWidth, y*props.gridWidth, z*props.gridWidth);
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

    return(
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, numPoints]}
            frustumCulled={false}
            onClick={handleClickSongSphere}
            onPointerDown={handlePointerDown}
            onContextMenu={handleSongContextMenu}
        >
            <sphereGeometry attach="geometry" args={[1]} />
            <meshStandardMaterial attach="material" color="#00ffea" />
        </instancedMesh>
    )
}

function rescale(
    coord: number,
    metric: ContinuousMetric
): number {
    switch (metric) {
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