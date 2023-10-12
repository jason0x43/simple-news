use std::sync::Arc;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
    response::{IntoResponse, Response},
};
use axum_extra::extract::CookieJar;
use log::error;
use sqlx::query_as;
use uuid::Uuid;

use crate::{error::AppError, state::AppState, types::Session};

#[async_trait]
impl FromRequestParts<Arc<AppState>> for Session {
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let state = Arc::from_ref(state);

        let jar = CookieJar::from_request_parts(parts, &state)
            .await
            .map_err(|err| err.into_response())?;
        if let Some(id_cookie) = jar.get("session_id") {
            let id: String = id_cookie.to_string();
            query_as!(
                Session,
                r#"
                SELECT id as "id: Uuid", data, expires,
                user_id as "user_id: Uuid"
                FROM sessions WHERE id = ?1
                "#,
                id
            )
            .fetch_one(&state.pool)
            .await
            .map_err(|err| {
                error!("Error creating session: {}", err);
                AppError::SqlxError(err).into_response()
            })
        } else {
            Err(AppError::Unauthorized.into_response())
        }
    }
}
