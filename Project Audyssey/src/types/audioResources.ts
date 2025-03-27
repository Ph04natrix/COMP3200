/* //todo
Can use source which is just one audio collection
Or can use multiple sources of track
*/
export type AudioResource = Song | SongCollection;

export type Song = {
    type: "Song"
    name: string,
    contMetrics: SongContMetric,
    coords: {
        x: number,
        y: number,
        z: number
    }
}

export type SongContMetric = {
    duration: number,
    acousticness: number,
    danceability: number,
    energy: number,
    valence: number,
    tempo: number,
    speechiness: number,
    liveness: number,
    loudness: number,
    instrumentalness: number,
    // todo
    popularity: number,
    timestamp: number, //Date converted into milliseconds
}

export type LowercaseAttr = keyof SongContMetric;

export type SongExtras = {
    album: Album,
    artists: Artist[],
    discrete_metrics: {
        explicit: boolean,
        mode: Mode,
        time_signature: 3 | 4 | 5 | 6 | 7,
        key: Key,
        genres: Genre[]
    }
}

export type Album = {
    type: "Album" | "Single" | "Compilation",
    total_tracks: number,
    name: string,
    release_date: {
        date: string,
        precision: "Year" | "Month" | "Day",
    }
    artists: Artist[],
    images: {
        url: string,
        height: number,
        width: number
    }[]
}

export type Artist = {
    href: string,
    spotify_id: string,
    name: string,
}

export enum Mode {
    Minor,
    Major
}

export enum Key {
    None="None",
    C="C",
    CSharp="C#",
    D="D",
    DSharp="D#",
    E="E",
    F="F",
    FSharp="F#",
    G="G",
    GSharp="G#",
    A="A",
    ASharp="A#",
    B="B",
}

export type Genre = {
    root: string,
    sub: string[]
}

export type FullSong = Song & SongExtras;

export type SongCollection = {
    type: SongColType,
    name: string,
    view: SongColView
}

export enum SongColType {
    Library,
    Album,
    Compilation,
    Single,
    Playlist
}

export type SongColView
    = "Dashboard"
    | "Table"
    | "StaticGraph"
    | "DynamicGraph"
    ;

export enum SpatialDimension { X="X", Y="Y", Z="Z" }
export type Metric = ContinuousMetric | DiscreteMetric

export enum ContinuousMetric {
    Acousticness="Acousticness",
    Danceability="Danceability",
    Energy="Energy",
    Valence="Valence",
    Speechiness="Speechiness",
    Liveness="Liveness",
    Instrumental="Instrumentalness",
    Popularity="Popularity",
    // range not between 0 and 1
    Loudness="Loudness",
    Tempo="Tempo",
    Duration="Duration",
    Timestamp="Timestamp"
}

export enum DiscreteMetric {
    Mode,
    Explicit,
    TimeSignature,
    Key,
    Genres
}

export type AttrSelect = {
    attr: ContinuousMetric,
    use: "Unused" | SpatialDimension,
    min: 0 | -60,
    range: {
        currMin: number,
        currMax: number,
    },
    max: number, //1 | 120 | 0,
    step: 0.01 | 0.1 | 1 | 10,
    values: number[]
}

export enum StaticCamera {
    All="XYZ",
    NoX="YZ",
    NoY="XZ",
    NoZ="XY"
}

export enum StaticLayers {
    All = 0,
    X = 1,
    Y = 2,
    Z = 3
}