export type SpotifyLibraryDownloadProgress = {
    downloaded: number,
    remaining: number,
}

export type SoundChartsUpdateProgress = {
    updated_song: string,
    // remaining: number
}

export type SongContMetricProgress = {
    name: string,
    acousticness: number,
    danceability: number,
    energy: number,
    valence: number,
    tempo: number,
    speechiness: number,
    liveness: number,
    loudness: number,
    instrumentalness: number,
    duration: number
}