export type Axis = {metric: string, orient: SpatialDimension}

export enum SpatialDimension { X, Y, Z }
export type Metric = ContinuousMetric | DiscreteMetric

export enum ContinuousMetric {
    // value between 0.0 and 1.0
    Acousticness,
    Danceability,
    Energy,
    Valence,
    Speechiness,
    Liveliness,
    Loudness,
    Instrumentalness,
    // value between 0.0 and 120.0
    Tempo
}

export enum DiscreteMetric {
    Mode,
    Explicit,
    TimeSignature,
    Key,
    Genres
}

export type SongColView
 = { type: "Dashboard" }
 | { type: "Table" }
 | { type: "StaticGraph", axes: [Axis]}
 | { type: "DynamicGraph" }
;

export type Song = {
    type: "Song"
    name: string,
    duration: number,
}

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

export type AudioResource = Song | SongCollection;