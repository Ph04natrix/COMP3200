use std::{fs::File, path::PathBuf};

use flecs_ecs::core::World;
use tokio::sync::Mutex;
use serde::Deserialize;
use tauri::{Builder, Manager};

mod api;
use api::{authorization, conversion, soundcharts, spotify};

mod ecs;
use ecs::types::{self, AudysseyModule};

mod error;
use error::MyResult;

pub struct AppStateInner {
  client_id: String,
  client_secret: String,
  redirect: String,
  AccessToken: AccessToken,
  code_verifier: String,
  ecs_world: World,
  main_directory: PathBuf
}

pub type AppState = Mutex<AppStateInner>;

#[derive(Deserialize, Default)]
struct AccessToken {
    access_token: String, // An access token that can be provided in subsequent calls
    token_type: String, // How the access token may be used: always "Bearer"
    scope: String, // A space-separated list of scopes which have been granted for this access_token
    expires_in: u32, // The time period (in seconds) for which the access token is valid
    refresh_token: String // Used to refresh an expired access token
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {// Sets up the state for the application
            let mut app_dir = app.path().data_dir().expect("Couldn't find app data directory");
            app_dir.push("Project Audyssey\\audyssey_deep_storage.json");

            if let Err(_) = File::create_new(&app_dir) {
                println!("Did not create audyssey_deep_storage.json as it already exists.")
            };
            
            let state = AppStateInner {
                client_id: "71362bad121c4dd5be0fd0794119454b".to_string(),
                client_secret: "f8f9676547104ee080c3b61c1276b9c6".to_string(),
                redirect: String::from("http://localhost:1420/login"),
                AccessToken: AccessToken::default(),
                code_verifier: "".to_string(),
                ecs_world: World::new(),
                main_directory: app_dir
            };
            state.ecs_world.import::<AudysseyModule>();

            // Can put state in a RwLock to allow multiple threads to read a value at once
            // flecs::World doesn't implement Send + Sync, so need to impl those traits due
            // to them coming from C bindings: https://docs.rs/tokio/latest/tokio/sync/struct.RwLock.html
            app.manage(Mutex::new(state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exit_app,
            authorization::request_auth_code, authorization::request_access_token, authorization::refresh_access_token,
            spotify::get_user_library_count, spotify::get_user_full_library, spotify::compare_library_with_ecs,
            conversion::file_to_ecs_cmd, conversion::serialize_ecs_to_file,
            soundcharts::song_without_attributes_count, soundcharts::fill_song_attributes,
            types::get_songs_for_static_graph, types::get_song_extras
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn exit_app(
    app: tauri::AppHandle,
) -> MyResult<()> {
    Ok(app.exit(0))
}