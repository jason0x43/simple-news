use thiserror::Error;

#[derive(Debug, Error)]
pub(crate) enum AppError {
    #[error("Not logged in")]
    NotLoggedIn,

    #[error("No host set")]
    NoHostSet,

    #[error("Bad response: {0}")]
    BadResponse(String),

    #[error("{0}")]
    Error(String)
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> AppError {
        AppError::Error(format!("Request: {}", err))
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> AppError {
        AppError::Error(format!("IO: {}", err))
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> AppError {
        AppError::Error(format!("JSON: {}", err))
    }
}

impl From<uuid::Error> for AppError {
    fn from(err: uuid::Error) -> AppError {
        AppError::Error(format!("UUID: {}", err))
    }
}

impl From<url::ParseError> for AppError {
    fn from(err: url::ParseError) -> AppError {
        AppError::Error(format!("UUID: {}", err))
    }
}
