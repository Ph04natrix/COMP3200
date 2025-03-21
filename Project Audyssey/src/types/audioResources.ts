/* //todo
Can use source which is just one audio collection
Or can use multiple sources of track
*/
export type AudioResource = Song | SongCollection;

export type Song = {
    type: "Song"
    name: string,
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
    coords: {
        x: number,
        y: number,
        z: number
    }
}

export type LowercaseAttr = keyof Omit<Song, "type" | "name" | "duration" | "coords">;

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
    // value between 0.0 and 1.0
    Acousticness="Acousticness",
    Danceability="Danceability",
    Energy="Energy",
    Valence="Valence",
    Speechiness="Speechiness",
    Liveness="Liveness",
    Loudness="Loudness",
    Instrumental="Instrumental",
    // value between 0.0 and 120.0
    Tempo="Tempo",
    // value between 0 and infinity?
    // todo Duration="Duration"
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
    active: boolean
    min: 0,
    range: {
        currMin: number,
        currMax: number,
    },
    max: 1 | 120,
}