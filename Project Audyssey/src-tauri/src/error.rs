use std::fmt::{self, write};

use tauri_plugin_http::reqwest;

pub type MyResult<T> = std::result::Result<T, MyError>;

#[derive(Debug, thiserror::Error)]
pub enum MyError {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error("Failed to handle reqwest error")]
  Reqwest(#[from] reqwest::Error),
  #[error("Failed to handle ParseError")]
  URLParse(#[from] url::ParseError)
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