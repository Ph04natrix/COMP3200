use serde::{Deserialize, Serialize};
use serde_json::from_str;
use tauri::{
    http::HeaderMap, AppHandle, Emitter, State, Url
};
use tauri_plugin_http::reqwest::*;

use crate::{
    AppState,
    error::{MyError, MyResult}
};

use super::conversion::{minimal_tracks_to_file, MinimalTrackObject};

#[derive(Debug, Serialize, Deserialize)]
pub enum SpotifyEndpoints {
    GetSavedTracks {
        market: String, // should always be set to GB
        limit: u32, // range of 0-50
        offset: u32 // 0 to infinity
    },
    CheckSavedTracks,
    SaveTracks {
        ids: Vec<String> // max 50 Spotify IDs
    },
    UnsaveTracks {
        ids: Vec<String> // max 50
    },
    GetPlaybackState,
    GetCurrentlyPlayingTrack,
    StartResumePlayback {
        context_uri: String,
        // offset: OffsetObject,
        position: u32
    }, // ! only works for spotify premium
    PausePlayback,
    GetQueue,
    // AddToQueueEnd -> this endpoint only adds to the end of the queue and there is no easy way to play this song or rearrange the queue
    // as such the statResumePlayback endpoint will be used instead
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpotifyError {
    error: SpotifyErrorObject
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SpotifyErrorObject {
    status: u16, // ranges from 400-599
    message: String, // short description of cause of the error
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedTracksObject {
    href: String,
    pub items: Vec<SavedTrackObject>,
    limit: u16,
    next: Option<String>,
    offset: u32,
    previous: Option<String>,
    total: u32,
}

// * impl From/Into for converting the Spotify structs to the ECS components

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedTrackObject {
    pub added_at: String,
    pub track: TrackObject,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackObject {
    pub album: AlbumObject,
    pub artists: Vec<SimplifiedArtistObject>,
    // available_markets: Option<Vec<String>>,
    pub disc_number: u16,
    pub duration_ms: u32,
    pub explicit: bool,
    external_ids: ExternalIDsObject,
    external_urls: ExternalUrlsObject,
    href: String,
    pub id: String,
    is_local: bool,
    is_playable: bool,
    // linked_from: LinkedFromObject,
    #[serde(default)]
    restrictions: Option<RestrictionsObject>,
    pub name: String,
    pub popularity: u16,
    preview_url: Option<String>,
    pub track_number: u16,
    r#type: String,
    uri: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AlbumObject {
    pub album_type: String, // one of "album", "single", "compilation"
    pub total_tracks: u16,
    // available_markets: Option<Vec<String>>,
    external_urls: ExternalUrlsObject,
    href: Url,
    pub id: String,
    pub images: Vec<ImageObject>,
    pub name: String,
    pub release_date: String, // E.g "1981-12"
    pub release_date_precision: String,
    #[serde(default)]
    restrictions: RestrictionsObject,
    r#type: String,
    uri: String,
    pub artists: Vec<SimplifiedArtistObject>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SimplifiedArtistObject {
    external_urls: ExternalUrlsObject,
    pub href: String,
    pub id: String,
    pub name: String,
    r#type: String,
    uri: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExternalIDsObject {
    #[serde(default)]
    isrc: String,
    #[serde(default)]
    ean: String,
    #[serde(default)]
    upc: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExternalUrlsObject {
    spotify: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LinkedFromObject {
    external_urls: ExternalUrlsObject,
    href: String,
    id: String,
    uri: String
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RestrictionsObject {
    reason: String, // One of "market", "product", "explicit"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageObject {
    url: String,
    height: u16,
    width: u16,
}

const SPOTIFY_API: &str = "https://api.spotify.com/v1/";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SpotifyLibraryDownloadProgress {
    downloaded: u32,
    remaining: u32
}

pub async fn handle_request(
    endpoint: SpotifyEndpoints,
    client: &Client,
    access_token: &String,
) -> MyResult<Response>{

    let (
        specific_endpoint,
        method,
        headers,
        // body,
        params
    ) = match endpoint {
        SpotifyEndpoints::GetSavedTracks{ market, limit, offset} => (
            "me/tracks",
            Method::GET,
            HeaderMap::new(),
            vec![
                ("market", market),
                ("limit", limit.to_string()),
                ("offset", offset.to_string()),
            ]
        ),
        SpotifyEndpoints::CheckSavedTracks => todo!(), // * is this required?
        SpotifyEndpoints::SaveTracks{ids}=> (
            "me/tracks/contains",
            Method::GET,
            HeaderMap::new(),
            vec![
                ("ids", ids.join(","))
            ]
        ),
        _ => todo!()
    };
    
    let mut url: String = SPOTIFY_API.to_string();
    url += specific_endpoint;
    let param_url = Url::parse_with_params(&url, params)?;

    let req = client
        .request(method, param_url)
        .bearer_auth(access_token)
        .headers(headers);
        //.body(body)
    let res = req
        .send()
        .await?;

    match res.status() {
        StatusCode::OK | StatusCode::CREATED | StatusCode::ACCEPTED | StatusCode::NO_CONTENT => {
            Ok(res)
        }, 
        // * ERROR CODES
        StatusCode::BAD_REQUEST => {// 400
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("[400] Bad request: {err_msg}");
            Err(MyError::SpotifyAPI { code: 400, message: err_msg })
        },
        // todo emit event which causes the token to be refreshed
        StatusCode::UNAUTHORIZED => {// 401: Bad or expired token. This can happen if the user revoked a token or the access token has expired. You should re-authenticate the user.
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("The access token is bad or expired, the user needs re-authenticating");
            println!("[401]: {err_msg:?}");
            // refresh_access_token().await?;
            Err(MyError::SpotifyAPI { code: 401, message: err_msg })
        },
        StatusCode::FORBIDDEN => {// 403: Bad OAuth request (wrong consumer key, bad nonce, expired timestamp...). Unfortunately, re-authenticating the user won't help here.
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("Bad OAuth Request (wrong consumer key, bad nonce, expired timestamp, ...)");
            println!("[403]: {err_msg:?}");
            Err(MyError::SpotifyAPI { code: 403, message: err_msg })
        },
        StatusCode::TOO_MANY_REQUESTS => {// 429
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("Exceeded rate limits!");
            println!("[429]: {err_msg:?}");
            Err(MyError::SpotifyAPI { code: 429, message: err_msg })
        },
        StatusCode::INTERNAL_SERVER_ERROR | StatusCode::BAD_GATEWAY | StatusCode::SERVICE_UNAVAILABLE => {
            panic!("Spotify server is down!")
        },
        _ => panic!("Unaccounted status code received from Spotify!")
    }
}

#[tauri::command]
pub async fn get_user_library_count(state: State<'_, AppState>) -> MyResult<u32> {
    // Check how many items are in a user's library
    let state_lock = state.lock().await;
    let token = &state_lock.AccessToken.access_token;

    let mut library_count_endpoint: String = SPOTIFY_API.to_string();
    library_count_endpoint.push_str("me/tracks");

    let params = [
        ("market", "GB"),
        ("limit", "1"),
        ("offset", "0"),
    ];

    let param_url = Url::parse_with_params(&library_count_endpoint, params);

    let client = Client::new();
    let res = client.get(param_url.expect("Failed to parameterise library_count_endpoint")).bearer_auth(token).send().await?;

    let res_text = res.text().await?;
    println!("Printing body: {:#?}", res_text);

    let library_check = from_str::<SavedTracksObject>(&res_text)?;

    Ok(library_check.total)
}

#[tauri::command]
pub async fn get_user_full_library(
    app: AppHandle,
    mut total: u32,
    state: State<'_, AppState>,
) -> MyResult<String> {
    let state_lock = state.lock().await;
    let token = &state_lock.AccessToken.access_token;
    let file_path = &state_lock.main_directory;

    let client = Client::new();
    
    let mut offset = 0;
    /*
        If the total is 100 then we can set limit=50 and increment the offset by the limit after sending the request
        other wise if the total is 50 or fewer then we set limit=total and ignore increasing the offset
    */

    let mut minimal_songs: Vec<MinimalTrackObject> = Vec::new();
    while total > 0 {
        let limit = if total >= 50 { 50 } else { total };

        let parsed_songs = handle_request(SpotifyEndpoints::GetSavedTracks {
            market: "GB".to_string(),
            limit: limit,
            offset: offset
        }, &client, token).await?.json::<SavedTracksObject>().await?;

        for track_obj in parsed_songs.items {
            minimal_songs.push(MinimalTrackObject::from(track_obj));

            // * Note that the minimal tracks could be directly converted to ECS here, but
            // * world can't be used after an awit due to not implementing Send + Sync
        }

        app.emit("spotify-library-download-progress", SpotifyLibraryDownloadProgress {
            downloaded: limit,
            remaining: total,
        }).unwrap();
        
        offset += limit;
        total -= limit;
        println!("offset={offset}, total={total}");  
    };

    match minimal_tracks_to_file(file_path, minimal_songs) {
        Ok(msg) => println!("{msg}"),
        Err(err) => println!("{err}")
    };

    app.emit("spotify-library-download-finished", 0).unwrap();

    Ok(file_path.to_str().expect("Couldn't convert app_data_dir to string").to_string())
}