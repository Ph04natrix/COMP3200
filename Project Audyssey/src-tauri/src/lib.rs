use tokio::sync::Mutex;
use serde::Deserialize;
use tauri::{Builder, Manager};

mod spotify;
mod error;

pub struct AppStateInner {
  client_id: String,
  client_secret: String,
  redirect: String,
  //Login: LoginState,
  AccessToken: AccessToken,
  code_verifier: String,
}

impl AppStateInner {
    fn default() -> Self {
        AppStateInner {
            client_id: "71362bad121c4dd5be0fd0794119454b".to_string(),
            client_secret: "f8f9676547104ee080c3b61c1276b9c6".to_string(),
            redirect: String::from("http://localhost:1420/login"),
            //Login: LoginState::LoggedOut,
            AccessToken: AccessToken::default(),
            code_verifier: "".to_string()
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
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            exit_app,
            spotify::request_auth_code, spotify::request_access_token, spotify::get_users_saved_tracks,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn exit_app(app: tauri::AppHandle) {
  app.exit(0);
}