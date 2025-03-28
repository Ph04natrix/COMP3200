use flecs_ecs::prelude::{Builder, QueryAPI, QueryBuilderImpl};
use serde::{Serialize, Deserialize};
use tauri::{http::StatusCode, Emitter};

use crate::{
    ecs::types::{
        Acousticness, Danceability, Energy, Genres, Instrumentalness, Key, Liveness, Loudness, MissingAttributes, Mode, Name, Song, Speechiness, SpotifyID, Tempo, TimeSignature, Valence
    },
    error::MyResult,
    AppState
};

use super::conversion::Attributes;

#[tauri::command]
pub async fn song_without_attributes_count(
    state: tauri::State<'_, AppState>
) -> MyResult<u32> {
    let state_lock = state.lock().await;
    let world = &state_lock.ecs_world;

    let q = world
        .query::<&Name>()
        .with::<&Song>()
        .with::<&MissingAttributes>()
        .build()
    ;

    let mut count = 0;
    println!("Counting songs without attributes");
    q.each(|n| {
        println!("Song {} is missing attributes", n.0);
        count += 1;
    });

    Ok(count)
}

#[tauri::command]
pub async fn fill_song_attributes(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle
) -> MyResult<String> {
    let state_lock = state.lock().await;
    let world = &state_lock.ecs_world;

    let q = world.query::<(&SpotifyID, &Name)>()
        .with::<(&Song, MissingAttributes)>()
        .build()
    ;

    let mut limit = 10;
    let base_endpoint = "https://customer.api.soundcharts.com/api/v2.25/song/by-platform/spotify";
    
    world.defer(|| {
        q.run_iter(|it, (s_id, name)| {
            // dbg!(it.archetype());
            dbg!(it.count());
            
            for i in it.iter() {
                let song_ent = it.entity(i);

                if limit > 0 {
                    let url = format!("{base_endpoint}/{}", s_id[i].0);
                   
                    if let Ok(res) = ureq::get(url)
                        .header("x-app-id", "UNIVERSITY-OF-SOUTHAMPTON_59CFD081")
                        .header("x-api-key", "66017e280fb05d6b")
                        .call() {
                            limit -= 1;
                            match res.status() {
                                StatusCode::OK => {
                                    let attrs: Attributes = res
                                        .into_body()
                                        .read_json::<SoundChartsResponse>()
                                        .expect("Couldn't deserialize response into SoundChartsResponse")
                                        .object.into()
                                    ;
                                    
                                    // dbg!(world.is_deferred());
                                    song_ent
                                        .set(Acousticness(attrs.acousticness))
                                        .set(Danceability(attrs.danceability))
                                        .set(Energy(attrs.energy))
                                        .set(Valence(attrs.valence))
                                        .set(Tempo(attrs.tempo))
                                        .set(Speechiness(attrs.speechiness))
                                        .set(Liveness(attrs.liveness))
                                        .set(Loudness(attrs.loudness))
                                        .set(Instrumentalness(attrs.instrumentalness))
                                        .set(Mode::try_from(attrs.mode).expect("Mode is not 0 or 1"))
                                        .set(TimeSignature(attrs.time_signature))
                                        .set(Key::try_from(attrs.key).expect("Key is not in range 3..7"))
                                        .set(Genres(vec![]/*attrs.genres*/))
                                        .remove::<MissingAttributes>()
                                    ;
                                    // dbg!(song_ent.has::<MissingAttributes>());
                                    println!("Received attributes for {}, limit={limit}", name[i].0);
        
                                    app.emit("soundcharts-update-progress", SoundChartsUpdateProgress {
                                        updated_song: name[i].0.clone(),
                                    }).expect("Couldn't emit event: soundcharts-update-progress");
                                },
                                StatusCode::BAD_REQUEST | StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN | StatusCode::NOT_FOUND | StatusCode::GONE=> {
                                    let err_res = res
                                        .into_body()
                                        .read_json::<SoundChartsErrorResponse>()
                                        .expect("Couldn't deserialize response into SoundChartsErrorResponse")
                                    ;
                                    for err in err_res.errors {
                                        eprintln!("[{}] {}", err.code, err.message);
                                    }
                                },
                                _ => panic!("Unrecognised status code received from SoundCharts Request")
                            }
                    } else {
                        eprintln!("Could not get attributes from SoundCharts")
                    }
                } else { println!("Limit={limit}"); } // limit should be 0
            }
        }
    )});
    // dbg!(world.is_deferred());

    app.emit("soundcharts-update-finished", 0).unwrap();

    Ok("command fill_song_attributes finished".to_string())
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SoundChartsUpdateProgress {
    updated_song: String,
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

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
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