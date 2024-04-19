use std::io::{Error, ErrorKind};

use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
    response::Response,
};

use crate::{
    error::AppError,
    state::AppState,
    types::{Session, SessionId},
};

#[async_trait]
impl FromRequestParts<AppState> for Session {
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let bearer_str: String = parts
            .headers
            .get(AUTHORIZATION)
            .ok_or(Into::<Response>::into(AppError::Unauthorized))?
            .to_str()
            .map_err(|_| Into::<Response>::into(AppError::Unauthorized))?
            .into();
        let session_id = SessionId::from_authorization_header(&bearer_str)
            .map_err(|_| Into::<Response>::into(AppError::Unauthorized))?;
        log::debug!("Session ID: {}", session_id);
        Session::get(&state.pool, &session_id)
            .await
            .map_err(|_| AppError::Unauthorized.into())
    }
}

#[allow(dead_code)]
pub(crate) struct AdminSession(Session);

#[async_trait]
impl FromRequestParts<AppState> for AdminSession {
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let session = Session::from_request_parts(parts, state).await?;
        Ok(AdminSession(session))
    }
}

impl SessionId {
    pub(crate) fn from_authorization_header(
        value: &str,
    ) -> std::io::Result<Self> {
        let parts = value.split(' ');
        let id = parts.last().ok_or(Error::new(ErrorKind::Other, "oh no!"))?;
        Ok(SessionId(id.to_string()))
    }
}
