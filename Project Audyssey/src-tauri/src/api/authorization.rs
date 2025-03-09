use serde::{Serialize, Deserialize};
use tauri::{State, Url};
use tauri_plugin_http::reqwest::*;

use crate::{
    AccessToken,
    AppState,
    error::{MyError, MyResult}
};

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthenticationErrorObject {
    error: String,
    error_description: String,
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
    
    let client = Client::new();
    let res = client
        .post(token_endpoint)
        .form(&params)
        .send()
        .await?;

    match res.error_for_status() {
        Ok(r) => {
            state_lock.AccessToken = r.json::<AccessToken>().await?;
            let access_token = &state_lock.AccessToken.access_token;
            println!("Access token successfully acquired: {access_token}");
    
            Ok(state_lock.AccessToken.access_token.clone())
        },
        Err(e) => {
            eprintln!("Acess token request failed: {e:?}");
            Err(MyError::Reqwest(e))
        }   
    }
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
    
    let client = Client::new();
    let res = client
        .post(token_endpoint)
        .form(&params)
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
        let err_msg = res.json::<AuthenticationErrorObject>().await?;
        Err(MyError::SpotifyAuthError {
            error: err_msg.error,
            error_description: err_msg.error_description
        })
    }
}

// Generates both a code verifier and a code challenge
fn generate_pkce_code() -> (Vec<u8>, String) {
    let code_verify: Vec<u8> = pkce::code_verifier(128);
    let code_challenge: String = pkce::code_challenge(&code_verify);

    println!("Code challenge generated: {}", code_challenge);

    (code_verify, code_challenge)
}