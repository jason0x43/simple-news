use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use thiserror::Error;

#[derive(Debug, Error)]
pub(crate) enum AppError {
    #[error("User not found")]
    UserNotFound,

    #[error("No password set")]
    NoPassword,

    #[error("Unauthorized")]
    Unauthorized,

    #[error("sqlx error: {0}")]
    SqlxError(sqlx::Error),

    #[error("reqwest error: {0}")]
    ReqwestError(reqwest::Error),

    #[error("rss error: {0}")]
    RssError(rss::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::UserNotFound => {
                (StatusCode::NOT_FOUND, self.to_string()).into_response()
            }
            AppError::Unauthorized => {
                (StatusCode::UNAUTHORIZED, self.to_string()).into_response()
            }
            AppError::NoPassword => {
                (StatusCode::NOT_FOUND, self.to_string()).into_response()
            }
            AppError::ReqwestError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
                    .into_response()
            }
            AppError::SqlxError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
                    .into_response()
            }
            AppError::RssError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
                    .into_response()
            }
        }
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> AppError {
        AppError::SqlxError(err)
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> AppError {
        AppError::ReqwestError(err)
    }
}

impl From<rss::Error> for AppError {
    fn from(err: rss::Error) -> AppError {
        AppError::RssError(err)
    }
}
