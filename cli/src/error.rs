use thiserror::Error;

#[derive(Debug, Error)]
pub(crate) enum AppError {
    #[error("Not logged in")]
    NotLoggedIn,

    #[error("No host set")]
    NoHostSet,

    #[error("Request error")]
    RequestError(reqwest::Error),

    #[error("IO error")]
    IoError(std::io::Error),

    #[error("JSON error")]
    JsonError(serde_json::Error),

    #[error("Bad response: {0}")]
    BadResponse(String)
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> AppError {
        AppError::RequestError(err)
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> AppError {
        AppError::IoError(err)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> AppError {
        AppError::JsonError(err)
    }
}
