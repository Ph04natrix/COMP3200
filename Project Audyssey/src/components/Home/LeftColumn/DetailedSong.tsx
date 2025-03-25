import "./DetailedSong.css";

import { useEffect, useMemo, useState } from "react";
import { FullSong, Mode, Song, SongExtras } from "../../../types/audioResources";
import { invoke } from "@tauri-apps/api/core";
import { RadarChart } from "./RadarChart";

export default function DetailedSong(props: {
    selectedSong: Song | undefined
}) {
    const [detailedSong, setDetailedSong] = useState<FullSong>();

    useEffect(() => {
        let active = true;
        getSong();

        return () => { active: false }

        async function getSong() {
            if (props.selectedSong) {
                const res = await invoke<SongExtras>("get_song_extras", {
                    name: props.selectedSong.name
                }).then(songExtras => songExtras);

                if (!active) { return }
                setDetailedSong({
                    type: "Song",
                    name: props.selectedSong.name,
                    contMetrics: props.selectedSong.contMetrics,
                    coords: props.selectedSong.coords,
                    // song extra stuff
                    album: res.album,
                    artists: res.artists,
                    discrete_metrics: res.discrete_metrics,
                });
            } else {
                setDetailedSong(undefined);
            }
        }
    }, [props.selectedSong])

    const radialData = useMemo(() => {
        return detailedSong ? [
            { name: "Ac", value: detailedSong.contMetrics.acousticness },
            { name: "Da", value: detailedSong.contMetrics.danceability },
            { name: "En", value: detailedSong.contMetrics.energy },
            { name: "Val", value: detailedSong.contMetrics.valence },
            { name: "Sp", value: detailedSong.contMetrics.speechiness },
            { name: "Li", value: detailedSong.contMetrics.liveness },
            { name: "In", value: detailedSong.contMetrics.instrumentalness },
            { name: "Pop", value: detailedSong.contMetrics.popularity/100 },
        ] : []
    }, [detailedSong]);

    if (detailedSong) {return(<div id="detailed-song">
    <div id="song-img-container">
        <img
            id="album-image"
            src={detailedSong.album.images[0].url}
            alt={detailedSong.album.name}
        />
        <div id="name-artist-container">
            <div id="song-name">{detailedSong.name}</div>
            <div id="artist-container">
                {detailedSong.discrete_metrics.explicit && <code className="explicit">E</code>}
                <div id="song-artist">{detailedSong.artists[0].name}</div>
            </div>
        </div>
    </div>
    <RadarChart radialData={radialData}/>
    
    <div>Key: {detailedSong.discrete_metrics.key}</div>
    <div>Mode: {detailedSong.discrete_metrics.mode == Mode.Major ? "Major" : "Minor"}</div>
    <div>Time Signature: {detailedSong.discrete_metrics.time_signature}/4</div>
    <div>Genre_0: {/*detailedSong.discrete_metrics.genres[0].root*/}</div>
    </div>
    )} else { return(<></>) }
}