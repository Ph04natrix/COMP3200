use serde::{Deserialize, Serialize};
use tauri::{State, Url};
use tauri_plugin_http::reqwest::*;

use crate::{
    AccessToken,
    AppState,
    error::{MyError, MyResult}
};

#[derive(Debug, Serialize, Deserialize)]
pub enum SpotifyEndpoints {
    SavedTracksEndpoint,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedTracks {
    href: Url,
    limit: u16,
    next: Url,
    offset: u32,
    previous: String,
    total: u32,
    items: Vec<SavedTrackObject>
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SavedTrackObject {
    // todo fill this out
}

const SPOTIFY_API: &str = "https://api.spotify.com/v1/";

/*
todo Should this return an object of type RequestBuilder? Goes from being async to more pure and simpler
todo means that the access_token needs to be passed into the function.
*/
#[tauri::command]
pub async fn build_request(
    endpoint: SpotifyEndpoints,
    state: State<'_, AppState>
) -> MyResult<String>{
    let specific_endpoint = match (endpoint) {
        SpotifyEndpoints::SavedTracksEndpoint => "me/tracks"
    };

    let mut url: String = SPOTIFY_API.to_string();
    url += specific_endpoint;

    let state_lock = state.lock().await;
    let token = &state_lock.AccessToken.access_token;

    let method = Method::GET;

    let client = Client::new();
    let res = client.request(method, url).bearer_auth(token).send().await?;
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
        ("limit", "1"),
        ("offset", "0")
    ];

    let paramUrl = Url::parse_with_params(&library_count_endpoint, params);

    let client = Client::new();
    let res = client.get(paramUrl.expect("Failed to parameterise library_count_endpoint")).bearer_auth(token).send().await?;

    let library_check = res.json::<SavedTracks>().await?;

    Ok(library_check.total)
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

// Generates both a code verifier and a code challenge
fn generate_pkce_code() -> (Vec<u8>, String) {
    let code_verify: Vec<u8> = pkce::code_verifier(128);
    let code_challenge: String = pkce::code_challenge(&code_verify);

    println!("Code challenge generated: {}", code_challenge);

    (code_verify, code_challenge)
}