use tauri::{State, Url};
use tauri_plugin_http::reqwest::*;

use crate::{
    AccessToken,
    AppState,
    error::{MyError, MyResult}
};

pub enum LoginState {
    LoggedOut,
    GrantingAuth,
    LoggedIn
}

pub enum SpotifyEndpoints {
    SavedTracks,
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
        SpotifyEndpoints::SavedTracks => "me/tracks"
    };

    let mut url: String = SPOTIFY_API.to_string();
    url += specific_endpoint;

    let state_lock = state.lock().await;
    let token = &state_lock.AccessToken.access_token;

    let method = Method::GET;

    let client = Client::new();
    client.request(method, url).bearer_auth(token);

    Ok("Request built".to_string())

  
}

// This function results in the user being prompted to login to their Apotify Account and grant access
// via the OAuth protocol. //* Request User Authorization
#[tauri::command]
pub async fn start_login(
    state: State<'_, AppState>
) -> MyResult<String>{ 
    let mut state_lock = state.lock().await;
    
    let (codeVerifier, codeChallenge) = generate_pkce_code();
    state_lock.CodeVerifier = String::from_utf8(codeVerifier).expect("Could not convert code verifier to a String");
    let clientID = &state_lock.ClientID;
    let redirectURI = &state_lock.Redirect;

    // Create the parameters to send off the get request which triggers the OAuth process
    
    let params: [(&str, &str); 6] = [
        ("client_id", clientID),
        ("response_type", "code"),
        ("redirect_uri", redirectURI),
        ("scope", "user-read-private user-read-email"),
        ("code_challenge_method", "S256"),
        ("code_challenge", &codeChallenge),
    ];

    let auth_endpoint = "https://accounts.spotify.com/authorize".to_string();
    let auth_url = Url::parse_with_params(&auth_endpoint, &params);

    match auth_url {
        Ok(url) => Ok(url.to_string()),
        Err(err) => Err(MyError::URLParse(err))
    }

    // todo instead of changing the url of this window, open a new window so that the result can 
    
}

#[tauri::command]
pub async fn request_access_token(
    auth_code: String,
    state: State<'_, AppState>
) -> MyResult<String> {
    let mut state_lock = state.lock().await;
    let redirectURI = &state_lock.Redirect;
    let clientID = &state_lock.ClientID;
    let code_verifier = &state_lock.CodeVerifier;
    
    let params = [
        ("grant_type", "authorization_code"),
        ("code", &auth_code),
        ("redirect_uri", redirectURI),
        ("client_id", clientID),
        ("code_verifier", code_verifier)
    ];

    let token_endpoint = "https://accounts.spotify.com/api/token".to_string();
    println!("Parameterised Token Endpoint: {token_endpoint}");
    
    let url = Url::parse_with_params(&token_endpoint, &params);
    
    let client = Client::new();
    let res = client
        .post(url.expect("Failed to send POST request"))
        .header("Content-Type", "application/x-ww-form-urlencoded")
        .send()
        .await;

    let body = res.unwrap().json::<AccessToken>().await;
    state_lock.AccessToken = body.expect("Failed to get content from access token request response");
    
    print!("Access token successfully acquired");
    
    Ok(String::from("Thank you for granting access! Welcome to the Audyssey"))
}

// Generates both a code verifier and a code challenge
fn generate_pkce_code() -> (Vec<u8>, String) {
    let code_verify: Vec<u8> = pkce::code_verifier(128);
    let code_challenge: String = pkce::code_challenge(&code_verify);

    println!("Code challenge generated: {}", code_challenge);

    (code_verify, code_challenge)
}