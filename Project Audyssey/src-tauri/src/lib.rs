use std::sync::Mutex;
use serde_json::json;
use spotify::LoginState;
use tauri::{Builder, Manager};
use tauri_plugin_store::*;

struct AppStateInner {
  ClientID: String,
  ClientSecret: String,
  Login: LoginState,
  AccessToken: String,
}

impl AppStateInner {
    fn default() -> Self {
        AppStateInner {
            ClientID: "71362bad121c4dd5be0fd0794119454b".to_string(),
            ClientSecret: "f8f9676547104ee080c3b61c1276b9c6".to_string(),
            Login: LoginState::LoggedOut,
            AccessToken: "".to_string()
        }
    }
}

type AppState = Mutex<AppStateInner>;

mod spotify;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .setup(|app| {// Sets up the state for the application
            //app.manage(Mutex::new(AppStateInner::default()));

            let store = app.store("store.json")?;

            // Note that values must be serde_json::Value instances,
            // otherwise, they will not be compatible with the JavaScript bindings.
            store.set("client-id", json!({ "value": "71362bad121c4dd5be0fd0794119454b" }));
            store.set("client-secret", json!({ "value": "f8f9676547104ee080c3b61c1276b9c6"}));
            // store.set("access-token", json!({"value": ""}));

            // Get a value from the store.
            let value = store.get("client-id").expect("Failed to get client-id from store");
            println!("{}", value); // {"value":5}

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            spotify::make_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
