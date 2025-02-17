use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct SoundChartsSongWrapper {
    r#type: String,
    object: SoundChartsSongObject,
    errors: Vec<SoundChartsErrorObject>
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SoundChartsISRC {
    value: String,
    countryCode: String,
    countryName: String
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SoundChartsArtistObject {
    uuid: String,
    slug: String,
    name: String,
    appUrl: String,
    imageUrl: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GenreObject {
    root: String,
    sub: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LabelObject {
    name: String,
    r#type: String
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AudioObject {
    acousticness: f32,
    danceability: f32,
    energy: f32,
    instrumentalness: f32,
    key: i32,
    liveness: f32,
    loudness: f32,
    mode: u8,
    speechiness: f32,
    tempo: f32,
    timeSignature: u32,
    valence: f32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SoundChartsSongObject {
    uuid: String,
    name: String,
    isrc: SoundChartsISRC,
    creditName: String,
    artists: SoundChartsArtistObject,
    releaseDate: String, //"2025-02-17T14:30:54+00:00",
    copyright: String,
    appUrl: String,
    imageUrl: String,
    duration: u32,
    explicit: bool,
    genres: Vec<GenreObject>,
    composers: Vec<String>,
    producers: Vec<String>,
    labels: Vec<LabelObject>,
    audio: AudioObject,
    languageCode: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SoundChartsErrorObject {
    key: String,
    code: u32,
    message: String,
}

pub async fn get_song_rich_metadata() {

}