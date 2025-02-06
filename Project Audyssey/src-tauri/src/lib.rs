use tokio::sync::Mutex;
use serde::Deserialize;
use spotify::LoginState;
use tauri::{Builder, Manager};

mod spotify;
mod error;

pub struct AppStateInner {
  ClientID: String,
  ClientSecret: String,
  Redirect: String,
  Login: LoginState,
  AccessToken: AccessToken,
  CodeVerifier: String,
}

impl AppStateInner {
    fn default() -> Self {
        AppStateInner {
            ClientID: "71362bad121c4dd5be0fd0794119454b".to_string(),
            ClientSecret: "f8f9676547104ee080c3b61c1276b9c6".to_string(),
            Redirect: String::from("http://localhost:1420/login"),
            Login: LoginState::LoggedOut,
            AccessToken: AccessToken::default(),
            CodeVerifier: "".to_string()
        }
    }
}

pub type AppState = Mutex<AppStateInner>;

#[derive(Deserialize, Default)]
struct AccessToken {
    access_token: String,
    token_type: String,
    scope: String,
    expires_in: u32,
    refresh_token: String
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {// Sets up the state for the application
            app.manage(Mutex::new(AppStateInner::default()));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            spotify::start_login, spotify::request_access_token,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
