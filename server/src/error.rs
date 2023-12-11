use std::{string::FromUtf8Error, str::Utf8Error};

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use handlebars::RenderError;
use lol_html::errors::RewritingError;
use reqwest::header::ToStrError;
use sqlx::migrate::MigrateError;
use thiserror::Error;
use time::error::ComponentRange;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("User not found")]
    UserNotFound,

    #[error("Session not found")]
    SessionNotFound,

    #[error("Unauthorized")]
    Unauthorized,

    #[error("sqlx error: {0}")]
    SqlxError(sqlx::Error),

    #[error("reqwest error: {0}")]
    ReqwestError(reqwest::Error),

    #[error("file not found: {0}")]
    FileNotFound(String),

    #[error("error: {0}")]
    Error(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::UserNotFound => {
                (StatusCode::NOT_FOUND, self.to_string()).into_response()
            }
            AppError::FileNotFound(msg) => {
                (StatusCode::NOT_FOUND, msg).into_response()
            }
            AppError::SessionNotFound => {
                (StatusCode::NOT_FOUND, self.to_string()).into_response()
            }
            AppError::Unauthorized => {
                (StatusCode::UNAUTHORIZED, self.to_string()).into_response()
            }
            AppError::ReqwestError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
                    .into_response()
            }
            AppError::SqlxError(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
                    .into_response()
            }
            AppError::Error(err) => {
                (StatusCode::INTERNAL_SERVER_ERROR, err).into_response()
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

impl From<url::ParseError> for AppError {
    fn from(err: url::ParseError) -> AppError {
        AppError::Error(format!("URL: {}", err))
    }
}

impl From<ToStrError> for AppError {
    fn from(err: ToStrError) -> AppError {
        AppError::Error(format!("to string: {}", err))
    }
}

impl From<ComponentRange> for AppError {
    fn from(err: ComponentRange) -> AppError {
        AppError::Error(format!("time component range: {}", err))
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> AppError {
        AppError::Error(format!("JSON: {}", err))
    }
}

impl From<time::error::Parse> for AppError {
    fn from(err: time::error::Parse) -> AppError {
        AppError::Error(format!("time: {}", err))
    }
}

impl From<RewritingError> for AppError {
    fn from(err: RewritingError) -> AppError {
        AppError::Error(format!("HTML rewriting: {}", err))
    }
}

impl From<FromUtf8Error> for AppError {
    fn from(err: FromUtf8Error) -> AppError {
        AppError::Error(format!("UTF8: {}", err))
    }
}

impl From<Utf8Error> for AppError {
    fn from(err: Utf8Error) -> AppError {
        AppError::Error(format!("UTF8: {}", err))
    }
}

impl From<RenderError> for AppError {
    fn from(err: RenderError) -> AppError {
        AppError::Error(format!("HTML rendering: {}", err))
    }
}

impl From<MigrateError> for AppError {
    fn from(err: MigrateError) -> AppError {
        AppError::Error(format!("database migration: {}", err))
    }
}
