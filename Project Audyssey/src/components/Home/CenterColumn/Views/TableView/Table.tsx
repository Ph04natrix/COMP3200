import "./Table.css";

import { useCallback, useMemo, useState } from "react";
// import TableHeadItem from "./TableHeadItem";
// import TableRow from "./TableRow";

import { AgGridReact } from "ag-grid-react";
import {
    colorSchemeDarkWarm,
    GetRowIdParams,
    SizeColumnsToContentStrategy,
    SizeColumnsToFitGridStrategy,
    themeQuartz,
    type ColDef
} from "ag-grid-community";
import { Key, Mode } from "../../../../../types/audioResources";

export interface IRow {
    name: string;
    artists: string;
    album: string //Album;
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

export default function Table(props: {
    rowData: IRow[]
}) {
    // row data exists but table won't show it, could be fixed by moving the row data above into home.tsx

    const artistsHide = false;
    const albumHide = false;

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
            lockPosition: "left",
            pinned: "left",
            minWidth: 100
        }, {
            field: "artists",
            hide: artistsHide,
            minWidth: 100
        }, {
            field: "album",
            hide: albumHide,
            minWidth: 100
        }, {
            field: "acousticness",
            headerTooltip: "A confidence measure from 0.0 to 1.0 of whether a track is acoustic",
            hide: acousticHide,
            minWidth: 100
        }, {
            field: "danceability",
            headerTooltip: "A value from 0.0 to 1.0 of the danceability of the track",
            hide: danceabilityHide,
            minWidth: 100
        }, {
            field: "energy",
            headerTooltip: "A perceptual measure from 0.0 to 1.0 representing the intesity and activity of a track",
            hide: energyHide,
            minWidth: 100
        }, {
            field: "instrumentalness",
            headerTooltip: "Probability a track has no vocals",
            hide: instrumentalnessHide,
            minWidth: 100
        }, {
            field: "key",
            headerTooltip: "The estimated key of the track",
            hide: keyHide,
            minWidth: 100
        }, {
            field: "liveness",
            headerTooltip: "Probability of a track being performed live (with an audience)",
            hide: livenessHide,
            minWidth: 100
        }, {
            field: "loudness",
            headerTooltip: "The overall loudness of a track in decibels (dB), between -60 and 0",
            hide: loudnessHide,
            minWidth: 100
        }, {
            field: "mode",
            headerTooltip: "The modality of a track, either Major or Minor",
            hide: modeHide,
            minWidth: 100,
            valueFormatter: p => p.value === Mode.Major ? "Major" : "Minor"
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
            valueFormatter: p => p.value + "/4",
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
        // flex: 1,
        filter: true
    }), []);

    const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

    return(<div className="table-view" style={gridStyle}>
        <AgGridReact
            theme={themeQuartz.withPart(colorSchemeDarkWarm)}
            rowData={props.rowData}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            
            autoSizeStrategy={{
                type: "fitCellContents",
                colIds: [
                    "name",
                    "acousticness",
                    "danceability",
                    "energy",
                    "instrumentalness",
                    "key",
                    "liveness",
                    "loudness",
                    "mode",
                    "speechiness",
                    "tempo",
                    "time_signature",
                    "valence",
                    "popularity",
                    "explicit",
                    "duration",
                    "timestamp"
                ]
            } as SizeColumnsToContentStrategy}
            //getRowId={getRowId}
            // * Pagination
            pagination

            alwaysShowHorizontalScroll
            debug
            scrollbarWidth={8}
            domLayout="normal"
        />
    </div>)
}