use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
    response::{IntoResponse, Response, Redirect},
};
use axum_extra::extract::CookieJar;

use crate::{
    error::AppError,
    state::AppState,
    types::{Session, SessionId},
};

/// An extractor to retrieve the current Session
#[async_trait]
impl FromRequestParts<AppState> for Session {
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_request_parts(parts, &state)
            .await
            .map_err(|err| err.into_response())?;
        if let Some(id_cookie) = jar.get("session_id") {
            let id = SessionId(id_cookie.value().to_string());
            let mut conn = state.pool.acquire().await.map_err(|err| {
                log::error!("Error getting db connection: {}", err);
                AppError::SqlxError(err).into_response()
            })?;
            Session::get(&mut conn, &id).await.map_err(|err| {
                log::error!("Error loading session: {}", err);
                err.into_response()
            })
        } else {
            Err(Redirect::temporary("/login").into_response())
        }
    }
}
