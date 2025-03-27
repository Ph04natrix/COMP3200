import "./Home.css";
import "./RightColumn/AxisContainer.css";
import { useEffect, useRef, useState } from "react";
import { AttrSelect, ContinuousMetric, Song, SongCollection, SongColType, SongColView, SpatialDimension, StaticCamera } from "../../types/audioResources";

import BottomBar from "./BottomBar";
import TitleBar from "./CenterColumn/TitleBar";
import ViewSelector from "./CenterColumn/ViewSelector";
import Dashboard from "./CenterColumn/Views/Dashboard";
import StaticGraph from "./CenterColumn/Views/StaticGraphView/StaticGraph";
import DynamicGraph from "./CenterColumn/Views/DynamicGraph";
import Table from "./CenterColumn/Views/TableView/Table";
import AxisContainer from "./RightColumn/AxisContainer";
import OtherAttrContainer from "./RightColumn/OtherAttrContainer";

import { invoke } from "@tauri-apps/api/core";
import { SongContMetricProgress } from "../../types/tauriEvent";
import { listen, once } from "@tauri-apps/api/event";
import DetailedSong from "./LeftColumn/DetailedSong";

export default function Home() {
    const [activeAudioResource, setActiveAudioResource] = useState<SongCollection>({
        type: SongColType.Library,
        name: "",
        view: "Dashboard"
    });

    const fetchedSongs = useRef<boolean>(false);
    const [songs, setSongs] = useState<Song[]>(null!); // todo invoke backend to fetch these songs
    const [selectedSong, setSelectedSong] = useState<Song>();

    const [cameraState, setCameraState] = useState<StaticCamera>(StaticCamera.NoX);

    useEffect(() => {
        if (!fetchedSongs.current) {// main func
            loadSongs().then(songs => {
                fetchedSongs.current = true;
                setSongs(songs);
                setSelectedSong(songs[0]);
            });
        };

        return () => {// cleanup function
            fetchedSongs.current = false;
        };
    }, [fetchedSongs])

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

    const [attrSelectors, setAttrSelectors] = useState<AttrSelect[]>([
        {
            attr: ContinuousMetric.Acousticness, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 0.01,
        },
        {
            attr: ContinuousMetric.Danceability, use: SpatialDimension.Y, values: [],
            min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 0.01
        },
        {
            attr: ContinuousMetric.Energy, use: SpatialDimension.Z, values: [],
            min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 0.01
        },
        {
            attr: ContinuousMetric.Instrumental, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 0.01
        },
        {
            attr: ContinuousMetric.Liveness, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 0.01
        },
        {
            attr: ContinuousMetric.Loudness, use: SpatialDimension.X, values: [],
            min: -60, range: { currMin: -60, currMax: 0 }, max: 0, step: 0.1
        },
        {
            attr: ContinuousMetric.Speechiness, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 0.01
        },
        {
            attr: ContinuousMetric.Valence, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: 1 }, max: 1, step: 0.01
        },
        {
            attr: ContinuousMetric.Tempo, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: 240 }, max: 240, step: 0.1
        },
        {
            attr: ContinuousMetric.Duration, use: "Unused", active: false,
            min: 0, range: { currMin: 0, currMax: 500000 }, max: 500000, step: 1
        },
        {
            attr: ContinuousMetric.Popularity, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: 100 }, max: 100, step: 1
        },
        {
            attr: ContinuousMetric.Timestamp, use: "Unused", values: [],
            min: 0, range: { currMin: 0, currMax: Date.now() }, max: Date.now(), step: 10 // seconds
        } // todo set these to be the earliest and latest times of the library, to the nearest something
    ]);

    const fillAttrValues = async () => {
        let attrSels: ContinuousMetric[] = attrSelectors.map(attrSel => attrSel.attr)

        const values = await Promise.all(
            attrSels.map(async (attr) => {
                return invoke<number[]>(
                    "get_cont_metric_values",
                    {metric: attr.toString()}
                ).then(values => {
                    console.log(values);
                    return values
                })
            })
        );

        const valuesFilled = attrSelectors.map((attrSel, i) => {
            return {
                ...attrSel,
                values: values[i]
            }
        })

        console.log(valuesFilled);

        setAttrSelectors(valuesFilled);
    }

    function updateRange(newMin: number , newMax: number, attr: ContinuousMetric) {
        setAttrSelectors(attrSelectors.map(attrSelect => attrSelect.attr === attr
            ? {
                ...attrSelect,
                range: {currMin: newMin, currMax: newMax}
            } : attrSelect
        ))
    }

    // Returns true if input is of type SongCollection
    function isSongCol(audioRes: Song | SongCollection): audioRes is SongCollection {
        return (audioRes as SongCollection) !== undefined;
    }

    function renderView(viewType: SongColView) {
        switch (viewType) {
            case "Dashboard": return <Dashboard />
            case "Table": return <Table // todo pull from songs state
                theadData={["Song"]}
                tbodyData={[["From the start"]]}
            />
            case "StaticGraph": return <StaticGraph
                songs={songs}
                currentAttrs={attrSelectors.filter(attrSelect => attrSelect.use !== "Unused")}
                selectedSong={selectedSong}
                setSelectedSong={setSelectedSong}
                cameraState={cameraState}
            />
            case "DynamicGraph": return <DynamicGraph />
        }
    }

    return(<>
    <div id="upper-main-section" className="flex-row">
        <div id="leftColumn">
            <div className="sidebox">
                <DetailedSong selectedSong={selectedSong}/>
            </div>
            <div className="sidebox">Bottom left box</div>
        </div>
        <div id="centerColumn" className="center">
            <TitleBar activeAudioResource={activeAudioResource} />
            <div className="view-container">
                {renderView(activeAudioResource.view)}
            </div>
            {
                isSongCol(activeAudioResource) && <ViewSelector
                    activeAudioResource={activeAudioResource}
                    setActiveAudioResource={setActiveAudioResource}
                    cameraState={cameraState}
                />
            }
        </div>
        <div id="rightColumn">
            <div className="sidebox">Top right box</div>
            <div className="sidebox center">
                {
                    (activeAudioResource.view === "StaticGraph") && <>
                        <div className="main-axis-container">
                            <AxisContainer
                                thisAttr={attrSelectors.filter(({ use }) => { return use === SpatialDimension.X })[0]}
                            allAttrs={attrSelectors}
                            updateAttrSelects={setAttrSelectors}
                            updateRange={updateRange}
                            cameraState={cameraState}
                                setCameraState={setCameraState}
                            />
                            <AxisContainer
                                thisAttr={attrSelectors.filter(attr => { return attr.use === SpatialDimension.Y })[0]}
                            allAttrs={attrSelectors}
                            updateAttrSelects={setAttrSelectors}
                            updateRange={updateRange}
                            cameraState={cameraState}
                                setCameraState={setCameraState}
                            />
                            <AxisContainer
                                thisAttr={attrSelectors.filter(attr => { return attr.use === SpatialDimension.Z })[0]}
                                allAttrs={attrSelectors}
                                updateAttrSelects={setAttrSelectors}
                                updateRange={updateRange}
                                cameraState={cameraState}
                                setCameraState={setCameraState}
                            />
                        </div>
                        <OtherAttrContainer attrSelectors={attrSelectors} updateRange={updateRange} />
                    </>
                }
            </div>
        </div>
    </div>
    <BottomBar />
    </>);
}