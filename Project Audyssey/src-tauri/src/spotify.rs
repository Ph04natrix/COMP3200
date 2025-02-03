use tauri::{window, State, Url, Window};
use tauri_plugin_http::reqwest::*;

use crate::{AccessToken, AppState, MyError};

pub enum LoginState {
    LoggedOut,
    GrantingAuth,
    LoggedIn
}

/* // TODO implement the PKCE authorisation flow to allow a user to be authenticated

add an intermediary loading screen between the login and main home page, if its the first time the user is granting access

then change the window from the login screen to the main home page

instead of putting things in the localStorage, put it in the store.json (do this in login.tsx)

*/

#[tauri::command]
pub async fn make_request(){
  
}

// This function results in the user being prompted to login to their Apotify Account and grant access
// via the OAuth protocol. //* Request User Authorization
#[tauri::command]
pub async fn start_login(state: State<'_, AppState>) -> Result<String>{ 
    let mut state_lock = state.lock().unwrap();
    
    let (codeVerifier, codeChallenge) = generate_pkce_code();
    state_lock.CodeVerifier = String::from_utf8(codeVerifier).expect("Could not convert code verifier to a String");
    let clientID = &state_lock.ClientID;
    let redirectURI = &state_lock.Redirect;

    // Create the parameters to send off the get request which triggers the OAuth process
    let client = Client::new();
    let params: [(&str, &str); 6] = [
        ("client_id", clientID),
        ("response_type", "code"),
        ("redirect_uri", redirectURI),
        ("scope", "user-read-private user-read-email"),
        ("code_challenge_method", "256"),
        ("code_challenge", &codeChallenge),
    ];

    let authEndpoint = "https://accounts.spotify.com/authorize".to_string();
    let url = Url::parse_with_params(&authEndpoint, &params); //?;
    let _res = client
        .get(url.expect("Failed to parameterise authEndpoint URL"))
        .send()
        .await;

    // todo after the user completes the OAuth, they get redirected to the redirectURI, which I then check for to do next step
    // ? what happens if the user doesn't accept the OAuth
    // do the frontend, so can user test

    Ok("OAuth has started".to_string())
}

//#[tauri::command]
pub async fn request_access_code(
    authResponse: Result<String>,
    state: State<'_, AppState>
) -> Result<()> {
    let code: String = match authResponse.into() {
        Ok(code) => code,
        Err(e) => return Err(e),
    };

    let mut state_lock = state.lock().unwrap();
    let redirectURI = &state_lock.Redirect;
    let clientID = &state_lock.ClientID;
    let codeVerifier = &state_lock.CodeVerifier;

    let client = Client::new();
    let params = [
        ("grant_type", "authorization_code"),
        ("code", &code),
        ("redirect_uri", redirectURI),
        ("client_id", clientID),
        ("code_verifier", codeVerifier)
    ];

    let tokenEndpoint = "https://accounts.spotify.com/api/token".to_string();
    let url = Url::parse_with_params(&tokenEndpoint, &params);
    let res = client
        .post(url.expect("Failed to send POST request"))
        .header("Content-Type", "application/x-ww-form-urlencoded")
        .send()
        .await;

    let body = res.unwrap().json::<AccessToken>().await;
    state_lock.AccessToken = body.expect("Failed to get content from access token request response");
    print!("Access token successfully acquired");
    
    Ok(())
}



// Generates both a code verifier and a code challenge
fn generate_pkce_code() -> (Vec<u8>, String) {
    let code_verify: Vec<u8> = pkce::code_verifier(128);
    let code_challenge: String = pkce::code_challenge(&code_verify);

    println!("Code challenge generated: {}", code_challenge);

    (code_verify, code_challenge)
}