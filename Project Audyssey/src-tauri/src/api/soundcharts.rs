use serde::{Serialize, Deserialize};
use tauri::http::{HeaderMap, StatusCode};
use tauri_plugin_http::reqwest::Client;

use crate::error::MyResult;

use super::conversion::{Attributes, MinimalTrackObject};

pub async fn get_song_audio_attributes(
    songs: Vec<MinimalTrackObject>,
    mut limit: u16
) -> MyResult<Vec<MinimalTrackObject>>{
    let client = Client::new();
    let base_endpoint = "https://customer.api.soundcharts.com/api/v2.25/song/by-platform/spotify";

    let mut attributed_songs: Vec<MinimalTrackObject> = Vec::new();
    
    for song in songs {
        if limit > 0 {
            let param = &song.spotify_id;
            let url = format!("{base_endpoint}/{param}");
            let mut updated_song: MinimalTrackObject = song;

            if let Ok(res) = client
                .get(url)
                .header("x-app-id", "UNIVERSITY-OF-SOUTHAMPTON_59CFD081")
                .header("x-api-key", "66017e280fb05d6b")
                .send().await {
                    limit -= 1;
                    match res.status() {
                        StatusCode::OK => {
                            let song_attributes: Attributes = res.json::<SoundChartsResponse>().await?.object.into();
                            updated_song.attributes = Some(song_attributes);
                            println!("Received attributes for {}, limit={limit}", updated_song.name);
                        },
                        StatusCode::BAD_REQUEST | StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN | StatusCode::NOT_FOUND | StatusCode::GONE=> {
                            let err_res = res.json::<SoundChartsErrorResponse>().await?;
                            for err in err_res.errors {
                                eprintln!("[{}] {}", err.code, err.message);
                            }
                        },
                        _ => panic!("Unrecognised status code received from SoundCharts Request")
                    }
                }
            attributed_songs.push(updated_song);
        }
        else {
            println!("Limit={limit}");
            break
        }
    }

    Ok(attributed_songs)
}

#[tauri::command]
pub async fn update_song_attributes(

) -> MyResult<()> {
    
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SoundChartsResponse {
    r#type: String,
    object: SongObject,
    errors: Vec<SoundChartsErrorObject>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SoundChartsErrorResponse {
    errors: Vec<SoundChartsErrorObject>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SoundChartsErrorObject {
    key: String,
    code: u32,
    message: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SongObject {
    uuid: String,
    name: String,
    isrc: ISRCObject,
    creditName: String,
    artists: Vec<SCArtistObject>,
    releaseDate: String, //2025-03-03T16:55:42+00:00
    copyright: String,
    appUrl: String,
    imageUrl: String,
    duration: u32,
    explicit: bool,
    pub genres: Vec<SCGenreObject>,
    composers: Vec<String>,
    producers: Vec<String>,
    labels: Vec<SCLabel>,
    pub audio: SCAttributes,
    languageCode: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ISRCObject {
    value: String,
    countryCode: String,
    countryName: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SCArtistObject {
    uuid: String,
    slug: String,
    name: String,
    appUrl: String,
    imageUrl: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SCGenreObject {
    root: String,
    sub: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SCLabel {
    name: String,
    r#type: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SCAttributes {
    pub acousticness: f32,
    pub danceability: f32,
    pub energy: f32,
    pub instrumentalness: f32,
    pub key: i32,
    pub liveness: f32,
    pub loudness: f32,
    pub mode: u32,
    pub speechiness: f32,
    pub tempo: f32,
    pub timeSignature: u32,
    pub valence: f32
}