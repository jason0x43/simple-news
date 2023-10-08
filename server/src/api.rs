use axum::{response::IntoResponse, Extension, Json};
use log::info;
use sqlx::query;

use crate::{
    db::{Password, User},
    error::AppError,
    state::AppState,
    types::CreateUserRequest,
};

impl IntoResponse for User {
    fn into_response(self) -> axum::response::Response {
        Json(self).into_response()
    }
}

pub(crate) async fn create_user(
    Extension(state): Extension<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<User, AppError> {
    let user = User::create(body.email.clone(), body.username.clone());
    let password = Password::create(body.password.clone(), user.id.clone());
    let mut tx = state.pool.begin().await?;

    query!(
        r#"
        INSERT INTO users (id, email, username)
        VALUES (?1, ?2, ?3)
        "#,
        user.id,
        user.email,
        user.username
    )
    .execute(&mut *tx)
    .await?;

    query!(
        r#"
        INSERT INTO passwords (id, hash, salt, user_id)
        VALUES (?1, ?2, ?3, ?4)
        "#,
        password.id,
        password.hash,
        password.salt,
        password.user_id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    info!("Created user: {}", user.username);

    Ok(user)
}

pub(crate) async fn get_articles() -> Result<String, AppError> {
    Ok("Some articles".into())
}
