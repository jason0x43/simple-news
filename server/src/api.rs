use axum::{response::IntoResponse, Extension, Json};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use log::{error, info};
use sqlx::query;
use uuid::Uuid;

use crate::{
    error::AppError,
    state::AppState,
    types::{
        CreateSessionRequest, CreateUserRequest, Password, Session,
        SessionResponse, User,
    },
    util::check_password,
};

impl IntoResponse for User {
    fn into_response(self) -> axum::response::Response {
        Json(self).into_response()
    }
}

impl IntoResponse for Session {
    fn into_response(self) -> axum::response::Response {
        let sess = SessionResponse {
            id: self.id,
            expires: self.expires,
        };
        Json(sess).into_response()
    }
}

pub(crate) async fn create_user(
    Extension(state): Extension<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<User, AppError> {
    let user = User::create(body.email.clone(), body.username.clone());
    let password = Password::create(body.password.clone(), user.id.clone());

    info!("Creating user {}", body.username);

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

pub(crate) async fn create_session(
    Extension(state): Extension<AppState>,
    jar: CookieJar,
    Json(body): Json<CreateSessionRequest>,
) -> Result<(CookieJar, Session), AppError> {
    info!("Logging in user {}", body.username);

    let user = query!(
        r#"SELECT id AS "id!: Uuid" FROM users WHERE username = ?1"#,
        body.username
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|_| AppError::UserNotFound)?;

    let password = query!(
        r#"SELECT hash, salt FROM passwords WHERE user_id = ?1"#,
        user.id
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|_| AppError::NoPassword)?;

    check_password(body.password, password.hash, password.salt)?;

    info!("Verified user");

    let session = Session::create(user.id);

    info!("Created session");

    query!(
        r#"
        INSERT INTO sessions (id, data, user_id, expires)
        VALUES (?1, ?2, ?3, ?4)
        "#,
        session.id,
        session.data,
        session.user_id,
        session.expires
    )
    .execute(&state.pool)
    .await
    .map_err(|err| {
        error!("Error creating session: {}", err);
        AppError::SqlxError(err)
    })?;

    Ok((
        jar.add(Cookie::new("session_id", session.id.to_string())),
        session,
    ))
}

pub(crate) async fn get_articles(jar: CookieJar) -> Result<String, AppError> {
    if let Some(_) = jar.get("session_id") {
        info!("Got articles");
        Ok("Some articles".into())
    } else {
        Err(AppError::Unauthorized)
    }
}
