use std::ops::Deref;

use serde::{Deserialize, Serialize};
use serde_json::from_str;
use tauri::{http::HeaderMap, State, Url};
use tauri_plugin_http::reqwest::*;

use crate::{
    AccessToken,
    AppState,
    error::{MyError, MyResult}
};

type SpotifyID = String;
/*
#[derive(Debug, Serialize, Deserialize)]
struct SpotifyID(String);

impl Deref for SpotifyID {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}*/

#[derive(Debug, Serialize, Deserialize)]
pub enum SpotifyEndpoints {
    GetSavedTracks {
        market: String, // should always be set to GB
        limit: u16, // range of 0-50
        offset: u32 // 0 to infinity
    },
    CheckSavedTracks,
    SaveTracks {
        ids: Vec<SpotifyID> // max 50 Spotify IDs
    },
    UnsaveTracks {
        ids: Vec<SpotifyID> // max 50
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
    items: Vec<SavedTrackObject>,
    limit: u16,
    next: Option<String>,
    offset: u32,
    previous: Option<String>,
    total: u32,
}

// * impl From/Into for converting the Spotify structs to the ECS components

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedTrackObject {
    added_at: String,
    track: TrackObject,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrackObject {
    album: AlbumObject,
    artists: Vec<SimplifiedArtistObject>,
    // available_markets: Option<Vec<String>>,
    disc_number: u16,
    duration_ms: u32,
    explicit: bool,
    external_ids: ExternalIDsObject,
    external_urls: ExternalUrlsObject,
    href: String,
    id: SpotifyID,
    is_local: bool,
    is_playable: bool,
    // linked_from: LinkedFromObject,
    #[serde(default)]
    restrictions: Option<RestrictionsObject>,
    name: String,
    popularity: u16,
    preview_url: Option<String>,
    track_number: u16,
    r#type: String,
    uri: String,
    
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AlbumObject {
    album_type: String, // one of "album", "single", "compilation"
    total_tracks: u16,
    // available_markets: Option<Vec<String>>,
    external_urls: ExternalUrlsObject,
    href: Url,
    id: SpotifyID,
    images: Vec<ImageObject>,
    name: String,
    release_date: String, // E.g "1981-12"
    release_date_precision: String,
    #[serde(default)]
    restrictions: RestrictionsObject,
    r#type: String,
    uri: String,
    artists: Vec<SimplifiedArtistObject>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SimplifiedArtistObject {
    external_urls: ExternalUrlsObject,
    href: String,
    id: SpotifyID,
    name: String,
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
    id: SpotifyID,
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

pub async fn handle_request(
    endpoint: SpotifyEndpoints,
    client: &Client,
    access_token: &String,
) -> MyResult<String>{

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
        StatusCode::OK | StatusCode::CREATED | StatusCode::ACCEPTED | StatusCode::NO_CONTENT =>     -odo!(), 
        // * ERROR CODES
        StatusCode::BAD_REQUEST => {// 400
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("[400] Bad request: {err_msg}")
        },
        // todo emit event which causes the token to be refreshed
        StatusCode::UNAUTHORIZED => {// 401: Bad or expired token. This can happen if the user revoked a token or the access token has expired. You should re-authenticate the user.
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("The access token is bad or expired, the user needs re-authenticating");
            println!("[401]: {err_msg:?}");
            // refresh_access_token().await?;
        },
        StatusCode::FORBIDDEN => {// 403: Bad OAuth request (wrong consumer key, bad nonce, expired timestamp...). Unfortunately, re-authenticating the user won't help here.
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("Bad OAuth Request (wrong consumer key, bad nonce, expired timestamp, ...)");
            println!("[403]: {err_msg:?}");
        },
        StatusCode::TOO_MANY_REQUESTS => {// 429
            let err_msg = res.json::<SpotifyError>().await?.error.message;
            println!("Exceeded rate limits!");
            println!("[429]: {err_msg:?}");
        },
        StatusCode::INTERNAL_SERVER_ERROR | StatusCode::BAD_GATEWAY | StatusCode::SERVICE_UNAVAILABLE => {
            panic!("Spotify server is down!")
        },
        _ => panic!("Unaccounted status code received from Spotify!")
    }

    Ok(String::new())
}

#[tauri::command]
pub async fn get_user_library_count(state: State<'_, AppState>) -> MyResult<u32> {
    // Check how many items are in a user's library
    let state_lock = state.lock().await;
    let token = &state_lock.AccessToken.access_token;

    /*
    let endpoint = SpotifyEndpoints::GetSavedTracks { market: "GB".to_string(), limit: 1, offset: 0 };
    let res = build_request(endpoint, client, token).await?;
     */

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
    total: u32,
    state: State<'_, AppState>,
) -> MyResult<String> {
    let state_lock = state.lock().await;
    let token = &state_lock.AccessToken.access_token;

    let client = Client::new();
    
    let market = "GB".to_string();
    let mut offset = 0;
    /*
        If the total is 100 then we can set limit=50 and increment the offset by the limit after sending the request
        other wise if the total is 50 or fewer then we set limit=total and ignore increasing the offset
     */

    loop {
        match total {
            n if n > 50 => {
                let res = handle_request(
                    SpotifyEndpoints::GetSavedTracks {
                        market: "GB".to_string(),
                        limit: 50,
                        offset: offset
                    }, &client, token
                ).await;
            },
            _ => todo!(),
        }     
    }


    Ok(String::new())
}