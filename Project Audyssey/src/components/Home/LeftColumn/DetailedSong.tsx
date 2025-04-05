import "./DetailedSong.css";

import { useEffect, useMemo, useState } from "react";
import { FullSong, Key, Mode, Song, SongExtras } from "../../../types/audioResources";
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
            { name: "Ac", value: detailedSong.contMetrics.acousticness, color: "saddlebrown" },
            { name: "Da", value: detailedSong.contMetrics.danceability, color: "purple" },
            { name: "En", value: detailedSong.contMetrics.energy, color: "forestgreen" },
            { name: "Val", value: detailedSong.contMetrics.valence, color: "firebrick" },
            { name: "Sp", value: detailedSong.contMetrics.speechiness, color: "brown" },
            { name: "Li", value: detailedSong.contMetrics.liveness, color: 0xabcdef },
            { name: "In", value: detailedSong.contMetrics.instrumentalness, color: 0xabcdef },
            { name: "Pop", value: detailedSong.contMetrics.popularity/100, color: "darkcyan" },
        ] : []
    }, [detailedSong]);

    function keyToBgColor(key: Key): string {
        switch (key) {
            case Key.None: return "transparent"
            case Key.C: return "#f94144"
            case Key.CSharp: return "#f3722c"
            case Key.D: return "#f8961e"
            case Key.DSharp: return "#f9844a"
            case Key.E: return "#f9c74f"
            case Key.F: return "#8ac926"
            case Key.FSharp: return "#90be6d"
            case Key.G: return "#43aa8b"
            case Key.GSharp: return "#4d908e"
            case Key.A: return "#577590"
            case Key.ASharp: return "#277da1"
            case Key.B: return "#1d4e89"
        }
    }

    if (detailedSong) {return(<div id="detailed-song">
    <div id="song-img-container">
        <img
            id="album-image"
            src={
                detailedSong.album.images[0].url
            }
            alt={
                detailedSong.album.name
            }
        />
        <div id="name-artist-container">
            <div id="name-container" className="x-scroll-container">
                <p id="song-name">{
                    detailedSong.discrete_metrics.explicit && <code className="explicit">E</code>
                } {
                    detailedSong.name
                }</p>
            </div>
            <div id="artist-container" className="x-scroll-container">
                <p id="song-artist">{detailedSong.artists.map(art => art).join(", ")}</p>
            </div>
            <div id="key-mode-container"><code className="song-key" style={{
                backgroundColor: keyToBgColor(detailedSong.discrete_metrics.key)
            }}>{
                detailedSong.discrete_metrics.key
            }</code><code style={{
                backgroundColor: detailedSong.discrete_metrics.mode == Mode.Major
                    ? "black"
                    : "var(--mode-light)",
                color: detailedSong.discrete_metrics.mode == Mode.Major
                    ? "var(--mode-light)"
                    : "var(--mode-dark)",
            }}>{
                detailedSong.discrete_metrics.mode == Mode.Major ? "Major" : "Minor"
            }</code> in {
                detailedSong.discrete_metrics.time_signature
            }/4</div>
        </div>
    </div>
    <RadarChart radialData={radialData}/>
    <div id="other-song-info">
        <div>Genres: {detailedSong.discrete_metrics.genres.join(", ")}</div>
    </div>
    </div>
    )} else { return(<></>) }
}