import "./DetailedSong.css";

import { useEffect, useState } from "react";
import { FullSong, Song, SongExtras } from "../../../types/audioResources";
import { invoke } from "@tauri-apps/api/core";

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

    if (detailedSong) {return(<>
    <div id="song-img-container">
        <img
            id="album-image"
            src={detailedSong.album.images[0].url}
            alt={detailedSong.album.name}
        />
        <div id="name-artist-container">
            <div id="song-name">{detailedSong.name}</div>
            <div id="song-artist">{detailedSong.artists[0].name}</div>
        </div>
    </div>
        <p>Key: {detailedSong.discrete_metrics.key}</p>
            
    </>)} else {return(<>
        <p></p>
    </>)}
}