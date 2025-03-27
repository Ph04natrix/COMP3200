import "./Table.css";

import { useEffect, useMemo, useRef, useState } from "react";
// import TableHeadItem from "./TableHeadItem";
// import TableRow from "./TableRow";

import { AgGridReact } from "ag-grid-react";
import { colorSchemeDarkWarm, themeQuartz, type ColDef } from "ag-grid-community";
import { Album, Key, Mode } from "../../../../../types/audioResources";
import { listen, once } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { IRowProgress } from "../../../../../types/tauriEvent";

interface IRow {
    name: string;
    artists: string[];
    album: Album;
    // metrics
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    key: Key;
    liveness: number;
    loudness: number;
    mode: Mode;
    speechiness: number;
    tempo: number;
    time_signature: number;
    valence: number;
    // spotify specific stuff
    popularity: number;
    explicit: boolean;
    duration: number;
    timestamp: Date;
}

export default function Table(
    // {_theadData, _tbodyData}: {theadData: [string], tbodyData: [[string]]}
) {
    const fetchedSongs = useRef<boolean>(false);
    const [rowData, setRowData] = useState<IRow[]>();
    
    useEffect(() => {
        if (!fetchedSongs.current) {// main func
            loadRows().then(songs => {
                fetchedSongs.current = true;
                setRowData(songs);
            });
        };
    
        return () => {// cleanup function
            fetchedSongs.current = false;
        };
    }, [fetchedSongs]);

    async function loadRows() {
        const newSongs: IRow[] = [];

        const unlisten = await listen<IRowProgress>("table-row-progress", (e) => {
            const payload = e.payload;    

            console.log(payload);
            newSongs.push({
                ...payload,
                artists: payload.artists.map(art => art.name),
                album: payload.album,
                timestamp: new Date(payload.timestamp),
            });
        });

        invoke("get_songs_for_table").then(msg => console.log(msg));

        once("table-row-finished", (_e) => {
            console.log("Finished fetching songs from backend for table");
            unlisten();
        });

        return newSongs
    }

    const acousticHide = false;
    const danceabilityHide = false;
    const energyHide = false;
    const instrumentalnessHide = false;
    const keyHide = false;
    const livenessHide = false;
    const loudnessHide = false;
    const modeHide = false;
    const speechinessHide = false;
    const tempoHide = false;
    const time_signatureHide = false;
    const valenceHide = false;
    const popularityHide = false;
    const explicitHide = false;
    const durationHide = false;
    const timestampHide = false;

    const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([
        {
            field: "name",
            lockPosition: "left"
        }, {
            field: "acousticness",
            headerTooltip: "A confidence measure from 0.0 to 1.0 of whether a track is acoustic",
            hide: acousticHide
        }, {
            field: "danceability",
            headerTooltip: "A value from 0.0 to 1.0 of the danceability of the track",
            hide: danceabilityHide
        }, {
            field: "energy",
            headerTooltip: "A perceptual measure from 0.0 to 1.0 representing the intesity and activity of a track",
            hide: energyHide
        }, {
            field: "instrumentalness",
            headerTooltip: "Probability a track has no vocals",
            hide: instrumentalnessHide
        }, {
            field: "key",
            headerTooltip: "The estimated key of the track",
            hide: keyHide
        }, {
            field: "liveness",
            headerTooltip: "Probability of a track being performed live (with an audience)",
            hide: livenessHide
        }, {
            field: "loudness",
            headerTooltip: "The overall loudness of a track in decibels (dB), between -60 and 0",
            hide: loudnessHide
        }, {
            field: "mode",
            headerTooltip: "The modality of a track, either Major or Minor",
            hide: modeHide
        }, {
            field: "speechiness",
            headerTooltip: "Probability of the presence of spoken words in a track",
            hide: speechinessHide
        }, {
            field: "tempo",
            headerTooltip: "The overall estimated tempo of a track in beats per minute (BPM)",
            hide: tempoHide
        }, {
            field: "time_signature",
            headerTooltip: "The estimated time signature of the track",
            headerName: "Time Signature",
            // render as time_sig / 4,
            hide: time_signatureHide
        }, {
            field: "valence",
            headerTooltip: "A measure from 0.o to 1.0 describing the musical positiveness conveyed by a track",
            hide: valenceHide
        }, {
            field: "popularity",
            headerTooltip: "The Spotify Popularity of the track (affected by recency)",
            hide: popularityHide
        }, {
            field: "explicit",
            hide: explicitHide
        }, {
            field: "duration",
            hide: durationHide
        }, {
            field: "timestamp",
            headerName: "Added",
            hide: timestampHide
        }
    ]);

    const defaultColDef = useMemo(() => ({
        flex: 1,
        filter: true
    }), []);

    return(<div className="table-view">
        <AgGridReact
            theme={themeQuartz.withPart(colorSchemeDarkWarm)}
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            allowDragFromColumnsToolPanel
            // * Pagination
            pagination

        />
    </div>)
}