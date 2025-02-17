use std::str::FromStr;

use serde::{Deserialize, Serialize};
use serde_json::from_str;
use tauri::{http::HeaderMap, State, Url};
use tauri_plugin_http::reqwest::*;

use crate::{
    AccessToken,
    AppState,
    error::{MyError, MyResult}
};

#[derive(Debug, Serialize, Deserialize)]
pub enum SpotifyEndpoints {
    GetSavedTracks,
    CheckSavedTracks,


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
    id: String, // Spotify ID
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
    id: String, //Spotify ID
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
    id: String, // Spotify ID
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
    id: String,
    r#type: String,
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

/*
todo Should this return an object of type RequestBuilder? Goes from being async to more pure and simpler
todo means that the access_token needs to be passed into the function.
*/
pub async fn build_request(
    endpoint: SpotifyEndpoints,
    client: Client,
    access_token_struct: AccessToken,
) -> MyResult<String>{

    let mut url: String = SPOTIFY_API.to_string();

    let (specific_endpoint, method, headers/*, body*/) = match endpoint {
        SpotifyEndpoints::GetSavedTracks => ("me/tracks", Method::GET, HeaderMap::new()),
        SpotifyEndpoints::CheckSavedTracks => ("me/tracks/contains", Method::GET, HeaderMap::new()),
    };
    
    url += specific_endpoint;

    let req = client
        .request(method, url)
        .bearer_auth(access_token_struct.access_token)
        .headers(headers);
        //.body(body)
    let res = req
        .send()
        .await?;

    match res.status() {
        StatusCode::OK | StatusCode::CREATED | StatusCode::ACCEPTED | StatusCode::NO_CONTENT => todo!(),
        StatusCode::BAD_REQUEST => todo!(),
        StatusCode::UNAUTHORIZED => {
            //refresh_access_token().await?;
        },
        StatusCode::FORBIDDEN => todo!(),
        StatusCode::TOO_MANY_REQUESTS => todo!(),
        StatusCode::INTERNAL_SERVER_ERROR => todo!(),
        StatusCode::BAD_GATEWAY => todo!(),
        StatusCode::SERVICE_UNAVAILABLE => todo!(),
        _ => todo!()
    }

    Ok(res.text().await?)
}

#[tauri::command]
pub async fn get_users_saved_tracks(state: State<'_, AppState>) -> MyResult<u32> {
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
    //Ok(2004)
}

// This function results in the user being prompted to login to their Apotify Account and grant access
// via the OAuth protocol.
#[tauri::command]
pub async fn request_auth_code(
    state: State<'_, AppState>
) -> MyResult<String>{ 
    let mut state_lock = state.lock().await;
    
    let (code_verifier, code_challenge) = generate_pkce_code();
    state_lock.code_verifier = String::from_utf8(code_verifier).expect("Could not convert code verifier to a String");
    let client_id = &state_lock.client_id;
    let redirect_uri = &state_lock.redirect;

    let scopes = [
        "user-read-email", //"user-read-private",
        // Playback scopes
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        // Playlist scopes
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-private",
        "playlist-modify-public",
        // Library scopes
        "user-library-modify", "user-library-read",
    ].join(" ");

    // Create the parameters to send off the get request which triggers the OAuth process
    let params: [(&str, &str); 6] = [
        ("client_id", client_id),
        ("response_type", "code"),
        ("redirect_uri", redirect_uri),
        ("scope", &scopes),
        ("code_challenge_method", "S256"),
        ("code_challenge", &code_challenge),
    ];

    let auth_endpoint = "https://accounts.spotify.com/authorize".to_string();
    let auth_url = Url::parse_with_params(&auth_endpoint, &params);

    match auth_url {
        Ok(url) => Ok(url.to_string()),
        Err(err) => Err(MyError::URLParse(err))
    }    
}

#[tauri::command(rename_all = "snake_case")]
pub async fn request_access_token(
    auth_code: String,
    state: State<'_, AppState>
) -> MyResult<String> {
    let mut state_lock = state.lock().await;
    let redirect_uri = &state_lock.redirect;
    let client_id = &state_lock.client_id;
    let code_verifier = &state_lock.code_verifier;
    
    let params = [
        ("grant_type", "authorization_code"),
        ("code", &auth_code),
        ("redirect_uri", redirect_uri),
        ("client_id", client_id),
        ("code_verifier", code_verifier)
    ];

    let token_endpoint = "https://accounts.spotify.com/api/token".to_string();
    let url = Url::parse_with_params(&token_endpoint, &params);
    
    let client = Client::new();
    let res = client
        .post(url.expect("Failed to send POST request"))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .send()
        .await?;

    println!("Status Code for Requesting Access Token: {}", res.status());

    state_lock.AccessToken = res.json::<AccessToken>().await?;
    let access_token = &state_lock.AccessToken.access_token;
    println!("Access token successfully acquired: {access_token}");
    
    Ok(state_lock.AccessToken.access_token.clone())
}

// todo this should be called whenever the access token expires which is a result of a
#[tauri::command(rename_all = "snake_case")]
pub async fn refresh_access_token(state: State<'_, AppState>) -> MyResult<String> {
    let mut state_lock = state.lock().await;
    let client_id = &state_lock.client_id;
    let client_secret = &state_lock.client_secret;
    let refresh_token = &state_lock.AccessToken.refresh_token;

    let params = [
        ("grant_type", "refresh_token"),
        ("refresh_token", refresh_token),
        ("client_id", client_id),
    ];

    let token_endpoint = "https://accounts.spotify.com/api/token".to_string();
    let url = Url::parse_with_params(&token_endpoint, &params);
    
    let client = Client::new();
    let res = client
        .post(url.expect("Failed to POST refresh token request"))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .basic_auth(client_id, Some(client_secret))
        .send()
        .await?;

    let refreshed_token;
    if res.status().is_success() {
        state_lock.AccessToken = res.json::<AccessToken>().await?;
        println!("Access token successfully refreshed!");
        refreshed_token = &state_lock.AccessToken.access_token;
        Ok(refreshed_token.to_string())
    } else {
        Err(MyError::RefreshAccess)
    }
}

// Generates both a code verifier and a code challenge
fn generate_pkce_code() -> (Vec<u8>, String) {
    let code_verify: Vec<u8> = pkce::code_verifier(128);
    let code_challenge: String = pkce::code_challenge(&code_verify);

    println!("Code challenge generated: {}", code_challenge);

    (code_verify, code_challenge)
}