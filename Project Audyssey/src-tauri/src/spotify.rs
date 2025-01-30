use tauri::State;

use crate::AppState;

pub enum LoginState {
    LoggedOut,
    GrantingAuth,
    LoggedIn
}

#[tauri::command]
pub async fn make_request(){
  
}

#[tauri::command]
pub fn start_login(state: State<'_, AppState>) { 
    let mut state_lock = state.lock().unwrap();
    
}