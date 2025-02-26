use tauri_plugin_http::reqwest;

pub type MyResult<T> = std::result::Result<T, MyError>;

#[derive(Debug, thiserror::Error)]
pub enum MyError {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),
  #[error(transparent)]
  SerdeJSON(#[from] serde_json::Error),
  #[error("Failed to handle ParseError")]
  URLParse(#[from] url::ParseError),
  #[error("Authentication error: {error:?}, {error_description:?}")]
  SpotifyAuthError {
    error: String,
    error_description: String,
  },
  #[error("Spotify API request fail with error code {code:?}, because: {message:?}")]
  SpotifyAPI {
    code: u16,
    message: String,
  },
}

// we must manually implement serde::Serialize
impl serde::Serialize for MyError {
  fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}